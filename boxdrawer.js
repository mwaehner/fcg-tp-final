
class BoxDrawer 
{
	constructor()
	{
		// 1. Compilamos el programa de shaders
		this.prog = InitShaderProgram( boxVS, boxFS );
		
		// 2. Obtenemos los IDs de las variables uniformes en los shaders
		this.mvp = gl.getUniformLocation( this.prog, 'mvp' );
		
		// 3. Obtenemos los IDs de los atributos de los vértices en los shaders
		this.vertPos = gl.getAttribLocation( this.prog, 'pos' );
		
		// 4. Creamos el buffer para los vertices				
		this.vertbuffer = gl.createBuffer();

		var geometry = new SphericalCubeGeometry();

		// 8 caras del cubo unitario
		var triangleList = geometry.triangleList;
		this.numTriangles = triangleList.length / 3 / 3;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleList), gl.STATIC_DRAW);

	}
	

	// Esta función se llama para dibujar la caja
	draw( trans )
	{
		// 1. Seleccionamos el shader
		gl.useProgram( this.prog );

		// 2. Setear matriz de transformacion
		gl.uniformMatrix4fv( this.mvp, false, trans );

		 // 3.Binding del buffer de posiciones
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertbuffer );

		// 4. Habilitamos el atributo 
		gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPos );

		// 5. Dibujamos
		
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles * 3 );
	}
}

// Vertex shader 
var boxVS = `
	attribute vec3 pos;
	uniform mat4 mvp;
	varying float distance;
	void main()
	{
		gl_Position = mvp * vec4(pos,1);
		distance = sqrt(pos.x*pos.x + pos.y*pos.y + pos.z*pos.z);
	}
`;

// Fragment shader 

var boxFS = `
	precision mediump float;
	varying float distance;
	void main()
	{
		if(distance<0.99){
			// agua
			gl_FragColor = vec4(vec3(0,0,1)*(1.0-distance)*3.0,1);
		} else {
			// tierra
			gl_FragColor = vec4(vec3(0.2,0.5,0.3)*distance,1);
		}
		
	}
`;
