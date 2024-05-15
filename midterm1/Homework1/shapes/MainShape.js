class MainShape {

    constructor() {
        this.positionsArray = [];
        this.normalsArray = [];
        this.numPositions = 0;

        this.texCoordsArray = [];

        this.createObject();
    }

    /**
     * Creates the object, pushing normals and vertices
     * on positionsArray and normalsArray
     */
    createObject() {
        // top face
        this.vertices = this.createVertices();
        let numberOfFaces = 2;
        let numberOfVerticesOnFace = (this.vertices.length - numberOfFaces) / numberOfFaces;
        this.createFace(1, numberOfVerticesOnFace - 1, 0, false);

        // middle part
        let begin = 1;
        let i = begin;
        for (; i < numberOfVerticesOnFace; i += 1) {
            this.quad(i, i + 1, (numberOfVerticesOnFace + 1) + i + 1, (numberOfVerticesOnFace + 1) + i);
        }
        this.quad(i, begin, (numberOfVerticesOnFace + 1) + 1, (numberOfVerticesOnFace + 1) + i); // close face

        // bottom face
        this.createFace(numberOfVerticesOnFace + 2, numberOfVerticesOnFace * 2, numberOfVerticesOnFace + 1, true);
    }

    /**
     * Creates the vertices for the given problem
     * @returns array of vec4 vertices to create the object
     */
    createVertices() {
        // octagonal prism (modified)
        // h = height (z-axis); t = top, m = medium, b = bottom
        let ht = 0.5,
            hmt = 0.4,
            hmb = -0.2,
            hb = -0.5;
        let dimTop = 0.6, dimBottom = 0.5
        return [
            vec4(0.0, 0.0, ht, 1.0), // centerTrianglePoint of top

            vec4(dimTop, 0.0, hmt, 1.0),

            vec4(dimTop * Math.cos(Math.PI / 4), dimTop * Math.sin(Math.PI / 4), hmt, 1.0),
            vec4(dimTop * Math.cos(Math.PI / 4), dimTop + 0.1, hmt, 1.0),
            vec4(0.0, dimTop, hmt, 1.0),

            vec4(-dimTop * Math.cos(Math.PI / 4), dimTop + 0.1, hmt, 1.0),
            vec4(-dimTop * Math.cos(Math.PI / 4), dimTop * Math.sin(Math.PI / 4), hmt, 1.0),
            vec4(-dimTop, 0.0, hmt, 1.0),

            vec4(-dimTop * Math.cos(Math.PI / 4), -dimTop * Math.sin(Math.PI / 4), hmt, 1.0),
            vec4(-dimTop * Math.cos(Math.PI / 4), -dimTop - 0.1, hmt, 1.0),
            vec4(0.0, -dimTop, hmt, 1.0),

            vec4(dimTop * Math.cos(Math.PI / 4), -dimTop - 0.1, hmt, 1.0),
            vec4(dimTop * Math.cos(Math.PI / 4), -dimTop * Math.sin(Math.PI / 4), hmt, 1.0),

            // ---------------------- 12

            vec4(0.0, 0.0, hb, 1.0), // centerTrianglePoint of bottom

            vec4(dimBottom, 0.0, hmb, 1.0),

            vec4(dimBottom * Math.cos(Math.PI / 4), dimBottom * Math.sin(Math.PI / 4), hmb, 1.0),
            vec4(dimBottom * Math.cos(Math.PI / 4), dimBottom + 0.1, hmb, 1.0),
            vec4(0.0, dimBottom, hmb, 1.0),

            vec4(-dimBottom * Math.cos(Math.PI / 4), dimBottom + 0.1, hmb, 1.0),
            vec4(-dimBottom * Math.cos(Math.PI / 4), dimBottom * Math.sin(Math.PI / 4), hmb, 1.0),
            vec4(-dimBottom, 0.0, hmb, 1.0),

            vec4(-dimBottom * Math.cos(Math.PI / 4), -dimBottom * Math.sin(Math.PI / 4), hmb, 1.0),
            vec4(-dimBottom * Math.cos(Math.PI / 4), -dimBottom - 0.1, hmb, 1.0),
            vec4(0.0, -dimBottom, hmb, 1.0),

            vec4(dimBottom * Math.cos(Math.PI / 4), -dimBottom - 0.1, hmb, 1.0),
            vec4(dimBottom * Math.cos(Math.PI / 4), -dimBottom * Math.sin(Math.PI / 4), hmb, 1.0),
        ];

    }

    /**
     * Creates a triangle with normal for each vertex and
     * pushes everything on positionsArray and normalsArray,
     * updating the number of vertices numPositions.
     * It also adds texture to vertices and pushes them on
     * texCoordsArray
     * @param {int} a - index of this.vertices
     * @param {int} b - index of this.vertices
     * @param {int} c - index of this.vertices
     */
    triangle(a, b, c) {
        var t1 = subtract(this.vertices[b], this.vertices[a]);
        var t2 = subtract(this.vertices[c], this.vertices[a]);
        var normal = cross(t1, t2);
        normal = vec3(normal);

        // normal will be normalized in the vertex shader
        let normalized = normalize(normal);

        // spherical coords
        let phi = Math.atan2(normalized[1], normalized[0]) * 180 / Math.PI;
        let theta = Math.acos(normalized[2]) * 180 / Math.PI;

        let textureAxis = [0, 1];
        if (Math.abs(theta) < 45) {
            // Top face, use x and y
        } else if (Math.abs(theta) > 135 && Math.abs(theta) < 225) {
            // Bottom face, use x and y (inverted)
            textureAxis = [1, 0];
        } else {
            // Border face, use x or y and z; here y and z
            textureAxis = [1, 2];

            // use x and z
            if ((Math.abs(phi) < 135 && Math.abs(phi) > 45)) textureAxis = [0, 2];
            else if ((Math.abs(phi) < 315 && Math.abs(phi) > 225)) textureAxis = [0, 2];
        }

        this.positionsArray.push(this.vertices[a]);
        this.normalsArray.push(normalized);
        this.positionsArray.push(this.vertices[b]);
        this.normalsArray.push(normalized);
        this.positionsArray.push(this.vertices[c]);
        this.normalsArray.push(normalized);

        // adding texture coordinates
        this.texCoordsArray.push(this.convertToTextureCoords(this.vertices[a], textureAxis[0], textureAxis[1]));
        this.texCoordsArray.push(this.convertToTextureCoords(this.vertices[b], textureAxis[0], textureAxis[1]));
        this.texCoordsArray.push(this.convertToTextureCoords(this.vertices[c], textureAxis[0], textureAxis[1]));

        this.numPositions += 3;
    }

    /**
     * Creates a quadrilateral with normal for each vertex and
     * pushes everything on positionsArray and normalsArray,
     * updating the number of vertices numPositions.
     * It also adds texture to vertices and pushes them on
     * texCoordsArray
     * 
     * @param {int} a - index of this.vertices
     * @param {int} b - index of this.vertices
     * @param {int} c - index of this.vertices
     * @param {int} d - index of this.vertices
     */
    quad(a, b, c, d) {
        this.triangle(c, b, a);
        this.triangle(d, c, a);
    }

    /**
     * Creates the face
     * @param {int} from - index array to start
     * @param {int} to - index array to finish
     * @param {int} centerTrianglePoint - index of the center point
     * @param {array} textureAxis - axis to compute texture
     */
    createFace(from, to, centerTrianglePoint, inverted = false) {
        if (inverted) {
            let i = to + 1;
            for (; i > from; i -= 1) {
                this.triangle(i, i - 1, centerTrianglePoint);
            }
            this.triangle(from, to + 1, centerTrianglePoint); // close face
        } else {
            let i = from;
            for (; i <= to; i += 1) {
                this.triangle(i, i + 1, centerTrianglePoint);
            }
            this.triangle(i, from, centerTrianglePoint); // close face
        }

    }

    /**
     * From [-1,1] to [0,1] coordinates
     */
    convertToTextureCoords(vertex, i, j) {
        let x = vertex[i];
        let y = vertex[j];
        x += 0.5;
        x = x / 2;
        y += 0.5;
        y = y / 2;
        return vec2(x, y);
    }
}