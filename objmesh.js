class ObjMesh
{
	constructor()
	{
		this.vpos = [];	// posiciones de los vértices
		this.face = [];	// índices de las caras
		this.tpos = [];	// coordenadas de texturas
		this.tfac = [];	// indices de coordenadas de textura por cara
		this.norm = [];	// normales
		this.nfac = [];	// indices de normales por cara
	}
		
	// Abrimos el obj
	load( url )
	{
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() 
		{
			if (this.readyState == 4 && this.status == 200) 
			{
				parse( this.responseText );
			}
		};
		xhttp.open("GET", url, true);
		xhttp.send();
	}
	
	// Leemos el contenido del obj
	parse( objdata )
	{
		var lines = objdata.split('\n');
		for ( var i=0; i<lines.length; ++i ) 
		{
			var line = lines[i].trim();
			var elem = line.split(/\s+/);
			switch ( elem[0][0] ) 
			{
				// Vértices...
				case 'v':
					switch ( elem[0].length ) 
					{
						// Coordenadas de los vértices
						case 1:
							this.vpos.push( [ parseFloat(elem[1]), parseFloat(elem[2]), parseFloat(elem[3]) ] );
							break;
						case 2:
							switch ( elem[0][1] ) 
							{
								// Coordenada de textura
								case 't':
									this.tpos.push( [ parseFloat(elem[1]), parseFloat(elem[2]) ] );
									break;

								// Normal
								case 'n':
									this.norm.push( [ parseFloat(elem[1]), parseFloat(elem[2]), parseFloat(elem[3]) ] );
									break;
							}
							break;
					}
					break;
				// Caras...
				case 'f':
					var f=[], tf=[], nf=[];
					for ( var j=1; j<elem.length; ++j ) 
					{
						var ids = elem[j].split('/');
						var vid = parseInt(ids[0]);

						if ( vid < 0 ) vid = this.vpos.length + vid + 1;
						f.push( vid - 1 );

						if ( ids.length > 1 && ids[1] !== "" ) 
						{
							var tid = parseInt(ids[1]);
							if ( tid < 0 ) tid = this.tpos.length + tid + 1;
							tf.push( tid - 1 );
						}

						if ( ids.length > 2 && ids[2] !== "" ) 
						{
							var nid = parseInt(ids[2]);
							if ( nid < 0 ) nid = this.norm.length + nid + 1;
							nf.push( nid - 1 );
						}
					}
					this.face.push(f);
					if ( tf.length ) this.tfac.push(tf);
					if ( nf.length ) this.nfac.push(nf);
					break;
			}
		}
	}
	
	// Computa y retorna el bounding box del objeto
	getBoundingBox()
	{
		if ( this.vpos.length == 0 ) return null;
		var min = [...this.vpos[0]];
		var max = [...this.vpos[0]];
		for ( var i=1; i<this.vpos.length; ++i ) 
		{
			for ( var j=0; j<3; ++j ) 
			{
				if ( min[j] > this.vpos[i][j] ) min[j] = this.vpos[i][j];
				if ( max[j] < this.vpos[i][j] ) max[j] = this.vpos[i][j];
			}
		}
		return { min: min, max: max };
	}
	
	// Desplazar y escalar
	shiftAndScale( shift, scale )
	{
		for ( var i=0; i<this.vpos.length; ++i ) 
		{
			for ( var j=0; j<3; ++j ) 
			{
				this.vpos[i][j] = (this.vpos[i][j] + shift[j]) * scale;
			}
		}
	}
	
	addTriangleToBuffers( vBuffer, tBuffer, nBuffer, fi, i, j, k )
	{
		var f  = this.face[fi];
		var tf = this.tfac[fi];
		var nf = this.nfac[fi];

		this.addTriangleToBuffer( vBuffer, this.vpos, f, i, j, k, this.addVertToBuffer3 );

		if ( tf ) 
		{
			this.addTriangleToBuffer( tBuffer, this.tpos, tf, i, j, k, this.addVertToBuffer2 );
		}

		if ( nf ) 
		{
			this.addTriangleToBuffer( nBuffer, this.norm, nf, i, j, k, this.addVertToBuffer3 );
		}
	}
	
	addTriangleToBuffer( buffer, v, f, i, j, k, addVert )
	{
		addVert( buffer, v, f, i );
		addVert( buffer, v, f, j );
		addVert( buffer, v, f, k );
	}
	
	addVertToBuffer3( buffer, v, f, i )
	{
		buffer.push( v[f[i]][0] );
		buffer.push( v[f[i]][1] );
		buffer.push( v[f[i]][2] );
	}

	addVertToBuffer2( buffer, v, f, i )
	{
		buffer.push( v[f[i]][0] );
		buffer.push( v[f[i]][1] );
	}

	// Devuelve las posiciones de los vértices, las coordenadas de textura y las normales
	getVertexBuffers()
	{
		// Arreglos para retornar cada uno de los componentes de la malla de triángulos
		var vBuffer = [];
		var tBuffer = [];
		var nBuffer = [];
		
		// Para cada una de las caras...
		for ( var i=0; i<this.face.length; ++i ) 
		{
			// Si la longitud de la cara es menor a 3 lados, la salteamos.
			if ( this.face[i].length < 3 ) continue;
			
			// Agregamos los 3 vértices, sus coordenadas de textura y normales
			this.addTriangleToBuffers( vBuffer, tBuffer, nBuffer, i, 0, 1, 2 );

			// Agregamos las 3 caras
			for ( var j=3; j<this.face[i].length; ++j ) 
			{
				this.addTriangleToBuffers( vBuffer, tBuffer, nBuffer, i, 0, j-1, j );
			}
		}
		
		// Retornamos un objeto con los atributos de la malla
		return { positionBuffer: vBuffer, texCoordBuffer: tBuffer, normalBuffer: nBuffer };
	}
}
