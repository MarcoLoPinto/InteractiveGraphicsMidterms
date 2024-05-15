/**
 *    Lights Class
 *       ..---..
 *      /       \
 *     |         |
 *     :         ;
 *      \  \~/  /
 *       `, Y ,'
 *        |_|_|
 *        |===|
 *        |===|
 *         \_/
 * 
 */

class Lights{
    
    // lightXXX must be all vec4 types
    constructor(){
        this.lights = [];
    }

    createLight(lightPosition,lightAmbient,lightDiffuse,lightSpecular, 
                lightDirection = vec3(0,-1,0), lightAngleLimit = -1){
        // if w = 0, we are specifying a parallel source (not finite location)
        // if w = 1, we are specifying a finite location
        // lightPosition:  w = 0.0 -> this light is infinitely away
        let len = this.lights.push({
            lightPosition,lightAmbient,lightDiffuse,lightSpecular,
            isActive:true,
            // for directional lighting
            lightDirection,
            lightAngleLimit
        });
        return len;
    }

    toggleLight(index){
        this.lights[index].isActive = !this.lights[index].isActive;
        return this.lights[index].isActive;
    }

    toggleLights(indexes){
        let res = [];
        for(let index of indexes){
            res.push(this.toggleLight(index));
        }
        return res;
    }

    getActiveLights(){
        return this.lights.filter(function( obj ) {
            return obj.isActive == true;
        });
    }

}