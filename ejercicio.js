
// <============================================ EJERCICIOS ============================================>
// a) Implementar la función:
//
//      GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
//
//    Si la implementación es correcta, podrán hacer rotar la caja correctamente (como en el video). Notar 
//    que esta función no es exactamente la misma que implementaron en el TP4, ya que no recibe por parámetro
//    la matriz de proyección. Es decir, deberá retornar solo la transformación antes de la proyección model-view (MV)
//    Es necesario completar esta implementación para que funcione el control de la luz en la interfaz. 
//    IMPORTANTE: No es recomendable avanzar con los ejercicios b) y c) si este no funciona correctamente. 
//
// b) Implementar los métodos:
//
//      setMesh( vertPos, texCoords, normals )
//      swapYZ( swap )
//      draw( matrixMVP, matrixMV, matrixNormal )
//
//    Si la implementación es correcta, podrán visualizar el objeto 3D que hayan cargado, asi como también intercambiar 
//    sus coordenadas yz. Notar que es necesario pasar las normales como atributo al VertexShader. 
//    La función draw recibe ahora 3 matrices en column-major: 
//
//       * model-view-projection (MVP de 4x4)
//       * model-view (MV de 4x4)
//       * normal transformation (MV_3x3)
//
//    Estas últimas dos matrices adicionales deben ser utilizadas para transformar las posiciones y las normales del 
//    espacio objeto al esapcio cámara. 
//
// c) Implementar los métodos:
//
//      setTexture( img )
//      showTexture( show )
//
//    Si la implementación es correcta, podrán visualizar el objeto 3D que hayan cargado y su textura.
//    Notar que los shaders deberán ser modificados entre el ejercicio b) y el c) para incorporar las texturas.
//  
// d) Implementar los métodos:
//
//      setLightDir(x,y,z)
//      setShininess(alpha)
//    
//    Estas funciones se llaman cada vez que se modifican los parámetros del modelo de iluminación en la 
//    interface. No es necesario transformar la dirección de la luz (x,y,z), ya viene en espacio cámara.
//
// Otras aclaraciones: 
//
//      * Utilizaremos una sola fuente de luz direccional en toda la escena
//      * La intensidad I para el modelo de iluminación debe ser seteada como blanca (1.0,1.0,1.0,1.0) en RGB
//      * Es opcional incorporar la componente ambiental (Ka) del modelo de iluminación
//      * Los coeficientes Kd y Ks correspondientes a las componentes difusa y especular del modelo 
//        deben ser seteados con el color blanco. En caso de que se active el uso de texturas, la 
//        componente difusa (Kd) será reemplazada por el valor de textura. 
//        
// <=====================================================================================================>

// Esta función recibe la matriz de proyección (ya calculada), una 
// traslación y dos ángulos de rotación (en radianes). Cada una de 
// las rotaciones se aplican sobre el eje x e y, respectivamente. 
// La función debe retornar la combinación de las transformaciones 
// 3D (rotación, traslación y proyección) en una matriz de 4x4, 
// representada por un arreglo en formato column-major. 

function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [COMPLETAR] Modificar el código para formar la matriz de transformación.
	var rotationXMatrix = [
		1, 0, 0, 0,
		0, Math.cos(rotationX), Math.sin(rotationX), 0,
		0, -Math.sin(rotationX), Math.cos(rotationX), 0,
		0, 0, 0, 1
	]

	var rotationYMatrix = [
		Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
		0, 1, 0, 0,
		Math.sin(rotationY), 0, Math.cos(rotationY), 0,
		0, 0, 0, 1
	]

	// Matriz de traslación
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	var mv = MatrixMult(trans, MatrixMult( rotationXMatrix, rotationYMatrix ));
	return mv;
}

