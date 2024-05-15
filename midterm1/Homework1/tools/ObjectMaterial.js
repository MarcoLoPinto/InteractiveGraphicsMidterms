/**
 *    Object creator
 *     . -------- .
 *    / |       / |
 *   . ------- .  |
 *   |  |      |  |
 *   |  . -----|- .
 *   | /       | /
 *   . ------- .
 * 
 */

/**
 * Class to invoke after creating a new shape so to generate the object
 * @param {Shape} shape The shape to use
 * @param {vec4} materialAmbient material ambient
 * @param {vec4} materialDiffuse material diffuse
 * @param {vec4} materialSpecular material specular
 * @param {float} materialShininess material shininess
 * @param {*} gl the gl instance
 * @param {*} program the program instance used
 * @param {image} imageTexture the image to load
 * @param {boolean} isLightSource if true, the object is a light source and will have the parameter emissivity
 * @param {vec4} emissivity the color of the lighe source object (not influenced by other lights)
 */
class ObjectMaterial {
    constructor(shape,
                materialAmbient,materialDiffuse,materialSpecular,materialShininess,
                gl,program,
                imageTexture = null,
                isLightSource = false,
                emissivity = vec4(0.0,0.0,0.0,1.0)) {
        
        this.positionsArray = shape.positionsArray || [];
        this.normalsArray = shape.normalsArray || [];
        this.numPositions = shape.numPositions || 0;
        this.texCoordsArray = shape.texCoordsArray || [];

        this.hasTexture = shape.hasTexture;
        this.hasBump = shape.hasBump;

        this.isLightSource = isLightSource;
        this.emissivity = emissivity;

        // vec4 here, w component gives opacity.
        this.materialAmbient = materialAmbient;
        this.materialDiffuse = materialDiffuse;
        this.materialSpecular = materialSpecular;

        // float
        this.materialShininess = materialShininess;

        this.theta = [0, 0, 0];
        this.position = [0, 0, 0];
        this.centerOfRotation = [0, 0, 0];

        this.gl = gl;
        this.program = program;
        
        // Initialize attribute buffers
        this.nBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(this.normalsArray), this.gl.STATIC_DRAW);

        this.normalLoc = this.gl.getAttribLocation(this.program, "aNormal");
        this.gl.vertexAttribPointer(this.normalLoc, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.normalLoc);

