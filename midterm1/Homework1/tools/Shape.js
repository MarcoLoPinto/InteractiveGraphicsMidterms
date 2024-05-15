/**
 *     Shape base class
 * ______
 * \    /
 *  \  /   <-->  [0.8,1.2,...]
 *   \/
 * 
 */

/**
 * Class to extend to create a new shape
 * @param {boolean} hasTexture parameter to know if the shape will have material
 * @param {boolean} hasBump parameter to know if the shape will have bump
 */
class Shape{
    constructor(hasTexture, hasBump = false){
        this.hasTexture = hasTexture;

        this.positionsArray = [];
        this.normalsArray = [];
        this.texCoordsArray = [];
        this.numPositions = 0;
        
        this.hasBump = hasBump;
        
        this.bumpSize = [0,0];
        this.bumpTextureArray = [];
        this.bumpCoordsArray = [];
        this.tangentsArray = [];
    }

    /**
     * Creates a triangle with normal for each vertex and
     * pushes everything on positionsArray and normalsArray,
     * updating the number of vertices numPositions.
     * @param {int} a - vertex 1
     * @param {int} b - vertex 2
     * @param {int} c - vertex 3
     */
     triangle(a, b, c) {
        var E1 = subtract(b, a);
        var E2 = subtract(c, a);
        var normal = cross(E1, E2);
        normal = vec3(normal);

        // normal will be normalized in the vertex shader
        let normalized = normalize(normal);

        this.positionsArray.push(a);
        this.normalsArray.push(normalized);
        this.positionsArray.push(b);
        this.normalsArray.push(normalized);
        this.positionsArray.push(c);
        this.normalsArray.push(normalized);

        this.numPositions += 3;
        
        // spherical coords for cube texturing method
        let phi = Math.atan2(normalized[1], normalized[0]) * 180 / Math.PI;
        let theta = Math.acos(normalized[2]) * 180 / Math.PI;

        let textureAxis = [0, 1];
        if (Math.abs(theta) < 45) {
            // Top face, use x and y
        } else if (Math.abs(theta) > 135 && Math.abs(theta) < 225) {
            // Bottom face, use x and y
            textureAxis = [0, 1];
        } else {
            // Border face, use x or y and z; here y and z
            textureAxis = [1, 2];

            // use x and z
            if ((Math.abs(phi) < 135 && Math.abs(phi) > 45)) textureAxis = [0, 2];
            else if ((Math.abs(phi) < 315 && Math.abs(phi) > 225)) textureAxis = [0, 2];
        }
        
        let P0 = this.convertToTextureCoords(a, textureAxis[0], textureAxis[1]);
        let P1 = this.convertToTextureCoords(b, textureAxis[0], textureAxis[1]);
        let P2 = this.convertToTextureCoords(c, textureAxis[0], textureAxis[1]);

        // adding texture coordinates
        if(this.hasTexture){
            this.texCoordsArray.push(P0);
            this.texCoordsArray.push(P1);
            this.texCoordsArray.push(P2);
        }
        else{
            this.texCoordsArray.push(vec2(0,0));
            this.texCoordsArray.push(vec2(0,0));
            this.texCoordsArray.push(vec2(0,0));
        }

        // computing tangent and binormal
        if(this.hasBump){
            let dUV1 = subtract(P1,P0);
            let dUV2 = subtract(P2,P0);
            let dU = vec2(dUV1[0],dUV2[0]);
            let dV = vec2(dUV1[1],dUV2[1]);
            let mapMat = mat2(dU[0],dV[0],dU[1],dV[1]);
            let tSpaceMap = this.matInverse2( mapMat );
            let tangent = vec3(
                tSpaceMap[0][0]*E1[0] + tSpaceMap[0][1]*E2[0],
                tSpaceMap[0][0]*E1[1] + tSpaceMap[0][1]*E2[1],
                tSpaceMap[0][0]*E1[2] + tSpaceMap[0][1]*E2[2]
            );
            /* computed on shader
            let binormal = vec3(
                tSpaceMap[1][0]*E1[0] + tSpaceMap[1][1]*E2[0],
                tSpaceMap[1][0]*E1[1] + tSpaceMap[1][1]*E2[1],
                tSpaceMap[1][0]*E1[2] + tSpaceMap[1][1]*E2[2]
            );*/
            tangent = normalize(tangent);
            this.tangentsArray.push(tangent);
            this.tangentsArray.push(tangent);
            this.tangentsArray.push(tangent);

            this.bumpCoordsArray.push(P0);
            this.bumpCoordsArray.push(P1);
            this.bumpCoordsArray.push(P2);
        } else {
            this.tangentsArray.push(vec3(0,0,0));
            this.tangentsArray.push(vec3(0,0,0));
            this.tangentsArray.push(vec3(0,0,0));

            this.bumpCoordsArray.push(vec2(0,0));
            this.bumpCoordsArray.push(vec2(0,0));
            this.bumpCoordsArray.push(vec2(0,0));
        }

    }

