/**
 * Crea un cubo y después normaliza la distancia de cada vértice, haciendo una esfera
 * Basado en BoxGeometry de three.js: https://github.com/mrdoob/three.js/blob/master/src/geometries/BoxGeometry.js
 */
class SphericalCubeGeometry {

    constructor(width = 2, height = 2, depth = 2, widthSegments = 128, heightSegments = 128, depthSegments = 128, toSphere=true){
        let c = 256;
        widthSegments = c;
        heightSegments = c;
        depthSegments = c;
        this.triangles = [];
        this.vertices = [];
        this.normals = []; // TODO: calc normals
        this.numberOfVertices = 0;
        this.toSphere = toSphere;
        this.noise = new perlinNoise3d();
        this._build(width, height, depth, widthSegments, heightSegments, depthSegments);
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
                this.normals.push(...this._normalForTriangle(vertices, a, b, d));
                this.triangles.push(
                    vertices[b], vertices[b + 1], vertices[b + 2],
                    vertices[c], vertices[c + 1], vertices[c + 2],
                    vertices[d], vertices[d + 1], vertices[d + 2]
                );
                this.normals.push(...this._normalForTriangle(vertices, b, c, d));
            }

        }
    }

    _normalForTriangle(vertices, a, b, d) {
        let u = [
            vertices[b] - vertices[a],
            vertices[b + 1] - vertices[a + 1],
            vertices[b + 2] - vertices[a + 2]
        ];
        let v = [
            vertices[d] - vertices[a],
            vertices[b + 1] - vertices[a + 1],
            vertices[b + 2] - vertices[a + 2]
        ];
        const normal = [
            u[1] * v[2] - u[2] * v[1],
            u[2] * v[0] - u[0] * v[2],
            u[0] * v[1] - u[1] * v[0]
        ];
        return normal;
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
                //console.log(n);

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
        for (let o = 0; o < 10; o++) {
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

        //console.log(noise);
/*         let n = 0.0, a = 1.0, f = 1;
        for(let o = 0; o < 10; o++){
            let v = a*Noise2D(this.numberOfVertices + x*f, this.numberOfVertices + y*f);
            n += v;
            
            a *= 0.5;
            f *= 2.0;
        }
        vector[w] += n*0.25; */

        return vector;
    }
}
