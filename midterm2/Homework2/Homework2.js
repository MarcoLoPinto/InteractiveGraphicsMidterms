"use strict";
/**
 * ------- Homework 2 -------
 * Created by: Marco Lo Pinto
 */
class objectHomework2 {
    constructor(canvasID, imageTextures = {}) {
        // to rotate around barycenter
        this.flagBarycenter = false;
        this.renderTerrain = true;

        // -------- Camera creation -------- 

        this.camera = new Camera(
            vec3(3.0, 1.5, 10.0), // viewer position
            vec2(-Math.PI / 2, Math.PI / 2), // viewer inclination
            vec3(0.0, 0.0, 0.0), // at position
            0.3, // near
            18, // far
        );
        this.camera.createInputs();
        this.camera.rotateCamera(0, -30);
        this.cameraInterval = setInterval(() => this.camera.computeInputs(), 10); // execution parallel to render (no deltaTime)

        // -------- WebGL creation & Shaders -------- 

        this.modelMatrix;

        // Create webgl2
        this.canvas = document.getElementById(canvasID);
        this.gl = this.canvas.getContext('webgl2');
        if (!this.gl) alert("WebGL 2.0 isn't available");
        // init canvas
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        // sky
        this.gl.clearColor(0.53, 0.8, 0.92, 1.0);
        // Use depth buffer to represent depth information of objects
        this.gl.enable(this.gl.DEPTH_TEST);

        // Load programs
        this.programVertexLighting = initShaders(this.gl, "vertex-shader-vertexLighting", "fragment-shader-vertexLighting");
        this.programFragmentLighting = initShaders(this.gl, "vertex-shader-fragmentLighting", "fragment-shader-fragmentLighting");

        this.program = this.programFragmentLighting;
        this.gl.useProgram(this.program);

        // -------- Background class -------- 

        this.backgroundClass = new Background(this.gl,imageTextures.sky);

        // -------- Cylinder Light creation -------- 

        this.lightsClass = new Lights();
        let cylinderHeight = 2;
        let cylinderPos = [8.0, 3.5, 2.0];

        // if w = 0, we are specifying a parallel source (not finite location)
        // if w = 1, we are specifying a finite location
        this.lightsClass.createLight( // # 0
            vec4(cylinderPos[0], cylinderPos[1], cylinderPos[2], 1.0), // lightPosition
            vec4(0.2, 0.2, 0.2, 1.0), // lightAmbient
            vec4(1.0, 1.0, 1.0, 1.0), // lightDiffuse
            vec4(1.0, 1.0, 1.0, 1.0), // lightSpecular
        );
        this.lightsClass.createLight( // # 1
            vec4(cylinderPos[0], cylinderPos[1] + cylinderHeight * 3 / 8, cylinderPos[2], 1.0), // lightPosition
            vec4(0.2, 0.2, 0.2, 1.0), // lightAmbient
            vec4(1.0, 1.0, 1.0, 1.0), // lightDiffuse
            vec4(1.0, 1.0, 1.0, 1.0), // lightSpecular
        );
        this.lightsClass.createLight( // # 2
            vec4(cylinderPos[0], cylinderPos[1] - cylinderHeight * 3 / 8, cylinderPos[2], 1.0), // lightPosition
            vec4(0.2, 0.2, 0.2, 1.0), // lightAmbient
            vec4(1.0, 1.0, 1.0, 1.0), // lightDiffuse
            vec4(1.0, 1.0, 1.0, 1.0), // lightSpecular
        );

        // -------- Other lights --------

        // this is an extra light added to see what happens when the cylinder light is off
        this.lightsClass.createLight( // # 3
            vec4(3, 3, 10, 0.0), // lightPosition -> w = 0.0 -> this light is infinitely away
            vec4(0.6, 0.6, 0.6, 1.0), // lightAmbient
            vec4(1.0, 1.0, 1.0, 1.0), // lightDiffuse
            vec4(1.0, 1.0, 1.0, 1.0), // lightSpecular
        );
        //this.lightsClass.toggleLights([3]); // default to off

        // now we have 4 lights, remember that the max number of lights is 5 in the shaders.

        // -------- Objects creation -------- 

        // -------- Sheep -------- 

        let headDimension = 0.5;

        let bodyWidth = headDimension * 2;
        let bodyHeight = bodyWidth / 2;
        let bodyDepth = bodyWidth * 3 / 2;

        let legDepthTop = bodyWidth / 4 + bodyWidth / 8;
        let legDepthBottom = bodyWidth / 4;
        let legHeight = legDepthBottom * 2;

        let tailDimension = headDimension / 3;

        let headTexture = imageTextures.face;
        let bodyTexture = imageTextures.wool;
        let legTopTexture = imageTextures.wool;
        let legBottomTexture = imageTextures.legDown;
        let tailTexture = imageTextures.wool;

        let materialSheep = [
            vec4(0.4, 0.4, 0.4, 1.0), // materialAmbient
            vec4(0.2, 0.2, 0.2, 1.0), // materialDiffuse
            vec4(0.1, 0.1, 0.1, 1.0), // materialSpecular
            40.0, // materialShininess
        ];

        let bodyShape = new CubeShape(bodyWidth, bodyHeight, bodyDepth, true, true, bodyTexture, false);
        this.body = new ObjectMaterial("sheep", bodyShape,
            ...materialSheep,
            this.gl, this.program,
            bodyTexture
        );

        let headShape = new CubeShape(headDimension, headDimension, headDimension, true, true, headTexture);
        this.head = new ObjectMaterial("sheep_head", headShape,
            ...materialSheep,
            this.gl, this.program,
            headTexture
        );

        let legTopShape = new CubeShape(legDepthTop, legHeight, legDepthTop, true, true, legTopTexture, false);
        let legBottomShape = new CubeShape(legDepthBottom, legHeight, legDepthBottom, true, true, legBottomTexture, false);

        for (let i = 1; i <= 4; i++) {
            this["legTop" + i] = new ObjectMaterial("sheep_legTop" + i, legTopShape,
                ...materialSheep,
                this.gl, this.program,
                legTopTexture
            );
            this["legBottom" + i] = new ObjectMaterial("sheep_legBottom" + i, legBottomShape,
                ...materialSheep,
                this.gl, this.program,
                legBottomTexture
            );
        }

        let tailShape = new CubeShape(tailDimension, tailDimension, tailDimension, true, true, tailTexture, false);
        this.tail = new ObjectMaterial("sheep_tail", tailShape,
            ...materialSheep,
            this.gl, this.program,
            tailTexture
        );

        // Add Children

        this.legTop1.addChildren(this.legBottom1);
        this.legTop2.addChildren(this.legBottom2);
        this.legTop3.addChildren(this.legBottom3);
        this.legTop4.addChildren(this.legBottom4);
        this.body.addChildren(this.head, this.legTop1, this.legTop2, this.legTop3, this.legTop4, this.tail);

        // Set positions
        this.startPositionSheep = [0, bodyHeight / 2 + legHeight * 2, 0];

        this.body.setPosition(...this.startPositionSheep); // START POSITION SHEEP (0,h,0)
        this.body.children["sheep_head"].setPosition(0, bodyHeight / 2, bodyDepth / 2); // can access objects with father.children[id] or directly
        this.body.children["sheep_tail"].setPosition(0, bodyHeight / 2 - tailDimension, -bodyDepth / 2);

        let spacingLegs = legDepthTop / 8;
        this.legTop1.setPosition(bodyWidth / 2 - legDepthTop / 2 - spacingLegs, -bodyHeight / 2 - legHeight / 2, bodyDepth / 2 - legDepthTop / 2 - spacingLegs); // direct access
        this.legTop1.setCenterOfRotation(0, -legHeight / 2, 0);
        this.legBottom1.setPosition(0, -legHeight, 0);
        this.legBottom1.setCenterOfRotation(0, -legHeight / 2, 0);

        this.legTop2.setPosition(-bodyWidth / 2 + legDepthTop / 2 + spacingLegs, -bodyHeight / 2 - legHeight / 2, bodyDepth / 2 - legDepthTop / 2 - spacingLegs);
        this.legTop2.setCenterOfRotation(0, -legHeight / 2, 0);
        this.legBottom2.setPosition(0, -legHeight, 0);
        this.legBottom2.setCenterOfRotation(0, -legHeight / 2, 0);

        this.legTop3.setPosition(-bodyWidth / 2 + legDepthTop / 2 + spacingLegs, -bodyHeight / 2 - legHeight / 2, - bodyDepth / 2 + legDepthTop / 2 + spacingLegs);
        this.legTop3.setCenterOfRotation(0, -legHeight / 2, 0);
        this.legBottom3.setPosition(0, -legHeight, 0);
        this.legBottom3.setCenterOfRotation(0, -legHeight / 2, 0);

        this.legTop4.setPosition(bodyWidth / 2 - legDepthTop / 2 - spacingLegs, -bodyHeight / 2 - legHeight / 2, - bodyDepth / 2 + legDepthTop / 2 + spacingLegs);
        this.legTop4.setCenterOfRotation(0, -legHeight / 2, 0);
        this.legBottom4.setPosition(0, -legHeight, 0);
        this.legBottom4.setCenterOfRotation(0, -legHeight / 2, 0);

        // ------------ SHEEP ANIMATION -----------------
        // reference: https://www.youtube.com/watch?v=OwxIzr7CbcQ
        // ------------ BODY ---------------
        let velocity = 60 * 3 / 2;
        let fencePosition = 8;
        let wobbleIntensity = 2/10;
        let wobbleVelocity = 15;
        let positionNearFence = this.body.position.map((n, i) => { if (i == 2) return n += fencePosition - 2; return n; });

        this.bodyAnimation_1 = new AnimationObject(this.body,
            true, false,
            this.body.position, positionNearFence,
            [0, 0, 0], [0, 0, 0],
            velocity, 0
        );
        this.bodyAnimation_wobble1 = new AnimationObject(this.body,
            true, false,
            [0,0,0], [0,wobbleIntensity,0],
            [0, 0, 0], [0, 0, 0],
            wobbleVelocity, 0
        );
        this.bodyAnimation_wobble2 = new AnimationObject(this.body,
            true, false,
            [0,wobbleIntensity,0], [0,0,0],
            [0, 0, 0], [0, 0, 0],
            wobbleVelocity, 0
        );

        // ------------ LEGS ---------------
        let frames1 = 10;
        let frames2 = frames1 * 1.5;
        let frames3 = frames1 * 1.5;
        let frames4 = frames1;

        let delay = [8,0,0+6,8+6];

        let fromLeg = 1;
        let toLeg = 4;

        // +++++ Walking +++++++++

        for (let i = fromLeg; i <= toLeg/2; i++) {
            let legTopDirection = 60;
            let legBottomDirection = 70;

            this[`legTop${i}Animation_11`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legTop${i}`].theta, this[`legTop${i}`].theta.map((n, i) => { if (i == 0) return n -= legTopDirection; return n; }),
                frames1, 0);
            this[`legTop${i}Animation_21`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legTop${i}`].theta.map((n, i) => { if (i == 0) return n -= legTopDirection; return n; }), this[`legTop${i}`].theta,
                frames2, 0);
            this[`legTop${i}Animation_31`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legTop${i}`].theta, this[`legTop${i}`].theta.map((n, i) => { if (i == 0) return n += legTopDirection; return n; }),
                frames3, 0);
            this[`legTop${i}Animation_41`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legTop${i}`].theta.map((n, i) => { if (i == 0) return n += legTopDirection; return n; }), this[`legTop${i}`].theta,
                frames4, 0);