    /**
     * Computes the inverse of a 2x2 matrix (not using
     * MVNew.js because it has some bugs).
     */
    matInverse2(m22){
        let d = m22[0][0]*m22[1][1]-m22[0][1]*m22[1][0];
        let a00 = m22[1][1]/d,
            a01 = -m22[0][1]/d,
            a10 = -m22[1][0]/d,
            a11 = m22[0][0]/d;
        return mat2(a00,a01,a10,a11);
    }

    /**
     * Creates a quadrilateral with normal for each vertex and
     * pushes everything on positionsArray and normalsArray,
     * updating the number of vertices numPositions.
     * It also adds texture to vertices and pushes them on
     * texCoordsArray
     * 
     * @param {int} a - vertex 1
     * @param {int} b - vertex 2
     * @param {int} c - vertex 3
     * @param {int} d - vertex 4
     */
     quad(a, b, c, d) {
        this.triangle(c, b, a);
        this.triangle(d, c, a);
    }

    /**
     * From [-1,1] to [0,1] coordinates
     */
     convertToTextureCoords(vertex, i, j) {
        let x = vertex[i]; // e.g. vertex = (1,2,3) i = 1, j = 0 -> u = y, v = x
        let y = vertex[j];
        x += 0.5;
        y += 0.5;
        return vec2(x, y);
    }

    computeBump(dataBump){
        this.bumpSize = [dataBump.length-1,dataBump[0].length-1];
        let normalst = new Array();
        for (let i=0; i < dataBump.length; i++)  normalst[i] = new Array();

        for (let i=0; i < dataBump.length; i++) 
            for (let j = 0; j < dataBump[i].length; j++)
                normalst[i][j] = new Array();
        
        // compute derivatives
        for (let i=0; i < dataBump.length; i++) 
            for (let j = 0; j < dataBump[i].length; j++){
                normalst[i][j][0] = dataBump[i][j]-dataBump[(i+1)%dataBump.length][j];
                normalst[i][j][1] = dataBump[i][j]-dataBump[i][(j+1)%dataBump[i].length];
                normalst[i][j][2] = 1;
        }
        // scale to texture coords
        for (let i=0; i < dataBump.length; i++) 
            for (let j = 0; j < dataBump[i].length; j++){
                let d = 0;
                for(k=0;k<3;k++) 
                    d += normalst[i][j][k]*normalst[i][j][k];
                d = Math.sqrt(d);
                for(k=0;k<3;k++) 
                    normalst[i][j][k]= 0.5*normalst[i][j][k]/d + 0.5;
            }
        
        // Normal Texture Array
        let normals = new Uint8Array(3*dataBump.length*dataBump[0].length);

        for (let i=0; i < dataBump.length; i++) 
            for (let j = 0; j < dataBump[i].length; j++)
                for(var k = 0; k < 3; k++)
                    normals[3*dataBump.length*i+3*j+k] = 255*normalst[i][j][k];

        this.bumpTextureArray = normals;

    }

