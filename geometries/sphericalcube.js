/**
 * Crea un cubo y después normaliza la distancia de cada vértice, haciendo una esfera
 * Basado en BoxGeometry de three.js: https://github.com/mrdoob/three.js/blob/master/src/geometries/BoxGeometry.js
 */
class SphericalCubeGeometry {

    constructor(segments = 128, fbmIters=10, toSphere=true){
        console.log(segments, fbmIters,  toSphere);
        this.triangles = [];
        this.vertices = [];
        this.normals = [];
        this.numberOfVertices = 0;
        this.toSphere = toSphere;
        this.fbmIters = fbmIters;
        this.noise = new perlinNoise3d();
        this._build(1, 1, 1, segments, segments, segments);
        // TODO: (opcional) agregar nubes: crear otro conjunto de vertices de una esfera que tenga radio mayor a la esfera de acá arriba. Color: blanco / gris. Usar el 
        // ruido que ya generamos para modificar la transparencia.
    }

    /** Interface */

    get triangleList(){
        return this.triangles;
    }

    get getVertices(){
        return this.vertices;
    }

    get normalsList(){
        return this.normals;
    }

    /** Private methods */

    _build(width, height, depth, widthSegments, heightSegments, depthSegments){
        // build each side of the box geometry
        this._buildPlane( 'z', 'y', 'x', - 1, - 1, depth, height, width, depthSegments, heightSegments ); // px
        this._buildPlane( 'z', 'y', 'x', 1, - 1, depth, height, - width, depthSegments, heightSegments ); // nx
        this._buildPlane( 'x', 'z', 'y', 1, 1, width, depth, height, widthSegments, depthSegments ); // py
        this._buildPlane( 'x', 'z', 'y', 1, - 1, width, depth, - height, widthSegments, depthSegments ); // ny
        this._buildPlane( 'x', 'y', 'z', 1, - 1, width, height, depth, widthSegments, heightSegments ); // pz
        this._buildPlane( 'x', 'y', 'z', - 1, - 1, width, height, - depth, widthSegments, heightSegments ); // nz
        //this._calcNormals();
    }

    _calcNormals(p1,p2,p3){
        let u = p2.map((k, indexK) => (k-p1[indexK])) //p2-p1
        let v = p3.map((k, indexK) => (k-p1[indexK])) //p3-p1
        let nx = u[1]*v[2] - u[2]*v[1];
        let ny = u[2]*v[0] - u[0]*v[2];
        let nz = u[0]*v[1] - u[1]*v[0];
        let n = [nx,ny,nz];
        this.normals.push(...n);
        this.normals.push(...n);
        this.normals.push(...n);
    }

    _normalized(v){
        let length = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
        return [v[0]/length, v[1]/length, v[2]/length]
    }

    _buildPlane( u, v, w, udir, vdir, width, height, depth, gridX, gridY) {
        let verticesAdded = this._buildVertexList(gridX, gridY, width, height, depth, u, udir, v, vdir, w);
        this._buildTriangleList(gridX, gridY);
        // update total number of vertices
        this.numberOfVertices += verticesAdded;
    }

    _buildTriangleList(gridX, gridY) {
        const numberOfVertices = this.numberOfVertices;
        const gridX1 = gridX + 1;
        const vertices = this.vertices;
        for (let iy = 0; iy < gridY; iy++) {
            for (let ix = 0; ix < gridX; ix++) {

                const a = (numberOfVertices + ix + gridX1 * iy) * 3;
                const b = (numberOfVertices + ix + gridX1 * (iy + 1)) * 3;
                const c = (numberOfVertices + (ix + 1) + gridX1 * (iy + 1)) * 3;
                const d = (numberOfVertices + (ix + 1) + gridX1 * iy) * 3;

                // faces
                
                this.triangles.push(
                    vertices[a], vertices[a + 1], vertices[a + 2], //p1
                    vertices[b], vertices[b + 1], vertices[b + 2], //p2
                    vertices[d], vertices[d + 1], vertices[d + 2] //p3
                );
                let p0 = [vertices[a], vertices[a + 1], vertices[a + 2]];
                let p2 = [vertices[b], vertices[b + 1], vertices[b + 2]];
                let p1 = [vertices[d], vertices[d + 1], vertices[d + 2]];
                this._calcNormals(p0,p1,p2);

                this.triangles.push(
                    vertices[b], vertices[b + 1], vertices[b + 2], //p1
                    vertices[c], vertices[c + 1], vertices[c + 2], //p2
                    vertices[d], vertices[d + 1], vertices[d + 2] //p3
                );
                p0 = [vertices[b], vertices[b + 1], vertices[b + 2]];
                p2 = [vertices[c], vertices[c + 1], vertices[c + 2]];
                p1 = [vertices[d], vertices[d + 1], vertices[d + 2]];
                this._calcNormals(p0,p1,p2);
            }

        }
    }

    _buildVertexList(gridX, gridY, width, height, depth, u, udir, v, vdir, w) {
        const gridX1 = gridX + 1;
        const gridY1 = gridY + 1;

        let vertexCounter = 0;
        const vertices = this.vertices;

        // generate vertices
        const segmentWidth = width / gridX;
        const segmentHeight = height / gridY;
        const widthHalf = width / 2;
        const heightHalf = height / 2;
        const depthHalf = depth / 2;
        for (let iy = 0; iy < gridY1; iy++) {
            const y = iy * segmentHeight - heightHalf;
            for (let ix = 0; ix < gridX1; ix++) {
                const x = ix * segmentWidth - widthHalf;

                // set values to correct vector component
                const vector = this._buildVertex(u, x, udir, v, y, vdir, w, depthHalf);
                let n = this._getPerlinNoise(vector);

                // now apply vector to vertex buffer
                vertices.push(vector['x']*n, vector['y']*n, vector['z']*n);

                // counters
                vertexCounter += 1;
            }
        }
        return vertexCounter;
    }

    _getPerlinNoise(vector) {
        let aa, b, c;
        aa = vector['x'] + 1.0;
        b = vector['y'] + 1.0;
        c = vector['z'] + 1.0;
        let n = 0.0, a = 1.0, f = 1;
        for (let o = 0; o < this.fbmIters; o++) {
            let v = a * this.noise.get(aa * f, b * f, c * f);
            n += v;
            a *= 0.5;
            f *= 2.0;
        }
        n = n * 0.5 + 0.5;
        return n;
    }

    _buildVertex(u, x, udir, v, y, vdir, w, depthHalf) {
        const vector = {};
        vector[u] = x * udir;
        vector[v] = y * vdir;
        vector[w] = depthHalf;
        
        if(this.toSphere){
            /** Normalize */
            let length = Math.sqrt(vector[u] * vector[u] + vector[v] * vector[v] + vector[w] * vector[w]);
            vector[u] /= length;
            vector[v] /= length;
            vector[w] /= length;
        }
        return vector;
    }
}
