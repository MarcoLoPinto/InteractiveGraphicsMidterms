/**
 *        Background Class
 * 
 * ╔╗───────╔╗─────────────────╔╗
 * ║║───────║║─────────────────║║
 * ║╚═╦══╦══╣║╔╦══╦═╦══╦╗╔╦═╗╔═╝║
 * ║╔╗║╔╗║╔═╣╚╝╣╔╗║╔╣╔╗║║║║╔╗╣╔╗║
 * ║╚╝║╔╗║╚═╣╔╗╣╚╝║║║╚╝║╚╝║║║║╚╝║
 * ╚══╩╝╚╩══╩╝╚╩═╗╠╝╚══╩══╩╝╚╩══╝      
 * ────────────╔═╝║              
 * ────────────╚══╝                  
 * 
 */

/**
 * 
 * Background Class
 * 
 * @param {*} gl gl context
 * @param {*} image MUST be: {pX: image, pY: image ...} (cube mapping)
 */
class Background {
    constructor(gl,image) {
        this.gl = gl;
        this.image = image;

        this.vertexShader = `#version 300 es
in vec4 a_position;

out vec4 v_position;

void main() {
    v_position = a_position;
    gl_Position = a_position;
    gl_Position.z = 1.0;
}
        `;

        this.fragmentShader = `#version 300 es
precision mediump float;

uniform samplerCube u_skybox;
uniform mat4 u_viewDirectionProjectionInverse;

in vec4 v_position;

out vec4 fColor;

void main() {
    vec4 t = u_viewDirectionProjectionInverse * v_position;
    fColor = texture(u_skybox, normalize(t.xyz / t.w));
}
        `;
        
        [this.vsID,this.fsID] = this.createShaders(this.vertexShader,this.fragmentShader);
        this.program = initShaders(this.gl,this.vsID,this.fsID);
        // look up where the vertex data needs to go.
        this.positionLocation = this.gl.getAttribLocation(this.program, "a_position");
        // look up uniforms
        this.skyboxLocation = gl.getUniformLocation(this.program, "u_skybox");
        this.viewDirectionProjectionInverseLocation = this.gl.getUniformLocation(this.program, 
                                                            "u_viewDirectionProjectionInverse");
        // Create a buffer for positions and bind it to ARRAY_BUFFER
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        // Put the positions in the buffer
        this.setGeometry();

        // Create a texture.

        this.faceInfos = [
            [image.pX,this.gl.TEXTURE_CUBE_MAP_POSITIVE_X],
            [image.nX,this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X],

            [image.pY,this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
            [image.nY,this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],

            [image.pZ,this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
            [image.nZ,this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z],
        ];

        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texture);

        this.faceInfos.forEach(((info)=>{
            const [img,target] = info;

            // Upload the canvas to the cubemap face.
            const level = 0;
            const internalFormat = this.gl.RGBA;
            const width = img.width;
            const height = img.height;
            const format = this.gl.RGBA;
            const type = this.gl.UNSIGNED_BYTE;
        
            // Now that the image has loaded make copy it to the texture.
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texture);
            this.gl.texImage2D(target, level, internalFormat, 
                                width, height, 0, 
                                format, type, img);
            //this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);

            //this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        
        }).bind(this));
        
    }

    render(backupProgram,viewMatrix,projectionMatrix){
        this.gl.useProgram(this.program);

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.DEPTH_TEST);

        // Turn on the position attribute
        this.gl.enableVertexAttribArray(this.positionLocation);
        // Bind the position buffer.
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        let size = 2;          // 2 components per iteration
        let type = this.gl.FLOAT;   // the data is 32bit floats
        let normalize = false; // don't normalize the data
        let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        let offset = 0;        // start at the beginning of the buffer
        this.gl.vertexAttribPointer(
            this.positionLocation, size, type, normalize, stride, offset);

        let vM = viewMatrix;
        // We only care about direciton so remove the translation
        vM[0][3] = 0;
        vM[1][3] = 0;
        vM[2][3] = 0;

        let viewDirectionProjectionMatrix =
            mult(projectionMatrix, vM);
        let viewDirectionProjectionInverseMatrix =
            inverse4(viewDirectionProjectionMatrix);
        
        // Set the uniforms
        this.gl.uniformMatrix4fv(
            this.viewDirectionProjectionInverseLocation, false,
            flatten(viewDirectionProjectionInverseMatrix));

        // Tell the shader to use texture
        //this.gl.activeTexture(this.gl.TEXTURE0);
        //this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.uniform1i(this.skyboxLocation, 0);

        // let our quad pass the depth test at 1.0
        this.gl.depthFunc(this.gl.LEQUAL);

        // Draw the geometry.
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        // reuse the previous program
        this.gl.useProgram(backupProgram);
    }

    setGeometry() {
        var positions = new Float32Array(
            [
                -1, -1,
                1, -1,
                -1, 1,
                -1, 1,
                1, -1,
                1, 1,
            ]);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
    }

    createShaders(vertex,fragment){
        let vs = document.createElement("script");
        let fs = document.createElement("script");
        let vs_t = document.createTextNode(vertex);
        let fs_t = document.createTextNode(fragment);

        vs.setAttribute("id","vertex-shader-background");
        fs.setAttribute("id","fragment-shader-background");

        vs.setAttribute("type","x-shader/x-vertex");
        fs.setAttribute("type","x-shader/x-fragment");

        vs.appendChild(vs_t);
        fs.appendChild(fs_t);

        document.body.appendChild(vs);
        document.body.appendChild(fs);

        return [vs.id,fs.id];
    }

}