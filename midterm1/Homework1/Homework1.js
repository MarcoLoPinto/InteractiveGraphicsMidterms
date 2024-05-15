"use strict";
/**
 * ------- Homework 1 -------
 * Created by: Marco Lo Pinto
 */
class objectHomework1 {
    constructor(canvasID, imageTextures = {}) {
        // to start/stop rotation
        this.flag = false;
        this.axis = 0;
        // to rotate around barycenter
        this.flagBarycenter = false;
        this.renderTerrain = true;

        // -------- Camera creation -------- 

        this.camera = new Camera(
            vec3(2.0, 0.0, 6.0), // viewer position
            vec2(-Math.PI/2, Math.PI/2), // viewer inclination
            vec3(0.0, 0.0, 0.0), // at position
            0.3, // near
            8, // far
        );
        this.camera.createInputs();
        this.cameraInterval = setInterval(()=>this.camera.computeInputs(),10); // execution parallel to render (no deltaTime)

        // -------- WebGL creation & Shaders -------- 

        this.modelMatrix;

        // Create webgl2
        this.canvas = document.getElementById(canvasID);
        this.gl = this.canvas.getContext('webgl2');
        if (!this.gl) alert("WebGL 2.0 isn't available");
        // init canvas
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        // Almost black to simulate no lights
        this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
        // Use depth buffer to represent depth information of objects
        this.gl.enable(this.gl.DEPTH_TEST);

        // Load programs
        this.programVertexLighting = initShaders(this.gl, "vertex-shader-vertexLighting", "fragment-shader-vertexLighting");
        this.programFragmentLighting = initShaders(this.gl, "vertex-shader-fragmentLighting", "fragment-shader-fragmentLighting");
        
        this.program = this.programFragmentLighting;
        this.gl.useProgram(this.program);

        // -------- Cylinder Light creation -------- 

        this.lightsClass = new Lights();
        let cylinderHeight = 1;
        let cylinderPos = [3.0,1.5,2.0];

        // if w = 0, we are specifying a parallel source (not finite location)
        // if w = 1, we are specifying a finite location
        this.lightsClass.createLight( // # 0
            vec4(cylinderPos[0], cylinderPos[1], cylinderPos[2], 1.0), // lightPosition
            vec4(0.2, 0.2, 0.2, 1.0), // lightAmbient
            vec4(1.0, 1.0, 1.0, 1.0), // lightDiffuse
            vec4(1.0, 1.0, 1.0, 1.0), // lightSpecular
        );
        this.lightsClass.createLight( // # 1
            vec4(cylinderPos[0], cylinderPos[1]+cylinderHeight*3/8, cylinderPos[2], 1.0), // lightPosition
            vec4(0.2, 0.2, 0.2, 1.0), // lightAmbient
            vec4(1.0, 1.0, 1.0, 1.0), // lightDiffuse
            vec4(1.0, 1.0, 1.0, 1.0), // lightSpecular
        );
        this.lightsClass.createLight( // # 2
            vec4(cylinderPos[0], cylinderPos[1]-cylinderHeight*3/8, cylinderPos[2], 1.0), // lightPosition
            vec4(0.2, 0.2, 0.2, 1.0), // lightAmbient
            vec4(1.0, 1.0, 1.0, 1.0), // lightDiffuse
            vec4(1.0, 1.0, 1.0, 1.0), // lightSpecular
        );

        // -------- Other lights --------

        // this is an extra light added to see what happens when the cylinder light is off
        this.lightsClass.createLight( // # 3
            vec4(3, 3, 10, 0.0), // lightPosition -> w = 0.0 -> this light is infinitely away
            vec4(0.2, 0.2, 0.2, 1.0), // lightAmbient
            vec4(1.0, 1.0, 1.0, 1.0), // lightDiffuse
            vec4(1.0, 1.0, 1.0, 1.0), // lightSpecular
        );
        this.lightsClass.toggleLights([3]); // default to off

        // now we have 4 lights, remember that the max number of lights is 5 in the shaders.

        // -------- Objects creation -------- 
        
        // create main object
        let mainShape = new PrincipalShape(1,true, true,imageTextures.ice1); // dimension, hasTexture, hasBump, imageForBump
        this.mainObject = new ObjectMaterial(mainShape,
            vec4(0.0, 0.3, 0.4, 1.0), // materialAmbient
            vec4(0.3, 0.3, 0.3, 1.0), // materialDiffuse
            vec4(0.3, 0.3, 0.3, 1.0), // materialSpecular
            80.0, // materialShininess
            this.gl,this.program, 
            imageTextures.ice1
        );
        this.mainObject.setPosition(0,0,0);

        // create cylinder
        this.cylinderEmissivity = vec4(1.0,1.0,1.0,1.0);
        let cylinderShape = new Cylinder(0.5,cylinderHeight,6,false);
        this.cylinder = new ObjectMaterial(cylinderShape,
            vec4(0.0, 0.0, 0.0, 1.0), // materialAmbient
            vec4(0.1, 0.1, 0.1, 1.0), // materialDiffuse
            vec4(0.3, 0.3, 0.3, 1.0), // materialSpecular
            100.0, // materialShininess
            this.gl,this.program,
            null,

            true, // use cylinder emissivity
            this.cylinderEmissivity
        );
        this.cylinder.setPosition(...cylinderPos);

        // create floor
        let floorShape = new Floor(10,true);
        this.floor = new ObjectMaterial(floorShape,
            vec4(0.0, 0.4, 0.0, 1.0), // materialAmbient
            vec4(0.0, 0.6, 0.0, 1.0), // materialDiffuse
            vec4(0.3, 0.3, 0.3, 1.0), // materialSpecular
            10.0, // materialShininess
            this.gl,this.program, 
            imageTextures.grass
        );
        this.floor.setPosition(1,-1,0);

        //this.thetaLoc = this.gl.getUniformLocation(this.program, "theta");

        // ortho( left, right, bottom, top, near, far )
        //this.projectionMatrix = perspective(this.FOW, this.RATIO, this.NEAR, this.FAR);
        
        
        // Activate buttons
        this.activateButtons();
        // Render
        this.render();
    }