        this.vBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(this.positionsArray), this.gl.STATIC_DRAW);

        this.positionLoc = this.gl.getAttribLocation(this.program, "aPosition");
        this.gl.vertexAttribPointer(this.positionLoc, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.positionLoc);

        // texture
        this.texture = null;
        this.imageTexture = imageTexture;
        this.textureBuffered = [];
        if(this.hasTexture){ 
            this.texture = this.configureTexture(this.imageTexture,"uTextureMap", 0);
        }
        this.textureBuffered = flatten(this.texCoordsArray);

        this.tBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.textureBuffered, this.gl.STATIC_DRAW);

        this.texCoordLoc = this.gl.getAttribLocation(this.program, "aTexCoord");
        this.gl.vertexAttribPointer(this.texCoordLoc, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.texCoordLoc);

        // bump
        this.bumpTextureArray = shape.bumpTextureArray || [];
        this.bumpCoordsArray = shape.bumpCoordsArray || [];
        this.tangentsArray = shape.tangentsArray || [];
        this.bumpSize = shape.bumpSize || [0,0];
        this.bumpTexture = null;
        if(this.hasBump){
            this.bumpTexture = this.configureBump(this.bumpTextureArray,"uBumpMap", 1);
        }

        // tangents buffer
        this.tangBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tangBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(this.tangentsArray), this.gl.STATIC_DRAW);

        this.tangentLoc = this.gl.getAttribLocation(this.program, "aTangent");
        this.gl.vertexAttribPointer(this.tangentLoc, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.tangentLoc);

        // bump buffer
        this.bBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(this.bumpCoordsArray), this.gl.STATIC_DRAW);

        this.bumpCoordLoc = this.gl.getAttribLocation(this.program, "aBumpCoord");
        this.gl.vertexAttribPointer(this.bumpCoordLoc, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.bumpCoordLoc);

    }

    bindToProgram(program){
        this.program = program;
        this.normalLoc = this.gl.getAttribLocation(this.program, "aNormal");
        this.positionLoc = this.gl.getAttribLocation(this.program, "aPosition");
        this.tangentLoc = this.gl.getAttribLocation(this.program, "aTangent");
        this.bumpCoordLoc = this.gl.getAttribLocation(this.program, "aBumpCoord");
        
        this.texCoordLoc = this.gl.getAttribLocation(this.program, "aTexCoord");
        
        /*
        
        this.texCoordLoc = this.gl.getAttribLocation(this.program, "aTexCoord");
        // texture
        if(this.hasTexture){
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        }
        // bump
        this.tangentLoc = this.gl.getAttribLocation(this.program, "aTangent");
        this.bumpCoordLoc = this.gl.getAttribLocation(this.program, "aBumpCoord");
        if(this.hasBump){
            this.gl.activeTexture(this.gl.TEXTURE1);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.bumpTexture);
        }
        */
    }

    renderObject(modelMatrix, viewMatrix) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vBuffer);
        this.gl.enableVertexAttribArray(this.positionLoc);
        this.gl.vertexAttribPointer(this.positionLoc, 4, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nBuffer);
        this.gl.enableVertexAttribArray(this.normalLoc);
        this.gl.vertexAttribPointer(this.normalLoc, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tBuffer);
        this.gl.enableVertexAttribArray(this.texCoordLoc);
        this.gl.vertexAttribPointer(this.texCoordLoc, 2, this.gl.FLOAT, false, 0, 0);

        if(this.hasTexture){
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tangBuffer);
        if(this.tangentLoc != -1){
            this.gl.enableVertexAttribArray(this.tangentLoc);
            this.gl.vertexAttribPointer(this.tangentLoc, 3, this.gl.FLOAT, false, 0, 0);
        }
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bBuffer);
        if(this.bumpCoordLoc != -1){
            this.gl.enableVertexAttribArray(this.bumpCoordLoc);
            this.gl.vertexAttribPointer(this.bumpCoordLoc, 2, this.gl.FLOAT, false, 0, 0);
        }

        if(this.hasBump){
            this.gl.activeTexture(this.gl.TEXTURE1);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.bumpTexture);
        }

        modelMatrix = mult(modelMatrix, translate(-this.centerOfRotation[0],-this.centerOfRotation[1],-this.centerOfRotation[2]));
        modelMatrix = mult(modelMatrix, rotate(this.theta[0], vec3(1, 0, 0)));
        modelMatrix = mult(modelMatrix, rotate(this.theta[1], vec3(0, 1, 0)));
        modelMatrix = mult(modelMatrix, rotate(this.theta[2], vec3(0, 0, 1)));
        modelMatrix = mult(modelMatrix, translate(...this.centerOfRotation));
        // put the object to position
        modelMatrix = mult(translate(...this.position), modelMatrix);

        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.program,
            "uModelMatrix"), false, flatten(modelMatrix));

        // compute normal matrix
        let nMatrix = normalMatrix( mult(viewMatrix,modelMatrix), true );
        this.gl.uniformMatrix3fv(this.gl.getUniformLocation(this.program, 
            "uNormalMatrix"), false, flatten(nMatrix));

        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.numPositions);
    }

    setPosition(x = 0,y = 0,z = 0){
        this.position = [x,y,z];
    }

    setCenterOfRotation(x = 0,y = 0,z = 0){
        this.centerOfRotation = [x,y,z];
    }

    setRotation(x = 0,y = 0,z = 0){
        this.theta = [x,y,z];
    }

    computeLights(lights){
        let dim = lights.length;
        for(let i = 0; i < dim; i++){
            var ambientProduct = mult(lights[i].lightAmbient, this.materialAmbient);
            var diffuseProduct = mult(lights[i].lightDiffuse, this.materialDiffuse);
            var specularProduct = mult(lights[i].lightSpecular, this.materialSpecular);
            var lightPosition = lights[i].lightPosition;

            this.gl.uniform4fv(this.gl.getUniformLocation(this.program, "uAmbientProduct["+i+"]"),
                ambientProduct);
            this.gl.uniform4fv(this.gl.getUniformLocation(this.program, "uDiffuseProduct["+i+"]"),
                diffuseProduct);
            this.gl.uniform4fv(this.gl.getUniformLocation(this.program, "uSpecularProduct["+i+"]"),
                specularProduct);
            this.gl.uniform4fv(this.gl.getUniformLocation(this.program, "uLightPosition["+i+"]"),
                lightPosition);

            // for directional lighting
            this.gl.uniform3fv(this.gl.getUniformLocation(this.program, "uLightDirection["+i+"]"), 
                lights[i].lightDirection);
            this.gl.uniform1f(this.gl.getUniformLocation(this.program, "uLightAngleLimit["+i+"]"), 
                Math.cos(lights[i].lightAngleLimit)); // in radians, max = -1
        }

        this.gl.uniform1i(this.gl.getUniformLocation(this.program, "uNumLights"),
            dim);

        this.gl.uniform1i(this.gl.getUniformLocation(this.program, "uHasTexture"),
            this.hasTexture);

        this.gl.uniform1i(this.gl.getUniformLocation(this.program, "uHasBump"),
            this.hasBump);

        this.gl.uniform4fv(this.gl.getUniformLocation(this.program, "uEmissivity"),
            this.emissivity);

        this.gl.uniform1i(this.gl.getUniformLocation(this.program, "uIsLightSource"),
            this.isLightSource);

        this.gl.uniform1f(this.gl.getUniformLocation(this.program,
            "uShininess"), this.materialShininess);
    }

    /* --- Image & texture setup --- */

    configureTexture(image = null,nameUniform,indexUniform) {
        if(!image){ return null;}

        let texture = this.gl.createTexture(); // create empty texture
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB,
            this.gl.RGB, this.gl.UNSIGNED_BYTE, image);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER,
            this.gl.NEAREST_MIPMAP_LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

        this.gl.uniform1i(this.gl.getUniformLocation(this.program, nameUniform), indexUniform);

        return texture;
    }

    configureBump(bump = null,nameUniform,indexUniform) {
        if(!bump){ return null;}

        let texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, 
                        this.bumpSize[0], this.bumpSize[1], 
                        0, this.gl.RGB, this.gl.UNSIGNED_BYTE, bump);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);

        this.gl.uniform1i(this.gl.getUniformLocation(this.program, nameUniform), indexUniform);
        return texture;
    
    }

    

   

}