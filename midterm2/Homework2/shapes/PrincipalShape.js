class PrincipalShape extends Shape{
    constructor(dimension = 1, hasTexture = false, hasBump = true, image = null){
        super(hasTexture, hasBump);

        this.createFigure(dimension);

        if(hasBump){
            if(image == null){
                let bump = this.createRandomBump(128, 0, 3);
                this.computeBump(bump);
            }
            else {
                let bump = this.createImageGrayScale(image);
                this.computeBump(bump);
            }
        }
        
    }

    createFigure(dimension){
        let d = dimension/2;
        let zh = 0.5;
        let zb = -0.5;

        // top
        let v0 = vec4(0.0,0.0,zh,1.0);
        let v1 = vec4(d,-d,0.0,1.0);
        let v2 = vec4(d,d,0.0,1.0);
        this.triangle(v0,v1,v2);
        let v3 = vec4(-d,d,0.0,1.0);
        this.triangle(v0,v2,v3);
        let v4 = vec4(-d,-d,0.0,1.0);
        this.triangle(v0,v3,v4);
        this.triangle(v0,v4,v1);

        // left
        let v5 = vec4(d,d,zb,1.0);
        this.triangle(v5,v2,v1);

        // right
        let v6 = vec4(-d,d,zb,1.0);
        this.triangle(v4,v3,v6);

        // front
        this.triangle(v5,v1,v4);
        this.triangle(v4,v6,v5);

        // back
        this.triangle(v6,v3,v2);
        this.triangle(v2,v5,v6);
    }

}