    render() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // ------------ view position & projection matrix ---------------
        
        this.camera.renderCamera(this.gl,this.program);

        this.updateCameraInfos();

        // ------------ get active lights ---------------

        let activeLights = this.lightsClass.getActiveLights();

        // ----------------- main object -----------------------

        // if flag = true, rotate to selected axis
        if (this.flag) this.mainObject.theta[this.axis] += 2.0;
        this.modelMatrix = mat4();
        this.mainObject.computeLights(activeLights);
        this.mainObject.renderObject(this.modelMatrix,this.camera.viewMatrix);

        // ----------------- cylindric object -----------------------

        this.modelMatrix = mat4();
        this.cylinder.computeLights(activeLights);
        this.cylinder.renderObject(this.modelMatrix,this.camera.viewMatrix);

        // ----------------- floor object -----------------------

        if(this.renderTerrain){
            this.modelMatrix = mat4();
            this.floor.computeLights(activeLights);
            this.floor.renderObject(this.modelMatrix,this.camera.viewMatrix);
        }
        
        requestAnimationFrame(this.render.bind(this));
    }

    /** 
     * Computes geometric barycenter 
     * @returns vec3 of the barycenter coords
     */
    getBarycenterGeometric(shape) {
        let x = 0, y = 0, z = 0;
        let dim = shape.numPositions;
        for (let i = 0; i < dim; i++) {
            x += shape.positionsArray[i][0];
            y += shape.positionsArray[i][1];
            z += shape.positionsArray[i][2];
        }
        x = x / dim;
        y = y / dim;
        z = z / dim;
        return [x, y, z];
    }
    /* older versions (deprecated) */
    /** 
     * Computes barycenter 
     * @returns vec3 of the barycenter coords
     */
    getBarycenter() {
        let x = 0, y = 0, z = 0;
        let dim = this.numPositions;
        let areaSum = 0;
        for (let i = 0; i < dim; i += 3) {
            let cx = (this.positionsArray[i][0] + this.positionsArray[i + 1][0] + this.positionsArray[i + 2][0]) / 3;
            let cy = (this.positionsArray[i][1] + this.positionsArray[i + 1][1] + this.positionsArray[i + 2][1]) / 3;
            let cz = (this.positionsArray[i][2] + this.positionsArray[i + 1][2] + this.positionsArray[i + 2][2]) / 3;
            let magnitude = Math.sqrt(Math.pow(this.normalsArray[i][0], 2) + Math.pow(this.normalsArray[i + 1][1], 2) + Math.pow(this.normalsArray[i + 2][2], 2));
            x += cx * magnitude;
            y += cy * magnitude;
            z += cz * magnitude;
            areaSum += magnitude;
        }
        x = x / areaSum;
        y = y / areaSum;
        z = z / areaSum;
        return vec3(x, y, z);
    }
    /** 
     * Computes barycenter (deprecated, using defined vertices)
     * @returns vec3 of the barycenter coords
     */
    getBarycenterOld() {
        let x = 0, y = 0, z = 0;
        let dim = this.vertices.length;
        for (let i = 0; i < dim; i++) {
            x += this.vertices[i][0];
            y += this.vertices[i][1];
            z += this.vertices[i][2];
        }
        x = x / dim;
        y = y / dim;
        z = z / dim;
        return vec3(x, y, z);
    }

    /** 
     * Switches to desired program and binds all necessary informations
     */
    useProgram(program){
        this.program = program;
        this.gl.useProgram(this.program);
        this.mainObject.bindToProgram(program);
        this.cylinder.bindToProgram(program);
        this.floor.bindToProgram(program);
    }

    /* --- UI buttons --- */

    /**
     * Add onlcick on buttons
     */
    activateButtons() {
        let element = (id) => document.getElementById(id);
        let elementValue = (id) => parseFloat(document.getElementById(id).value);

        element("ButtonX").onclick = function () { this.axis = 0; }.bind(this);
        element("ButtonY").onclick = function () { this.axis = 1; }.bind(this);
        element("ButtonZ").onclick = function () { this.axis = 2; }.bind(this);
        element("ButtonT").onclick = function () { this.flag = !this.flag; }.bind(this);
        element("ButtonBarycenter").onclick = function () { 

            this.flagBarycenter = !this.flagBarycenter;

            if (this.flagBarycenter){
                let barycenter = this.getBarycenterGeometric(this.mainObject);
                this.mainObject.setCenterOfRotation(...barycenter);
            } else this.mainObject.setCenterOfRotation(0,0,0);
        
        }.bind(this);

        // vertex/fragment lighting
        element("ButtonVertexLighting").onclick = function () { this.useProgram(this.programVertexLighting); }.bind(this);
        element("ButtonFragmentLighting").onclick = function () { 
            this.useProgram(this.programFragmentLighting); 
            this.mainObject.hasBump = 0;
        }.bind(this);
        element("ButtonFragmentLightingBump").onclick = function () { 
            this.useProgram(this.programFragmentLighting); 
            this.mainObject.hasBump = 1;
        }.bind(this);

        // viewer controls
        let stepMovement = 0.2;
        let stepRotation = 2.0;
        element("wButton").onclick = function () { this.camera.moveCamera(0,0,-stepMovement); }.bind(this);
        element("aButton").onclick = function () { this.camera.moveCamera(stepMovement,0,0); }.bind(this);
        element("sButton").onclick = function () { this.camera.moveCamera(0,0,stepMovement); }.bind(this);
        element("dButton").onclick = function () { this.camera.moveCamera(-stepMovement,0,0); }.bind(this);

        element("flydButton").onclick = function () { this.camera.moveCamera(0,-stepMovement,0); }.bind(this);
        element("flyuButton").onclick = function () { this.camera.moveCamera(0,stepMovement,0); }.bind(this);

        element("leftButton").onclick = function () { this.camera.rotateCamera(0,-stepRotation); }.bind(this);
        element("upButton").onclick = function () { this.camera.rotateCamera(stepRotation,0); }.bind(this);
        element("rightButton").onclick = function () { this.camera.rotateCamera(0,stepRotation); }.bind(this);
        element("downButton").onclick = function () { this.camera.rotateCamera(-stepRotation,0); }.bind(this);

        element("nearSlider").onchange = function () { this.camera.NEAR = elementValue("nearSlider"); }.bind(this);
        element("farSlider").onchange = function () { this.camera.FAR = elementValue("farSlider"); }.bind(this);
        
        element("ButtonCylLights").onclick = function () { 
            let res = this.lightsClass.toggleLights([0,1,2]);
            if(res[0] == false){
                this.cylinder.isLightSource = false;
            } else this.cylinder.isLightSource = true;
        }.bind(this);

        element("ButtonSun").onclick = function () { 
            this.lightsClass.toggleLights([3]);
        }.bind(this);

        element("ButtonTerrain").onclick = function () { this.renderTerrain = !this.renderTerrain; }.bind(this);
    }

    updateCameraInfos(){
        document.getElementById("coords").innerText =   "("+parseFloat(this.camera.viewerPos[0]).toFixed(1)+"|"+
                                                        parseFloat(this.camera.viewerPos[1]).toFixed(1)+"|"+
                                                        parseFloat(this.camera.viewerPos[2]).toFixed(1)+")";
        
        document.getElementById("angle").innerText = "("+parseFloat(this.camera.viewerInclination[0] * 180 / Math.PI).toFixed(1)+"|"+
                                                        parseFloat(this.camera.viewerInclination[1] * 180 / Math.PI).toFixed(1)+")";

        document.getElementById("near").innerText = parseFloat(document.getElementById("nearSlider").value).toFixed(1);
        document.getElementById("far").innerText = parseFloat(document.getElementById("farSlider").value).toFixed(1);
        
    }

}