// [COMPLETAR] Completar la implementación de esta clase.
class MeshDrawer
{
	// El constructor es donde nos encargamos de realizar las inicializaciones necesarias. 
	constructor()
	{
		// [COMPLETAR] inicializaciones

		// 1. Compilamos el programa de shaders
		this.prog   = InitShaderProgram( meshVS, meshFS );

		// 2. Obtenemos los IDs de las variables uniformes en los shaders
		this.swap = gl.getUniformLocation( this.prog, 'swap' );
		this.renderTex = gl.getUniformLocation( this.prog, 'renderTex' );
		this.mvp = gl.getUniformLocation( this.prog, 'mvp' );
		this.mv = gl.getUniformLocation( this.prog, 'mv' );
		this.mn = gl.getUniformLocation( this.prog, 'mn' );
		this.light = gl.getUniformLocation( this.prog, 'light' );
		this.alpha = gl.getUniformLocation( this.prog, 'alpha' );

		// 3. Obtenemos los IDs de los atributos de los vértices en los shaders
		this.vertPos = gl.getAttribLocation( this.prog, 'pos' );
		this.normPos = gl.getAttribLocation( this.prog, 'normpos' );
		this.textPos = gl.getAttribLocation( this.prog, 'texcord' );

		// 4. Creamos los buffers
		this.buffer = gl.createBuffer();
		this.texBuffer = gl.createBuffer();
		this.normBuffer = gl.createBuffer();

		// ...
	}
	
	// Esta función se llama cada vez que el usuario carga un nuevo
	// archivo OBJ. En los argumentos de esta función llegan un areglo
	// con las posiciones 3D de los vértices, un arreglo 2D con las
	// coordenadas de textura y las normales correspondientes a cada 
	// vértice. Todos los items en estos arreglos son del tipo float. 
	// Los vértices y normales se componen de a tres elementos 
	// consecutivos en el arreglo vertPos [x0,y0,z0,x1,y1,z1,..] y 
	// normals [n0,n0,n0,n1,n1,n1,...]. De manera similar, las 
	// cooredenadas de textura se componen de a 2 elementos 
	// consecutivos y se  asocian a cada vértice en orden. 
	setMesh( vertPos, texCoords, normals )
	{
		// [COMPLETAR] Actualizar el contenido del buffer de vértices y otros atributos..
		this.numTriangles = vertPos.length / 3 / 3;

		// 1. Binding y seteo del buffer de vértices
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// 2. Binding y seteo del buffer de coordenadas de textura
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		// 3. Binding y seteo del buffer de normales
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

	}
	
	// Esta función se llama cada vez que el usuario cambia el estado del checkbox 'Intercambiar Y-Z'
	// El argumento es un boleano que indica si el checkbox está tildado
	swapYZ( swap )
	{
		// [COMPLETAR] Setear variables uniformes en el vertex shader
		gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
		gl.useProgram( this.prog );
		gl.uniform1i( this.swap, swap );
	}
	
	// Esta función se llama para dibujar la malla de triángulos
	// El argumento es la matriz model-view-projection (matrixMVP),
	// la matriz model-view (matrixMV) que es retornada por 
	// GetModelViewProjection y la matriz de transformación de las 
	// normales (matrixNormal) que es la inversa transpuesta de matrixMV
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [COMPLETAR] Completar con lo necesario para dibujar la colección de triángulos en WebGL
		
		// 1. Seleccionamos el shader
		gl.useProgram( this.prog );

		// 2. Setear uniformes con las matrices de transformaciones
		gl.uniformMatrix4fv( this.mvp, false, matrixMVP );
		gl.uniformMatrix4fv( this.mv, false, matrixMV );
		gl.uniformMatrix3fv( this.mn, false, matrixNormal );