            this[`legBottom${i}Animation_11`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legBottom${i}`].theta, this[`legBottom${i}`].theta.map((n, i) => { if (i == 0) return n -= legBottomDirection; return n; }),
                frames1, 0);
            this[`legBottom${i}Animation_31`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legBottom${i}`].theta.map((n, i) => { if (i == 0) return n -= legBottomDirection; return n; }), this[`legBottom${i}`].theta,
                frames3, 0);
        }
        for (let i = toLeg; i > toLeg/2; i--) {
            let legTopDirection = 60;
            let legBottomDirection = 70;
            let displacement = 10;

            this[`legTop${i}Animation_11`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legTop${i}`].theta, this[`legTop${i}`].theta.map((n, i) => { if (i == 0) return n -= (legTopDirection+displacement); return n; }),
                frames1, 0);
            this[`legTop${i}Animation_21`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legTop${i}`].theta.map((n, i) => { if (i == 0) return n -= (legTopDirection+displacement); return n; }), this[`legTop${i}`].theta,
                frames2, 0);
            this[`legTop${i}Animation_31`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legTop${i}`].theta, this[`legTop${i}`].theta.map((n, i) => { if (i == 0) return n += legTopDirection; return n; }),
                frames3, 0);
            this[`legTop${i}Animation_41`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legTop${i}`].theta.map((n, i) => { if (i == 0) return n += legTopDirection; return n; }), this[`legTop${i}`].theta,
                frames4, 0);


            this[`legBottom${i}Animation_11`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legBottom${i}`].theta, this[`legBottom${i}`].theta.map((n, i) => { if (i == 0) return n += legBottomDirection; return n; }),
                frames1, 0);
            this[`legBottom${i}Animation_31`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legBottom${i}`].theta.map((n, i) => { if (i == 0) return n += legBottomDirection; return n; }), this[`legBottom${i}`].theta,
                frames3, 0);
        }

        // ++++++++++ Jump +++++++++++++
        let shiftHeight = 6/9;
        let shiftVelocity = velocity/6;
        let bodyRotationJump = [20, 0, 0];
        let bodyRotationJump2 = [0,0,0];
        let bodyRotationJump3 = [-10,0,0];
        let bodyRotationJump4 = [-15,0,0];
        let bodyRotationJump5 = [0,0,0];
        let bodyRotationJump6 = [0,0,0];

        let jump1Pos1 = positionNearFence.map((n, i) => { if (i == 1) return n += shiftHeight; if(i == 2) return n += shiftHeight*2; return n; });
        let jump2Pos1 = jump1Pos1.map((n, i) => { if (i == 1) return n += shiftHeight*4/6; if(i == 2) return n += shiftHeight*2; return n; });
        let jump2Pos2 = jump2Pos1.map((n, i) => { if (i == 1) return n -= shiftHeight*4/6; if(i == 2) return n += shiftHeight*2; return n; });
        let jump2Pos3 = jump2Pos2.map((n, i) => { if (i == 1) return n -= shiftHeight*5/6; if(i == 2) return n += shiftHeight*2; return n; });
        let jump2Pos4 = jump2Pos3.map((n, i) => { if (i == 1) return n -= shiftHeight*2/6; if(i == 2) return n += shiftHeight/2; return n; });
        let jump2Pos5 = jump2Pos4.map((n, i) => { if (i == 1) return this.body.position[1]; if(i == 2) return n += shiftHeight/16; return n; });

        this.bodyJump1_1 = new AnimationObject(this.body, // loading jump by contraction...
            true, true,
            positionNearFence, positionNearFence.map((n, i) => { if (i == 1) return n -= shiftHeight*2/3; return n; }),
            [0, 0, 0], bodyRotationJump,
            shiftVelocity, 0
        );
        this.bodyJump1_2 = new AnimationObject(this.body,
            true, false,
            positionNearFence.map((n, i) => { if (i == 1) return n -= shiftHeight*2/3; return n; }), jump1Pos1, 
            [0, 0, 0], [0, 0, 0],
            shiftVelocity, 0
        );

        this.bodyJump2_1 = new AnimationObject(this.body,
            true, true,
            jump1Pos1, jump2Pos1, 
            bodyRotationJump, bodyRotationJump2,
            shiftVelocity, 0
        );
        this.bodyJump2_2 = new AnimationObject(this.body,
            true, true,
            jump2Pos1, jump2Pos2, 
            bodyRotationJump2, bodyRotationJump3,
            shiftVelocity, 0
        );
        this.bodyJump2_3 = new AnimationObject(this.body,
            true, true,
            jump2Pos2, jump2Pos3, 
            bodyRotationJump3, bodyRotationJump4,
            shiftVelocity, 0
        );
        this.bodyJump2_4 = new AnimationObject(this.body,
            true, true,
            jump2Pos3, jump2Pos4, 
            bodyRotationJump4, bodyRotationJump5,
            shiftVelocity, 0
        );
        this.bodyJump2_5 = new AnimationObject(this.body,
            true, true,
            jump2Pos4, jump2Pos5, 
            bodyRotationJump5, bodyRotationJump6,
            shiftVelocity, 0
        );
        
        let legTopDirection12 = 40;
        let legTopDirection12_f = -30;
        let legBottomDirection12 = 70;
        let legBottomDirection12_f = 30;
        for (let i = fromLeg; i <= toLeg/2; i++) {

            this[`legTop${i}Jump1_11`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legTop${i}`].theta, this[`legTop${i}`].theta.map((n, i) => { if (i == 0) return n += legTopDirection12; return n; }),
                frames2, 0);
            this[`legTop${i}Jump1_21`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legTop${i}`].theta.map((n, i) => { if (i == 0) return n += legTopDirection12; return n; }), this[`legTop${i}`].theta.map((n, i) => { if (i == 0) return n += legTopDirection12_f; return n; }),
                frames2, 0);
            this[`legTop${i}Jump2_11`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legTop${i}`].theta.map((n, i) => { if (i == 0) return n += legTopDirection12_f; return n; }), [70,0,0],
                frames2, 0);
            this[`legTop${i}Jump2_21`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                [70,0,0], [70,0,0],
                frames2, 0);
            this[`legTop${i}Jump2_31`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                [70,0,0], [40,0,0],
                frames2, 0);
            this[`legTop${i}Jump2_41`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                [40,0,0], [40,0,0],
                frames2, 0);
            this[`legTop${i}Jump2_51`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                [40,0,0], [0,0,0],
                frames2, 0);


            this[`legBottom${i}Jump1_11`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legBottom${i}`].theta, this[`legBottom${i}`].theta.map((n, i) => { if (i == 0) return n -= legBottomDirection12; return n; }),
                frames2, 0);
            this[`legBottom${i}Jump1_21`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legBottom${i}`].theta.map((n, i) => { if (i == 0) return n -= legBottomDirection12; return n; }), this[`legBottom${i}`].theta.map((n, i) => { if (i == 0) return n -= legBottomDirection12_f; return n; }),
                frames2, 0);
            this[`legBottom${i}Jump2_11`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legBottom${i}`].theta.map((n, i) => { if (i == 0) return n -= legBottomDirection12_f; return n; }), [-40,0,0],
                frames2, 0);
            this[`legBottom${i}Jump2_21`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                [-40,0,0], [-20,0,0],
                frames2, 0);
            this[`legBottom${i}Jump2_31`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                [-20,0,0], [-10,0,0],
                frames2, 0);
            this[`legBottom${i}Jump2_41`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                [-10,0,0], [-60,0,0],
                frames2, 0);
            this[`legBottom${i}Jump2_51`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                [-60,0,0], [0,0,0],
                frames2, 0);
        }
        let legTopDirection34 = -100;
        let legTopDirection34_f = -60;
        let legBottomDirection34 = -130;
        let legBottomDirection34_f = 0;
        for (let i = toLeg; i > toLeg/2; i--) {
            

            this[`legTop${i}Jump1_11`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legTop${i}`].theta, this[`legTop${i}`].theta.map((n, i) => { if (i == 0) return n += legTopDirection34; return n; }),
                frames2, 0);
            this[`legTop${i}Jump1_21`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legTop${i}`].theta.map((n, i) => { if (i == 0) return n += legTopDirection34; return n; }), this[`legTop${i}`].theta.map((n, i) => { if (i == 0) return n += legTopDirection34_f; return n; }),
                frames2, 0);
            this[`legTop${i}Jump2_11`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legTop${i}`].theta.map((n, i) => { if (i == 0) return n += legTopDirection34_f; return n; }), [-20,0,0],
                frames2, 0);
            this[`legTop${i}Jump2_21`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                [-20,0,0], [-20,0,0],
                frames2, 0);
            this[`legTop${i}Jump2_31`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                [-20,0,0], [-10,0,0],
                frames2, 0);
            this[`legTop${i}Jump2_41`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                [-10,0,0], [-40,0,0],
                frames2, 0);
            this[`legTop${i}Jump2_51`] = new AnimationObject(this[`legTop${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                [-40,0,0], [0,0,0],
                frames2, 0);


            this[`legBottom${i}Jump1_11`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legBottom${i}`].theta, this[`legBottom${i}`].theta.map((n, i) => { if (i == 0) return n -= legBottomDirection34; return n; }),
                frames2, 0);
            this[`legBottom${i}Jump1_21`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legBottom${i}`].theta.map((n, i) => { if (i == 0) return n -= legBottomDirection34; return n; }), this[`legBottom${i}`].theta.map((n, i) => { if (i == 0) return n -= legBottomDirection34_f; return n; }),
                frames2, 0);
            this[`legBottom${i}Jump2_11`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                this[`legBottom${i}`].theta.map((n, i) => { if (i == 0) return n -= legBottomDirection34_f; return n; }), [40,0,0],
                frames2, 0);
            this[`legBottom${i}Jump2_21`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                [40,0,0], [20,0,0],
                frames2, 0);
            this[`legBottom${i}Jump2_31`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                [20,0,0], [10,0,0],
                frames2, 0);
            this[`legBottom${i}Jump2_41`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                [10,0,0], [60,0,0],
                frames2, 0);
            this[`legBottom${i}Jump2_51`] = new AnimationObject(this[`legBottom${i}`],
                false, true,
                [0, 0, 0], [0, 0, 0],
                [60,0,0], [0,0,0],
                frames2, 0);
        }

        // ---------- creating Animations Managers ---------------

        // --- Jump and landing ----
        this.sheepAnimationJump1 = new AnimationsManager(
            [
                [this.bodyJump1_1],
                [this.bodyJump1_2],
                [this.bodyJump2_1],
                [this.bodyJump2_2],
                [this.bodyJump2_3],
                [this.bodyJump2_4],
                [this.bodyJump2_5]
            ],
            {
                conditionName: "repetitions",
                value: 1,
                referencedObject: null
            },
            () => {
                console.log("Landed on grass");
                this.body.flushAnimationFrame();
            }, 0
        );

        for (let i = fromLeg; i <= toLeg; i++) {
            this[`sheepAnimationLegJump1${i}`] = new AnimationsManager(
                [
                    [this[`legTop${i}Jump1_11`], this[`legBottom${i}Jump1_11`]],
                    [this[`legTop${i}Jump1_21`], this[`legBottom${i}Jump1_21`]],
                    [this[`legTop${i}Jump2_11`], this[`legBottom${i}Jump2_11`]],
                    [this[`legTop${i}Jump2_21`], this[`legBottom${i}Jump2_21`]],
                    [this[`legTop${i}Jump2_31`], this[`legBottom${i}Jump2_31`]],
                    [this[`legTop${i}Jump2_41`], this[`legBottom${i}Jump2_41`]],
                    [this[`legTop${i}Jump2_51`], this[`legBottom${i}Jump2_51`]],
                ],
                {
                    conditionName: "repetitions",
                    value: 1,
                    referencedObject: null
                },
                () => {
                    for (let i = fromLeg; i <= toLeg; i++) {
                        this[`legTop${i}`].flushAnimationFrame();
                        this[`legBottom${i}`].flushAnimationFrame();
                    }

                }, 0
            );

        }

        // ----- starting point: Walking towards fence -----
        for (let i = fromLeg; i <= toLeg; i++) {
            this[`sheepAnimationLeg${i}`] = new AnimationsManager(
                [
                    [this[`legTop${i}Animation_11`], this[`legBottom${i}Animation_11`]],
                    [this[`legTop${i}Animation_21`]],
                    [this[`legTop${i}Animation_31`], this[`legBottom${i}Animation_31`]],
                    [this[`legTop${i}Animation_41`]]
                ],
                {
                    conditionName: "repetitions",
                    value: -1,
                    referencedObject: null
                },
                () => {

                }, delay[i-1]
            );

        }

        this.sheepAnimationBodyWobble = new AnimationsManager(
            [
                [this.bodyAnimation_wobble1],
                [this.bodyAnimation_wobble2]
            ],
            {
                conditionName: "repetitions",
                value: -1,
                referencedObject: null
            },
            () => {

            }, delay
        );
        

        this.sheepAnimationBody = new AnimationsManager(
            [
                [this.bodyAnimation_1]
            ],
            {
                conditionName: "positionEnd",
                value: 0,
                referencedObject: this.bodyAnimation_1
            },
            () => {
                console.log("End walking towards fence, jumping...");
                this.body.flushAnimationFrame();
                
                for (let i = fromLeg; i <= toLeg; i++) {
                    this[`legTop${i}`].resetAnimation(false,0);
                    // Starting legs animation of jumping and landing
                    this[`legTop${i}`].startAnimation(false,1);
                }
                this.body.resetAnimation(false,0);

                // Starting body animation of jumping and landing
                this.body.startAnimation(false,2);
                
            }, delay
        );
        

        
        
        for (let i = fromLeg; i <= toLeg; i++) {
            this[`legTop${i}`].addAnimation(this[`sheepAnimationLeg${i}`]);
            this[`legTop${i}`].addAnimation(this[`sheepAnimationLegJump1${i}`]);
        }
        this.body.addAnimation(this.sheepAnimationBodyWobble);
        this.body.addAnimation(this.sheepAnimationBody);
        this.body.addAnimation(this.sheepAnimationJump1);
        
        document.getElementById("ButtonAnimation").onclick = function () {
            console.log("Starting walking towards fence...");
            
            this.body.resetAnimation(true);

            this.body.restartAnimation(false,0);
            this.body.restartAnimation(false,1);
            for (let i = fromLeg; i <= toLeg; i++) {
                this[`legTop${i}`].restartAnimation(false,0);
            }

        }.bind(this);

        // --------------------- DEBUG -------------------
        /*
        window.debug = function () {
            console.log("Debug...");
            
            this.body.flushAnimationFrame();
                
            for (let i = fromLeg; i <= toLeg; i++) {
                this[`legTop${i}`].resetAnimation(false,0);
                // jump1...
                this[`legTop${i}`].startAnimation(false,1);
                //this[`legTop${i}`].killAnimation();
            }
            
            //let currentPos = this.body.position;
            this.body.resetAnimation(false,0);

            //this.body.killAnimation(true);
            //this.sheepAnimationJump1.setNewStart([currentPos[0],0,currentPos[2]]);

            // jump1...
            this.body.startAnimation(false,2);

        }.bind(this);
        */

        // -------- Fence -------- 

        let fenceTexture = imageTextures.mcwood;

        let fenceHeight = legHeight * 2 + bodyHeight / 4;
        let fenceDepth = legDepthBottom;
        let lateralPartDepth = fenceDepth * 2 / 3;

        let materialFence = [
            vec4(0.4, 0.4, 0.4, 1.0), // materialAmbient
            vec4(0.2, 0.2, 0.2, 1.0), // materialDiffuse
            vec4(0.1, 0.1, 0.1, 1.0), // materialSpecular
            10.0, // materialShininess
        ];

        let fenceLegShape = new CubeShape(fenceDepth, fenceHeight, fenceDepth, true, true, fenceTexture, false);
        let fenceLateralShape = new CubeShape(fenceHeight, lateralPartDepth, lateralPartDepth, true, true, fenceTexture, false);
        this.fenceLegCentral = new ObjectMaterial("fence", fenceLegShape,
            ...materialFence,
            this.gl, this.program,
            fenceTexture
        );
        this.fenceLateral1t = new ObjectMaterial("fenceLateral1t", fenceLateralShape,
            ...materialFence,
            this.gl, this.program,
            fenceTexture
        );
        this.fenceLateral1b = new ObjectMaterial("fenceLateral1b", fenceLateralShape,
            ...materialFence,
            this.gl, this.program,
            fenceTexture
        );
        this.fenceLateral2t = new ObjectMaterial("fenceLateral2t", fenceLateralShape,
            ...materialFence,
            this.gl, this.program,
            fenceTexture
        );
        this.fenceLateral2b = new ObjectMaterial("fenceLateral2b", fenceLateralShape,
            ...materialFence,
            this.gl, this.program,
            fenceTexture
        );
        this.fenceLegLateral1 = new ObjectMaterial("fenceLegLateral1", fenceLegShape,
            ...materialFence,
            this.gl, this.program,
            fenceTexture
        );
        this.fenceLegLateral2 = new ObjectMaterial("fenceLegLateral2", fenceLegShape,
            ...materialFence,
            this.gl, this.program,
            fenceTexture
        );

        // Add Children

        this.fenceLegCentral.addChildren(this.fenceLegLateral1,
            this.fenceLateral1t, this.fenceLateral1b,
            this.fenceLateral2t, this.fenceLateral2b,
            this.fenceLegLateral2);

        // Set positions

        this.fenceLegCentral.setPosition(0, fenceHeight / 2, fencePosition);

        this.fenceLateral1t.setPosition(fenceHeight / 2, fenceHeight / 4, 0);
        this.fenceLateral1b.setPosition(fenceHeight / 2, -fenceHeight / 8, 0);
        this.fenceLateral2t.setPosition(-fenceHeight / 2, fenceHeight / 4, 0);
        this.fenceLateral2b.setPosition(-fenceHeight / 2, -fenceHeight / 8, 0);

        this.fenceLegLateral1.setPosition(fenceHeight, 0, 0);
        this.fenceLegLateral2.setPosition(-fenceHeight, 0, 0);

        // -------- Other objects -------- 

        // create cylinder
        this.cylinderEmissivity = vec4(1.0, 1.0, 1.0, 1.0);
        let cylinderShape = new Cylinder(0.5, cylinderHeight, 6, false);
        this.cylinder = new ObjectMaterial("cylinder", cylinderShape,
            vec4(0.0, 0.0, 0.0, 1.0), // materialAmbient
            vec4(0.1, 0.1, 0.1, 1.0), // materialDiffuse
            vec4(0.3, 0.3, 0.3, 1.0), // materialSpecular
            100.0, // materialShininess
            this.gl, this.program,
            null,

            true, // use cylinder emissivity
            this.cylinderEmissivity
        );
        this.cylinder.setPosition(...cylinderPos);

        // create floor
        let floorShape = new Floor(40, true);
        this.floor = new ObjectMaterial("floor", floorShape,
            vec4(0.0, 0.4, 0.0, 1.0), // materialAmbient
            vec4(0.0, 0.6, 0.0, 1.0), // materialDiffuse
            vec4(0.3, 0.3, 0.3, 1.0), // materialSpecular
            10.0, // materialShininess
            this.gl, this.program,
            imageTextures.grass
        );
        this.floor.setPosition(0, 0, 0);

        // Activate buttons
        this.activateButtons();

        // Render
        this.fps = 0;
        this.fpsInterval = 1000 / 60; // 60 fps
        this.lastFrameTime = Date.now();
        this.currentFrameTime = Date.now();
        this.calcFrameDelta = () => this.currentFrameTime - this.lastFrameTime;
        this.elapsedTime = 0;

        this.render();
    }

    render() {
        requestAnimationFrame(this.render.bind(this));
        // ----------------- DELTA TIME -----------------------

        this.lastFrameTime = this.currentFrameTime;
        this.currentFrameTime = new Date();
        this.elapsedTime += this.calcFrameDelta();

        this.fps = 1000 / this.elapsedTime;
        let delta = 1 / this.fps;

        if (this.elapsedTime >= this.fpsInterval) {
            this.elapsedTime = 0;
            // ...
        }

        // ------------------- DRAWING -----------------------

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // ------------ view position & projection matrix ---------------

        this.camera.renderCamera(this.gl, this.program);

        this.updateCameraInfos();

        // ------------ get active lights ---------------

        let activeLights = this.lightsClass.getActiveLights();

        // ------------ draw background ---------------

        this.backgroundClass.render(this.program,this.camera.viewMatrix,this.camera.projectionMatrix);

        // ----------------- sheep object -----------------------

        this.modelMatrix = mat4();
        this.body.renderObject(this.modelMatrix, this.camera.viewMatrix, activeLights);

        // ----------------- fence object -----------------------

        this.modelMatrix = mat4();
        this.fenceLegCentral.renderObject(this.modelMatrix, this.camera.viewMatrix, activeLights);

        // ----------------- floor object -----------------------

        if (this.renderTerrain) {
            this.modelMatrix = mat4();
            this.floor.renderObject(this.modelMatrix, this.camera.viewMatrix, activeLights);
        }

        // ----------------- cylindric object -----------------------

        this.modelMatrix = mat4();
        this.cylinder.renderObject(this.modelMatrix, this.camera.viewMatrix, activeLights);

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
    useProgram(program) {
        this.program = program;
        this.gl.useProgram(this.program);
        this.body.bindToProgram(program);
        this.fenceLegCentral.bindToProgram(program);
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

        // fps
        setInterval(() => {
            document.getElementById("fps").innerText = this.fps.toFixed(1);
        }, 200);

        // vertex/fragment lighting
        element("ButtonVertexLighting").onclick = function () { this.useProgram(this.programVertexLighting); }.bind(this);
        element("ButtonFragmentLighting").onclick = function () {
            this.useProgram(this.programFragmentLighting);
            this.body.isBumpActive(false);
            this.fenceLegCentral.isBumpActive(false);
        }.bind(this);
        element("ButtonFragmentLightingBump").onclick = function () {
            this.useProgram(this.programFragmentLighting);
            this.body.isBumpActive(true);
            this.fenceLegCentral.isBumpActive(true);
        }.bind(this);

        // viewer controls
        let stepMovement = 0.2;
        let stepRotation = 2.0;
        element("wButton").onclick = function () { this.camera.moveCamera(0, 0, -stepMovement); }.bind(this);
        element("aButton").onclick = function () { this.camera.moveCamera(stepMovement, 0, 0); }.bind(this);
        element("sButton").onclick = function () { this.camera.moveCamera(0, 0, stepMovement); }.bind(this);
        element("dButton").onclick = function () { this.camera.moveCamera(-stepMovement, 0, 0); }.bind(this);

        element("flydButton").onclick = function () { this.camera.moveCamera(0, -stepMovement, 0); }.bind(this);
        element("flyuButton").onclick = function () { this.camera.moveCamera(0, stepMovement, 0); }.bind(this);

        element("leftButton").onclick = function () { this.camera.rotateCamera(0, -stepRotation); }.bind(this);
        element("upButton").onclick = function () { this.camera.rotateCamera(stepRotation, 0); }.bind(this);
        element("rightButton").onclick = function () { this.camera.rotateCamera(0, stepRotation); }.bind(this);
        element("downButton").onclick = function () { this.camera.rotateCamera(-stepRotation, 0); }.bind(this);

        element("nearSlider").onchange = function () { this.camera.NEAR = elementValue("nearSlider"); }.bind(this);
        element("farSlider").onchange = function () { this.camera.FAR = elementValue("farSlider"); }.bind(this);

        element("ButtonCylLights").onclick = function () {
            let res = this.lightsClass.toggleLights([0, 1, 2]);
            if (res[0] == false) {
                this.cylinder.isLightSource = false;
            } else this.cylinder.isLightSource = true;
        }.bind(this);

        element("ButtonSun").onclick = function () {
            this.lightsClass.toggleLights([3]);
        }.bind(this);

        element("ButtonTerrain").onclick = function () { this.renderTerrain = !this.renderTerrain; }.bind(this);
    }

    updateCameraInfos() {
        document.getElementById("coords").innerText = "(" + parseFloat(this.camera.viewerPos[0]).toFixed(1) + "|" +
            parseFloat(this.camera.viewerPos[1]).toFixed(1) + "|" +
            parseFloat(this.camera.viewerPos[2]).toFixed(1) + ")";

        document.getElementById("angle").innerText = "(" + parseFloat(this.camera.viewerInclination[0] * 180 / Math.PI).toFixed(1) + "|" +
            parseFloat(this.camera.viewerInclination[1] * 180 / Math.PI).toFixed(1) + ")";

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
        img.src = "textures/" + src;
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;

    });
}

let homework2 = undefined;
(async () => {
    let mcwood = await loadImage("texture_minecraftwood.png");
    let grass = await loadImage("texture_grass.jpg");

    let face = await loadImage("headSheep.png");
    let wool = await loadImage("sheepWool.png");
    let legDown = await loadImage("legDown.png");

    let pX = await loadImage("skybox_pX.jpg");
    let nX = await loadImage("skybox_nX.jpg");
    let pY = await loadImage("skybox_pY.jpg");
    let nY = await loadImage("skybox_nY.jpg");
    let pZ = await loadImage("skybox_pZ.jpg");
    let nZ = await loadImage("skybox_nZ.jpg");

    let sky = {
        pX,nX,pY,nY,pZ,nZ
    }

    homework2 = new objectHomework2("gl-canvas", {mcwood, grass, face, wool, legDown, sky });
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

/**
 * Doubts:
 * 2: grass field: is it ok a texture or it is necessary a color?
 * 3: is it ok to make texture + bump to all face?
 * Can I add more than what requested?
 */