/**
 * Load image
 */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.src = "textures/"+src;
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;

    });
}

let homework1 = undefined;
(async () => {
    let test = await loadImage("texture_test.png");
    let missing = await loadImage("texture_missing.png");
    let mcwood = await loadImage("texture_minecraftwood.png");
    let bricks = await loadImage("texture_bricks.png");
    let grass = await loadImage("texture_grass.jpg");
    let ice1 = await loadImage("texture_ice1.png");
    let ice2 = await loadImage("texture_ice2.jpg");
    
    homework1 = new objectHomework1("gl-canvas", {test,missing,mcwood,bricks,grass,ice1,ice2});
})();


/**
 * -------- Notes --------
 *
 * Pipeline Architecture:
 *      Vertices -> Vertex Processor -> Clipper & Primitive Assembler -> Rasterizer -> Fragment Processor -> Pixels
 *
 *      Vertex Processor: HW of vertex shader (here we do object coords, camera/eye coords, screen coords...)
 *      Clipper: Take out all objects that are not in POV
 *      Primitive Assembler: Put together the vertices to create the objects (e.g. 3 vertices -> triangle)
 *      Rasterizer: Where the fragments are generated (before pixels, fragments are potential pixels)
 *      Fragment Processor: The fragment shader is the program for the fragment processor (here we do color of pixel)
 *
 * Variables:
 *      aVariable -> vVariable -> fVariable
 *      a = external (js), v = vertex shader, f = fragment shader
 *      in the vertex: a is input, v is output
 *      in the fragment: v is input, f is output
 *      u = uniform, fixed variables equal for all verices. Uniform variables are used to communicate with your vertex or fragment shader from "outside".
 *      a = attributes are inputs to a vertex shader that get their data from buffers.
 *
 * Homogeneous Coords:
 *      vectors: v=[a1,a2,a3,0] points: p=[b1,b2,b3,1]. 0 for vectors because we don't need a fixed point (origin)
 *
 * Planar Geometric Projections:
 *      - Parallel
 *          - Multiview orthographic: The one that we see in CAD (top,front,side)
 *          - Axonometric (how many angles of a corner of a projected cube are the same)
 *              - Isonometric: none
 *              - Dimetric: 2
 *              - Trimetric: all 3
 *          - Oblique:
 *      - Perspective
 *          - 1 point:
 *          - 2 point:
 *          - 3 point:
 *
 * Material properties:
 *      Here declared as materialAmbient, materialDiffuse, materialSpecular and materialShininess.
 *      w component gives opacity.
 *
 *      - Absorption: Color properties. A surface appears red under white light because the red
 *                    component of the light is reflected and the rest is absorbed.
 *                    The reflected light is Scattered in a manner that depends on the
 *                    smoothness and orientation of the surface.
 *      - Scattering
 *          - Diffuse
 *          - Specular
 *
 *      We can simulate a light source in WebGL by giving a materal an emissive component.
 * 
 * Space movement:
 *      Tangent Space <-> Model Space <-> World Space <-> View Space <-> Clip Space
 * 
 *      Vertex Shader -> pos is in Model Space, also tangent and normal.
 *      Light position is in World Space, we need to do ViewMatrix * lightPos to go to View Coords.
 *      
 *      ModelMatrix * pos                                 = pos in World Space.
 *      ViewMatrix * ModelMatrix * pos                    = pos in View Space.
 *      ProjectionMatrix * ViewMatrix * ModelMatrix * pos = pos in Clip Space.
 * 
 *      From Tangent Space to World Space via NormalMatrix, which is the 3x3 ModelMatrix.
 *      
 */

// TODO: see 9.4 slides for texture coordinate, reached 6.3 (jumped to 7.5)
// 4.4 for resize events; 5.3 for homogeneous transformations; 5.4 matrix stacks
// 6.2 for views; 7.5 for Lightning and shading w/ Phong