   		// 3. Habilitar atributos: vértices, normales, texturas
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);	
		gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPos );

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);	
		gl.vertexAttribPointer( this.normPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.normPos );

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);	
		gl.vertexAttribPointer( this.textPos, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.textPos );

		gl.clear( gl.COLOR_BUFFER_BIT );
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles * 3 );
	}
	
	// Esta función se llama para setear una textura sobre la malla
	// El argumento es un componente <img> de html que contiene la textura. 
	setTexture( img )
	{
		// [COMPLETAR] Binding de la textura

		// Pueden setear la textura utilizando esta función:
		// gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );
		const textura = gl.createTexture();
		gl.bindTexture( gl.TEXTURE_2D, textura);
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap( gl.TEXTURE_2D ); 
		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_2D, textura);


		// [COMPLETAR] Ahora que la textura ya está seteada, debemos setear 
		// parámetros uniformes en el fragment shader para que pueda usarla. 
		gl.useProgram(this.prog );
		gl.uniform1i( this.renderTex, true );

	}
		
        // Esta función se llama cada vez que el usuario cambia el estado del checkbox 'Mostrar textura'
	// El argumento es un boleano que indica si el checkbox está tildado
	showTexture( show )
	{
		// [COMPLETAR] Setear variables uniformes en el fragment shader para indicar si debe o no usar la textura
		var sampler = gl.getUniformLocation(this.prog, 'texGPU' );
		gl.useProgram(this.prog );
		gl.uniform1i(sampler, 0 ); // Unidad 0
		gl.uniform1i( this.renderTex, show );
	}
	
	// Este método se llama al actualizar la dirección de la luz desde la interfaz
	setLightDir( x, y, z )
	{		
		// [COMPLETAR] Setear variables uniformes en el fragment shader para especificar la dirección de la luz
		gl.useProgram(this.prog );
		gl.uniform3f( this.light, x, y, z);
	}
		
	// Este método se llama al actualizar el brillo del material 
	setShininess( shininess )
	{		
		// [COMPLETAR] Setear variables uniformes en el fragment shader para especificar el brillo.
		gl.useProgram(this.prog );
		gl.uniform1f( this.alpha, shininess);
	}
}



// [COMPLETAR] Calcular iluminación utilizando Blinn-Phong.

// Recordar que: 
// Si declarás las variables pero no las usás, es como que no las declaraste
// y va a tirar error. Siempre va punto y coma al finalizar la sentencia. 
// Las constantes en punto flotante necesitan ser expresadas como x.y, 
// incluso si son enteros: ejemplo, para 4 escribimos 4.0.

// Vertex Shader
var meshVS = `
	attribute vec3 pos;
	attribute vec3 normpos;
	attribute vec2 texcord;

	uniform mat4 mvp;
	uniform mat4 mv;
	uniform bool swap;

	varying vec2 texCoord;
	varying vec3 normCoord;
	varying vec4 vertCoord;

	void main()
	{
		if (swap) {
			gl_Position = mvp * vec4(pos.x, pos.z, pos.y, 1);
			vertCoord = normalize(-1.0 * mv * vec4(pos.x, pos.z, pos.y, 1));
			normCoord = vec3(normpos.x, normpos.z, normpos.y);
		} else {
			gl_Position = mvp * vec4(pos,1);
			vertCoord = normalize(-1.0 * mv * vec4(pos, 1));
			normCoord = normpos;
		}
		texCoord = texcord;
	}
`;

// Fragment Shader
// Algunas funciones útiles para escribir este shader:
// Dot product: https://thebookofshaders.com/glossary/?search=dot
// Normalize:   https://thebookofshaders.com/glossary/?search=normalize
// Pow:         https://thebookofshaders.com/glossary/?search=pow

var meshFS = `
	precision mediump float;

	uniform sampler2D texGPU;

	uniform mat3 mn;
	uniform bool renderTex;
	uniform vec3 light;
	uniform float alpha;

	varying vec2 texCoord;
	varying vec3 normCoord;
	varying vec4 vertCoord;

	void main()
	{	
		vec4 I = vec4(1.0, 1.0, 1.0, 1.0);
		vec4 Kd = vec4(1.0, 1.0, 1.0, 1.0);
		vec4 Ks = vec4(1.0, 1.0, 1.0, 1.0);

		vec3 n = normalize(mn * normCoord);
		vec3 l = normalize(light);
		vec3 r = normalize(2.0 * dot(l, n) * n - l);
		vec3 h = normalize(l + vec3(vertCoord.x, vertCoord.y, vertCoord.z));

		float cos_theta = dot(n, l);
		float cos_sigma = dot(vertCoord, vec4(r, 1) );
		float cos_omega = dot(n, h);

		if (renderTex) {
			Kd = texture2D(texGPU, texCoord);
		} 
	
		gl_FragColor = I * max(0.0, cos_theta) * (Kd + Ks * pow(max(0.0, cos_omega), alpha) / cos_theta);
		//gl_FragColor = vec4(1,1,1,1);
	}
`;
