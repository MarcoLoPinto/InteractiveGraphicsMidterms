/**
 * Class to create a cubic shape
 * @param {int} width x-axis extension
 * @param {int} height y-axis extension
 * @param {int} depth z-axis extension
 * @param {boolean} hasTexture 
 * @param {boolean} hasBump 
 * @param {image} image 
 */
class CubeShape extends Shape{
    constructor(width = 1, height = 1, depth = 1, hasTexture = false, hasBump = true, image = null, useFace = true){
        super(hasTexture, hasBump);

        this.createFigure(width, height, depth, useFace);

        if(hasBump){
            if(image == null){
                let bump = this.createRandomBump(128, 0, 3);
                this.computeBump(bump);
            }
            else {
                let bump = this.createImageGrayScale(image);
                //bump = this.computeGaussianBlur(bump);
                this.computeBump(bump);
            }
        }
    }

    createFigure(width, height, depth, useFace){
        let dx = width/2;
        let dy = height/2;
        let dz = depth/2;

        // top
        let t0 = vec4(-dx,dy,dz,1.0);
        let t1 = vec4(dx,dy,dz,1.0);
        let t2 = vec4(-dx,dy,-dz,1.0);
        let t3 = vec4(dx,dy,-dz,1.0);
        this.rectangle(t0,t1,t2,t3, useFace);

        // front
        let f0 = vec4(-dx,-dy,dz,1.0);
        let f1 = vec4(dx,-dy,dz,1.0);
        let f2 = vec4(-dx,dy,dz,1.0);
        let f3 = vec4(dx,dy,dz,1.0);
        this.rectangle(f0,f1,f2,f3, useFace);

        // right
        let r0 = vec4(-dx,-dy,-dz,1.0);
        let r1 = vec4(-dx,-dy,dz,1.0);
        let r2 = vec4(-dx,dy,-dz,1.0);
        let r3 = vec4(-dx,dy,dz,1.0);
        this.rectangle(r0,r1,r2,r3, useFace);

        // left
        let l0 = vec4(dx,-dy,dz,1.0);
        let l1 = vec4(dx,-dy,-dz,1.0);
        let l2 = vec4(dx,dy,dz,1.0);
        let l3 = vec4(dx,dy,-dz,1.0);
        this.rectangle(l0,l1,l2,l3, useFace);

        // bottom
        let b0 = vec4(-dx,-dy,-dz,1.0);
        let b1 = vec4(dx,-dy,-dz,1.0);
        let b2 = vec4(-dx,-dy,dz,1.0);
        let b3 = vec4(dx,-dy,dz,1.0);
        this.rectangle(b0,b1,b2,b3, useFace);

        // back
        let d0 = vec4(dx,-dy,-dz,1.0);
        let d1 = vec4(-dx,-dy,-dz,1.0);
        let d2 = vec4(dx,dy,-dz,1.0);
        let d3 = vec4(-dx,dy,-dz,1.0);
        this.rectangle(d0,d1,d2,d3, useFace);

        
    }

}