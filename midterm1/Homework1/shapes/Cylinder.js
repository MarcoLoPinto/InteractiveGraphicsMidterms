class Cylinder extends Shape{
    constructor(radius,height,basePoints = 6, hasTexture = false){
        super(hasTexture);
        this.basePoints = basePoints;

        this.createBase(radius,height,basePoints,true); //top
        this.createLateral(radius,height,basePoints);
        this.createBase(radius,-height,basePoints,false); // bottom
    }

    createBase(radius,height,basePoints,isTop=true){
        for(let i = 0; i < basePoints; i+=1){
            let x1 = radius*Math.cos(i*2*Math.PI/basePoints);
            let z1 = -radius*Math.sin(i*2*Math.PI/basePoints);
            let x2 = radius*Math.cos(((i+1)%basePoints)*2*Math.PI/basePoints);
            let z2 = -radius*Math.sin(((i+1)%basePoints)*2*Math.PI/basePoints);
            let y = height/2;

            let v0 = vec4(0,y,0,1);
            let v1 = vec4(x1,y,z1,1);
            let v2 = vec4(x2,y,z2,1);

            if(isTop) this.triangle(v0,v1,v2);
            else this.triangle(v0,v2,v1);
        }
    }

    createLateral(radius,height,basePoints){
        for(let i = 0; i < basePoints; i+=1){
            let x1 = radius*Math.cos(i*2*Math.PI/basePoints);
            let z1 = -radius*Math.sin(i*2*Math.PI/basePoints);
            let x2 = radius*Math.cos(((i+1)%basePoints)*2*Math.PI/basePoints);
            let z2 = -radius*Math.sin(((i+1)%basePoints)*2*Math.PI/basePoints);
            let y1 = height/2;
            let y2 = -height/2;

            let v1 = vec4(x1,y1,z1,1);
            let v2 = vec4(x1,y2,z1,1);
            let v3 = vec4(x2,y1,z2,1);
            let v4 = vec4(x2,y2,z2,1);

            this.triangle(v1,v2,v3);
            this.triangle(v3,v2,v4);
        }
    }
}

/*
    createBase(radius,height,basePoints = 6,isTop=true){
        for(let i = 0; i < basePoints; i+=1){
            let x1 = radius*Math.cos(i*2*Math.PI/basePoints);
            let y1 = radius*Math.sin(i*2*Math.PI/basePoints);
            let x2 = radius*Math.cos(((i+1)%basePoints)*2*Math.PI/basePoints);
            let y2 = radius*Math.sin(((i+1)%basePoints)*2*Math.PI/basePoints);
            let z = height/2;

            let v0 = vec4(0,0,z,1);
            let v1 = vec4(x1,y1,z,1);
            let v2 = vec4(x2,y2,z,1);

            if(isTop) this.triangle(v0,v1,v2);
            else this.triangle(v0,v2,v1);
        }
    }

    createLateral(radius,height,basePoints = 6){
        for(let i = 0; i < basePoints; i+=1){
            let x1 = radius*Math.cos(i*2*Math.PI/basePoints);
            let y1 = radius*Math.sin(i*2*Math.PI/basePoints);
            let x2 = radius*Math.cos(((i+1)%basePoints)*2*Math.PI/basePoints);
            let y2 = radius*Math.sin(((i+1)%basePoints)*2*Math.PI/basePoints);
            let z1 = height/2;
            let z2 = -height/2;

            let v1 = vec4(x1,y1,z1,1);
            let v2 = vec4(x1,y1,z2,1);
            let v3 = vec4(x2,y2,z1,1);
            let v4 = vec4(x2,y2,z2,1);

            this.triangle(v1,v2,v3);
            this.triangle(v3,v2,v4);
        }
    }
*/