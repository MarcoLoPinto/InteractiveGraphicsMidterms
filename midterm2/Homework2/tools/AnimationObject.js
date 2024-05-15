/**
 *     Animation base class
 *     ______
 *  -- \  00/ 
 * --- /\  /\/
 *  -- \ \/
 * 
 */

/**
 * Class to create a new animation
 */
class AnimationObject{
    constructor(objectReference = null,
                changePosition = true, changeRotation = true,
                positionStart = [0,0,0], positionEnd = [0,0,0], 
                thetaStart = [0,0,0], thetaEnd = [0,0,0], 
                frames = 60, startFrame = 0){
        
        this.objectReference = objectReference;
        this.isActive = true;
        this.changePosition = changePosition;
        this.changeRotation = changeRotation;

        this.cycleEnded = false;

        this.initVariables(positionStart, positionEnd, thetaStart, thetaEnd,frames,startFrame,this.isActive);
    }

    animationTick(ticks = 1){
        this.cycleEnded = false;

        let currentNumberOfTicks = (this.frameCurrent + ticks);

        this.frameCurrent = currentNumberOfTicks > this.frames ? 
                    currentNumberOfTicks - this.frames :
                    currentNumberOfTicks;
                        
        this.numberOfTicks += ticks;

        let percentage = this.animationPercentage();
        if(percentage > 1){
            this.numberOfTicks = this.frames;
            percentage = this.animationPercentage();
        }
        
        let frame = this.frameToRender();

        this.positionCurrent = this.positionDelta.map( (n, i)=>  this.positionStart[i] + frame*n);
        this.thetaCurrent =  this.thetaDelta.map( (n, i)=>  this.thetaStart[i] + frame*n);

        //let positionCurrent = this.positionCurrent;
        //let thetaCurrent = this.thetaCurrent;

        if(this.changePosition) this.objectReference.addAnimationFrame("position",this.positionCurrent);
        if(this.changeRotation) this.objectReference.addAnimationFrame("rotation",this.thetaCurrent);
        if(percentage >= 1){
            this.cycleEnded = true;
            this.reset();
        }
        

        return [this.positionCurrent,this.thetaCurrent,this.cycleEnded];

    }

    animationPercentage(){
        return this.numberOfTicks/this.frames;
    }

    frameToRender(){
        return this.frameCurrent/this.frames;
    }
    
    reset(resetCoords = false, isActive = true){
        this.positionCurrent = this.positionStart;
        this.thetaCurrent = this.thetaStart;
        this.frameCurrent = this.startFrame;

        this.numberOfTicks = 0;
        
        this.isActive = isActive;
        
        if(resetCoords){
            if(this.changePosition) this.objectReference.setPosition(...this.positionStart);
            if(this.changeRotation) this.objectReference.setRotation(...this.thetaStart);
        }
    }

    end(){
        this.reset(false,false);
    }

    initVariables(positionStart, positionEnd, thetaStart, thetaEnd,frames,startFrame,isActive){
        this.positionStart = positionStart;
        this.positionEnd = positionEnd;
        this.thetaStart = thetaStart;
        this.thetaEnd = thetaEnd;

        this.frames = frames;

        this.startFrame = startFrame;

        this.positionCurrent = positionStart;
        this.thetaCurrent = thetaStart;
        this.frameCurrent = startFrame;

        this.positionDelta = positionEnd.map((n, i) => n - positionStart[i]);
        this.thetaDelta = thetaEnd.map((n, i) => n - thetaStart[i]);
        this.numberOfTicks = 0;
        
        this.isActive = isActive;
    }

    setNewStart(positionStart = null,thetaStart = null){
        if(positionStart){
            this.positionStart = this.positionStart.map((n, i) => n + positionStart[i]);
            this.positionEnd = this.positionEnd.map((n, i) => n + positionStart[i]);
        }
        if(thetaStart){
            this.thetaStart = this.thetaStart.map((n, i) => n + thetaStart[i]);
            this.thetaEnd = this.thetaEnd.map((n, i) => n + thetaStart[i]);
        }
        this.initVariables(this.positionStart, this.positionEnd, this.thetaStart, this.thetaEnd,this.frames,this.startFrame,this.isActive);
    }
}