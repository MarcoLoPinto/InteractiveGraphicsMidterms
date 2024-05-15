/**
 *      Camera Class
 *           _
 *        __|#|__
 *       |  (O)  |
 *       |_______|
 */


class Camera{
    /**
     * 
     * @param {vec3} viewerPos initial viewer position
     * @param {vec2} viewerInclination initial viewer inclination
     * @param {vec3} at initial viewer direction to view
     * @param {float} near 
     * @param {float} far 
     * @param {float} fow 
     * @param {float} ratio 
     * @param {float} radius 
     * @param {vec3} up 
     */
    constructor(viewerPos, viewerInclination, at = vec3(0.0, 0.0, 0.0), 
                near = 0.3, far = 5, fow = 60, ratio = 1, radius = 1, 
                up = vec3(0.0, 1.0, 0.0)){
        // viewer
        this.FOW = fow;
        this.RATIO = ratio;
        this.NEAR = near;
        this.FAR = far;
        this.viewerPos = viewerPos; // wasd movement
        this.viewerInclination = viewerInclination; // rotation eye, theta (0) and phi (1)
        this.at = at;
        this.up = up;
        this.radius = radius;

        // input movement
        this.inputs = {
            68: false, // d
            83: false, // s
            65: false, // a
            87: false, // w

            16: false, // shift -> y down
            32: false, // space -> y up

            37: false, // left
            38: false, // top
            39: false, // right
            40: false, // bottom
        };
        
        this.createInputs();
        
        // init camera
        this.moveCamera(0,0,0);
        this.rotateCamera(0,0);
        this.projectionMatrix = perspective(this.FOW, this.RATIO, this.NEAR, this.FAR);
        this.viewMatrix = lookAt(this.viewerPos, this.at, this.up);
    }
    rotateCamera(dtheta,dphi){
        this.viewerInclination[0] += dtheta * (Math.PI/180);
        this.viewerInclination[1] += dphi * (Math.PI/180);
        let res = this.eye();
        this.at[0] = this.viewerPos[0] + res[0];
        this.at[1] = this.viewerPos[1] + res[1];
        this.at[2] = this.viewerPos[2] + res[2];
    }
    moveCamera(dx,dy,dz) {
        let ixx = dz*Math.cos(this.viewerInclination[1]);
        let ixz = dz*Math.sin(this.viewerInclination[1]);

        let izx = dx*Math.cos(this.viewerInclination[1] + Math.PI/2);
        let izz = dx*Math.sin(this.viewerInclination[1] + Math.PI/2);

        this.viewerPos[0] += ixx + izx;
        this.viewerPos[1] += dy;
        this.viewerPos[2] += ixz + izz;
        this.at[0] += ixx + izx;
        this.at[1] += dy;
        this.at[2] += ixz + izz;
    }

    eye() {
        return vec3(this.radius * Math.sin(this.viewerInclination[0]) * Math.cos(this.viewerInclination[1]),
                    this.radius * Math.cos(this.viewerInclination[0]),
                    this.radius * Math.sin(this.viewerInclination[0]) * Math.sin(this.viewerInclination[1]));
    }

    renderCamera(gl,program){

        this.projectionMatrix = perspective(this.FOW, this.RATIO, this.NEAR, this.FAR);
        this.viewMatrix = lookAt(this.viewerPos, this.at, this.up);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program,
            "uProjectionMatrix"), false, flatten(this.projectionMatrix));
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program,
            "uViewMatrix"), false, flatten(this.viewMatrix));
            
    }

    onKey(event, isDown = false){
        event.preventDefault();
        var keyCode = event.keyCode;
        this.inputs[keyCode] = isDown;
    }

    createInputs(){
        let onKeyDown = (event)=> this.onKey(event, true);
        let onKeyUp = (event)=> this.onKey(event, false);

        window.addEventListener("keydown", onKeyDown.bind(this), false);
        window.addEventListener("keyup", onKeyUp.bind(this), false);
    }

    computeInputs(){
        for(let key in this.inputs){
            if(this.inputs[key]){
                this.action(key);
            }
        }
    }

    action(code){
        let degrees = 0.8;
        let spaceSpeed = 0.02;
        switch (parseInt(code)) {
            case 68: //d
                this.moveCamera(-spaceSpeed,0,0);
                break;
            case 83: //s
                this.moveCamera(0,0,spaceSpeed);
                break;
            case 65: //a
                this.moveCamera(spaceSpeed,0,0);
                break;
            case 87: //w
                this.moveCamera(0,0,-spaceSpeed);
                break;

            case 16: //shift -> y down
                this.moveCamera(0,-spaceSpeed,0);
                break;
            case 32: //space -> y up
                this.moveCamera(0,spaceSpeed,0);
                break;

            case 37: // left
                this.rotateCamera(0,-degrees);
                break;
            case 38: // top
                this.rotateCamera(degrees,0);
                break;
            case 39: // right
                this.rotateCamera(0,degrees);
                break;
            case 40: // bottom
                this.rotateCamera(-degrees,0);
                break;
        }
    }


}