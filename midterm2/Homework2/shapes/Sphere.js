class Sphere extends Shape{
    constructor(radius,divisions = 3, hasTexture = false, hasBump = true, image = null, invertedNormals = false){
        super(hasTexture, hasBump);

        this.createFigure(radius,divisions);

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

    createFigure(r,n){
        let toRadians = (degrees) => degrees * Math.PI / 180;
        let xCoord = (phi,theta) => parseFloat((r*Math.cos(toRadians(phi))*Math.sin(toRadians(theta))).toFixed(6));
        let yCoord = (phi,theta) => parseFloat((r*Math.sin(toRadians(phi))*Math.sin(toRadians(theta))).toFixed(6));
        let zCoord = (phi,theta) => parseFloat((r*Math.cos(toRadians(theta))).toFixed(6));

        var va = vec4(xCoord(0,180), yCoord(0,180), zCoord(0,180),1);
        var vb = vec4(xCoord(0,60), yCoord(0,60), zCoord(0,60), 1);
        var vc = vec4(xCoord(120,60), yCoord(120,60), zCoord(120,60), 1);
        var vd = vec4(xCoord(240,60), yCoord(240,60), zCoord(240,60),1);
        //this.tetrahedron(va,vb,vc,vd,n,r);
        this.recursiveTriangle(va,vb,vc,vd,r,2);
    }

    recursiveTriangle(va,vb,vc,vd,r,n){
        this.triangleDivision(va,vb,vd,r,n);
        this.triangleDivision(va,vc,vb,r,n);
        this.triangleDivision(va,vd,vc,r,n);
        this.triangleDivision(vd,vb,vc,r,n);
    }

    triangleDivision(a,b,c,r,count){
        if(count>0){
            let mx = (a[0] + b[0] + c[0])/3;
            let my = (a[1] + b[1] + c[1])/3;
            let mz = (a[2] + b[2] + c[2])/3;
            let median = vec4(mx,my,mz,1);

            var E1 = subtract(b, a);
            var E2 = subtract(c, a);
            var normal = cross(E1, E2);
            normal = vec4(normal[0],normal[1],normal[2],1);
            let normalized = mult(r/2,normalize(normal));
            let d = add(median,normalized);
            d[3] = 1;

            //console.log(a,b,c,d,normal);

            //this.triangleDivision(a,b,c,count-1,r/2);
            this.triangleDivision(a,d,b,r,count-1);
            this.triangleDivision(d,c,b,r,count-1);
            this.triangleDivision(a,c,d,r,count-1);

        } else{
            this.triangle(a,b,c);
        }
    }

    divideTriangle(a, b, c, count, r) {
        if (count > 0) {
            var ab = mix( a, b, 0.5);
            var ac = mix( a, c, 0.5);
            var bc = mix( b, c, 0.5);

            ab = mult(1,normalize(ab, true));
            ac = mult(1,normalize(ac, true));
            bc = mult(1,normalize(bc, true));
    
            this.divideTriangle(a, ab, ac, count - 1, r);
            this.divideTriangle(ab, b, bc, count - 1, r);
            this.divideTriangle(bc, c, ac, count - 1, r);
            this.divideTriangle(ab, bc, ac, count - 1, r);
        }
        else {
            //a = mult(r,a);
            //b = mult(r,b);
            //c = mult(r,c);
            this.triangle(a,b,c);
        }
    }
    
    tetrahedron(a, b, c, d, n, r) {
        n = 1;
        this.divideTriangle(a, b, c, n, r);
        this.divideTriangle(d, c, b, n, r);
        this.divideTriangle(a, d, b, n, r);
        this.divideTriangle(a, c, d, n, r);
    }


}