    createRandomBump(texSize = 128, min = 0, max = 60){
        let data = new Array();
        for (var i = 0; i <= texSize; i++)  data[i] = new Array();
        // bump the data randomically
        for (var i = 0; i <= texSize; i++)
            for (var j = 0; j <= texSize; j++)
                data[i][j] = Math.floor(Math.random() * (max - min) + min);

        return data;
    }

    createStripesBump(){
        let data = new Array();
        let interval = 3;
        let texSize = 64;
        for (var i = 0; i <= texSize; i++)  data[i] = new Array();
        // bump the data randomically
        for (var i = 0; i <= texSize; i++){
            for (var j = 0; j <= texSize; j++){
                data[i][j] = i%interval == 0?60:0;
            }
        }
        console.log(data);
        return data;
    }

    createImageGrayScale(image){
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
    
        var imgWidth = image.width;
        var imgHeight = image.height;
        
        canvas.width = imgWidth;
        canvas.height = imgHeight;
        
        ctx.drawImage(image,0,0);
    
        var imageData = ctx.getImageData(0,0, imgWidth, imgHeight);
        let w = imageData.width;
        let h = imageData.height;
        const data = imageData.data;
    
        let resData = new Array();
        let cols = 0;
        let rows = 0;
        resData[rows] = new Array();
        for (var i = 0; i < data.length; i += 4, cols++) {
            if(cols == w){
                cols = 0;
                rows++;
                resData[rows] = new Array();
            }
            var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            resData[rows][cols] = avg;
        }
        
        return resData;
    
    }

    /* IMPORT HOLULU256 TO USE THIS FUNCTION */
    holuluTest(){
        var texSize = 256;
        this.bumpSize = [texSize,texSize];
        var data = new Array();
        for (var i = 0; i<= texSize; i++)  data[i] = new Array();
        for (var i = 0; i<= texSize; i++) 
            for (var j=0; j<=texSize; j++)
                data[i][j] = rawData[i*256+j];

        let normalst = new Array();
        for (let i=0; i < texSize; i++)  normalst[i] = new Array();

        for (let i=0; i < texSize; i++) 
            for (let j = 0; j < texSize; j++)
                normalst[i][j] = new Array();
        
        // compute derivatives
        for (let i=0; i < texSize; i++) 
            for (let j = 0; j < texSize; j++){
                normalst[i][j][0] = data[i][j]-data[(i+1)][j];
                normalst[i][j][1] = data[i][j]-data[i][(j+1)];
                normalst[i][j][2] = 1;
        }
        
        // scale to texture coords
        for (let i=0; i < texSize; i++) 
            for (let j = 0; j < texSize; j++){
                let d = 0;
                for(k=0;k<3;k++) 
                    d += normalst[i][j][k]*normalst[i][j][k];
                d = Math.sqrt(d);
                for(k=0;k<3;k++) 
                    normalst[i][j][k]= 0.5*normalst[i][j][k]/d + 0.5;
            }
        
        // Normal Texture Array
        let normals = new Uint8Array(3*texSize*texSize);

        for (let i=0; i < texSize; i++) 
            for (let j = 0; j < texSize; j++)
                for(var k = 0; k < 3; k++)
                    normals[3*texSize*i+3*j+k] = 255*normalst[i][j][k];

        this.bumpTextureArray = normals;
    }

    /* DEPRECATED FUNCTIONS (WARNING) */

    /**
     * Creates a triangle with normal for each vertex and
     * pushes everything on positionsArray and normalsArray,
     * updating the number of vertices numPositions.
     * It also adds texture to vertices and pushes them on
     * texCoordsArray (DEPRECATED)
     * @param {int} a - index of this.vertices
     * @param {int} b - index of this.vertices
     * @param {int} c - index of this.vertices
     */
     triangleIndices(a, b, c) {
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
     * texCoordsArray (DEPRECATED)
     * 
     * @param {int} a - index of this.vertices
     * @param {int} b - index of this.vertices
     * @param {int} c - index of this.vertices
     * @param {int} d - index of this.vertices
     */
    quadIndices(a, b, c, d) {
        this.triangleIndices(c, b, a);
        this.triangleIndices(d, c, a);
    }


}