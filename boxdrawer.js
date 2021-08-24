// Clase que dibuja la caja alrededor de la escena
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

		// 8 caras del cubo unitario
		var verteces = this._buildSphereTriangeList();
		this.numTriangles = verteces.length / 3 / 3;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verteces), gl.STATIC_DRAW);

	}

	_inRange(density, i, j){
		return i >= 0 && i <= density && j >= 0 && j <= 2*density;
	}

	_averageNeighbourNoise(noiseForVertexList, i, j, density){
		let noisesToConsider = []

		if(this._inRange(density, i-1, j-1)){
			noisesToConsider.push(noiseForVertexList[i-1][j-1]);
		}
		if(this._inRange(density, i-1, j)){
			noisesToConsider.push(noiseForVertexList[i-1][j]);
		}
		if(this._inRange(density, i-1, j+1)){
			noisesToConsider.push(noiseForVertexList[i-1][j+1]);
		}

		if(this._inRange(density, i, j-1)){
			noisesToConsider.push(noiseForVertexList[i][j-1]);
		}
		if(this._inRange(density, i, j)){
			noisesToConsider.push(noiseForVertexList[i][j]);
		}
		if(this._inRange(density, i, j+1)){
			noisesToConsider.push(noiseForVertexList[i][j+1]);
		}

		if(this._inRange(density, i+1, j-1)){
			noisesToConsider.push(noiseForVertexList[i+1][j-1]);
		}
		if(this._inRange(density, i+1, j)){
			noisesToConsider.push(noiseForVertexList[i+1][j]);
		}
		if(this._inRange(density, i+1, j+1)){
			noisesToConsider.push(noiseForVertexList[i+1][j+1]);
		}
		const sum = noisesToConsider.reduce((a, b) => a + b, 0);
		const avg = (sum / noisesToConsider.length) || 0;
		return avg;
	}

	_softenNoise(noiseForVertexList, density, iterations = 1){
		for(let i=1; i<=iterations; i++){
			for(let theta=0; theta <= density; theta ++){
				for(let phi=-density; phi<=density; phi++){
					let averageNoise = this._averageNeighbourNoise(noiseForVertexList, theta, phi+density, density)
					noiseForVertexList[theta][phi+density] = averageNoise;
				}
			}
		}
		return noiseForVertexList;
	}

	_buildSphereTriangeList(density = 32){
		// TODO: eliminar grieta del mundo
		// Opciones: envolver con puntos redundantes, o terminar de "cerrar" la esfera con más triángulos
		var vertexList = [];
		for(var i=0; i<=density; i++) {
			vertexList[i] = new Array(2*density+1);
		}
		var noiseForVertexList = [];
		for(var i=0; i<=density; i++) {
			noiseForVertexList[i] = new Array(2*density+1);
		}
		for(let theta=0; theta <= density; theta ++){
			let vtheta = theta * (Math.PI / density);
			for(let phi=-density; phi<=density; phi++){
				let vphi= phi * (Math.PI / density);
				// TODO: agregar ruido más consistente (valles y montañas)
				let noise = (Math.random()-0.5)+1;
				// noise = 1.0;
				/* let vertex = [
					Math.sin(vtheta)*Math.cos(vphi),
					Math.sin(vtheta)*Math.sin(vphi),
					Math.cos(vtheta)
				] */
				let vertex = [
					Math.sin(vtheta)*Math.cos(vphi),
					Math.sin(vtheta)*Math.sin(vphi),
					Math.cos(vtheta)
				]
				vertexList[theta][phi + density] = vertex;
				noiseForVertexList[theta][phi + density] = noise;
			}
		}

		noiseForVertexList = this._softenNoise(noiseForVertexList, density);

		// Aplicamos el ruido a cada vértice
		for(let theta=0; theta <= density; theta ++){
			for(let phi=-density; phi<=density; phi++){
				let noise = noiseForVertexList[theta][phi + density];
				vertexList[theta][phi+density] = vertexList[theta][phi+density].map(coord => {
					return coord*noise;
				});
			}
		}

		let triangleList = []

		for(let n_theta=1; n_theta<vertexList.length; n_theta++){
			for(let n_phi=0; n_phi<vertexList[0].length-1; n_phi++){
				let triangle1 = []
				triangle1.push(
					...vertexList[n_theta][n_phi],
					...vertexList[n_theta][n_phi+1],
					...vertexList[n_theta-1][n_phi],
				);

				let triangle2 = []
				triangle2.push(
					...vertexList[n_theta][n_phi+1],
					...vertexList[n_theta-1][n_phi+1],
					...vertexList[n_theta-1][n_phi]
				)

				
				triangleList.push(...triangle1, ...triangle2)
			}
		}
		// TODO: construir y devolver normales para agregar iluminación
		return triangleList;

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
