
class BoxDrawer 
{
	constructor()
	{
		// 1. Compilamos el programa de shaders
		this.prog = InitShaderProgram( boxVS, boxFS );
		
		
		
		// 2. Obtenemos los IDs de las variables uniformes en los shaders
		this.mvp = gl.getUniformLocation( this.prog, 'mvp' );
		this.mv = gl.getUniformLocation( this.prog, 'mv' );
		this.mn = gl.getUniformLocation( this.prog, 'mn' );
		this.light = gl.getUniformLocation( this.prog, 'light' );
		this.alpha = gl.getUniformLocation( this.prog, 'alpha' );
		this.waterLevel = gl.getUniformLocation( this.prog, 'waterLevel' );
		
		// 3. Obtenemos los IDs de los atributos de los vértices en los shaders
		this.vertPos = gl.getAttribLocation( this.prog, 'pos' );
		this.normPos = gl.getAttribLocation( this.prog, 'normpos' );
		
		// 4. Creamos el buffer para los vertices				
		this.vertbuffer = gl.createBuffer();
		this.normBuffer = gl.createBuffer();

		var geometry = new SphericalCubeGeometry();

		// 8 caras del cubo unitario
		var triangleList = geometry.triangleList;
		this.numTriangles = triangleList.length / 3 / 3;

		var normals = geometry.normalsList;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleList), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
		gl.useProgram(this.prog );
		var waterLevel = (Math.random() * 0.2) + 0.9;
		gl.uniform1f( this.waterLevel, waterLevel);

	}
	

	// Esta función se llama para dibujar la caja
	draw( trans, matrixMV, matrixNormal )
	{
		// 1. Seleccionamos el shader
		gl.useProgram( this.prog );

		// 2. Setear matriz de transformacion
		gl.uniformMatrix4fv( this.mvp, false, trans );
		gl.uniformMatrix4fv( this.mv, false, matrixMV );
		gl.uniformMatrix3fv( this.mn, false, matrixNormal );

		 // 3.Binding del buffer de posiciones
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertbuffer );
		gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPos );

		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);	
		gl.vertexAttribPointer( this.normPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.normPos );

		// 5. Dibujamos
		
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles * 3 );
	}

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

// Vertex shader 
var boxVS = `
	precision mediump float;
	attribute vec3 pos;
	attribute vec3 normpos;

	uniform mat4 mvp;
	uniform mat4 mv;
	uniform float waterLevel;

	varying float distance;
	varying vec3 normCoord;
	varying vec4 vertCoord;

	void main()
	{
		distance = sqrt(pos.x*pos.x + pos.y*pos.y + pos.z*pos.z);
		if(distance<waterLevel){
			gl_Position = mvp * (vec4(normalize(pos)*waterLevel,1));
		} else {
			gl_Position = mvp * vec4(pos,1);
		}
		vertCoord = normalize(-1.0 * mv * vec4(pos, 1));
		normCoord = normalize(normpos);
	}
`;

// Fragment shader 

var boxFS = `
	precision mediump float;
	
	uniform mat3 mn;
	uniform vec3 light;
	uniform float alpha;
	uniform float waterLevel;

	varying float distance;
	varying vec3 normCoord;
	varying vec4 vertCoord;

	void main()
	{
		vec4 I = vec4(1.0, 1.0, 1.0, 1.0);
		vec4 Kd;
		float snowLevel = 1.15;
		if(distance<waterLevel){
			// agua
			Kd = vec4(vec3(0,0,1),1);
		} else if(distance>snowLevel) {
			// nieve
			Kd = vec4(vec3(1.0,1.0,1.0)*distance,1);
		} else if(distance>=waterLevel && distance < (waterLevel + 0.01)) {
			// arena
			Kd = vec4(vec3(0.76,0.69,0.50)*distance,1);
		}
		else {
			// tierra
			Kd = vec4(vec3(0.2,0.5,0.3)*distance,1);
		}
		vec4 Ks = vec4(1.0, 1.0, 1.0, 1.0);
		Kd = clamp(Kd, 0.0, 1.0);

		vec3 n = normalize(mn * normCoord);
		vec3 l = normalize(light);
		vec3 r = normalize(2.0 * dot(l, n) * n - l);
		vec3 h = normalize(l + vec3(vertCoord.x, vertCoord.y, vertCoord.z));

		float cos_theta = dot(n, l);
		float cos_sigma = dot(vertCoord, vec4(r, 1) );
		float cos_omega = dot(n, h);
		
		vec4 refractionM;
		if (distance < waterLevel || distance > snowLevel) {
			refractionM = Ks;
		} else {
			refractionM = vec4(0.0, 0.0, 0.0, 0.0);
		}
	
		gl_FragColor = I * max(0.0, cos_theta) * (Kd + refractionM * pow(max(0.0, cos_omega), alpha) / cos_theta);
		
	}
`;
