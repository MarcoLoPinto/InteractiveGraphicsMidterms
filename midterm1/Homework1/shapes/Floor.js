class Floor extends Shape{
    constructor(dimension, hasTexture = false){
        super(hasTexture, false);

        this.createFloor(dimension); //top

    }

    createFloor(dimension){
        let v1 = vec4(-dimension/2,0,-dimension/2,1);
        let v2 = vec4(-dimension/2,0,+dimension/2,1);
        let v3 = vec4(+dimension/2,0,-dimension/2,1);
        let v4 = vec4(+dimension/2,0,+dimension/2,1);

        this.triangle(v1,v2,v3);
        this.triangle(v2,v4,v3);
        
    }

}