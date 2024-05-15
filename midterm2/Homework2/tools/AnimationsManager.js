/**
 *     Animations Manager
 *     ______      ______
 *  -- \  00/      \ 00 /
 * --- /\  /\/ -> \/\  /\/
 *  -- \ \/          \/
 * 
 */

/**
 * Class to create manage multiple animations
 */
class AnimationsManager{
    /**
     * animations: 
     *      [
     *          [anim11,anim12,anim13], 
     *          [anim21,anim22,anim23],
     *          ...
     *      ] =  anim11+anim12+anim13 and then start anim21+anim22+anim23 ...
     */
    constructor(animations, 
                endCondition = {conditionName: "position", 
                                value: [0,0,0], 
                                referencedObject: null}, // repetitions = -1 = infinite
                onEnd = ()=>{},
                delay = 0){
        this.animations = animations;
        this.index = 0;
        this.endCondition = endCondition;
        this.isActive = false;
        this.onEnd = onEnd;

        this.delay = delay;
        this.currentDelay = delay;

        this.startingEndConditionValue = endCondition.value;
    }

    animationTick(ticks = 1){
        if(this.currentDelay > 0){
            this.currentDelay-=ticks;
            return;
        }
        if(!this.isActive) return;

        let numOfEnds = 0;

        for(let i=0; i<this.animations[this.index].length; i++){
            let res = this.animations[this.index][i].animationTick(ticks);
            if(res[2] == true){
                numOfEnds++;
            }
        }

        let isEnded = this.checkEndCondition();
        if(isEnded == true){
            this.endAnimation();
            return;
        }
        //console.log(numOfEnds);
        if(this.animations[this.index].length == numOfEnds){ this.next(); }
    
    }

    next(){
        let nextIndex = (this.index+1) % this.animations.length;
        if(nextIndex == 0 && this.endCondition.conditionName == "repetitions") 
            if(this.endCondition.value != -1) this.endCondition.value--;
        //this.isActive = this.checkEndCondition();
        this.index = nextIndex;
    }

    endAnimation(){
        if(this.isActive){
            this.isActive = false;
            this.currentDelay = this.delay;
            this.onEnd();
        }
    }

    killAnimation(){
        this.isActive = false;
        this.animations = [[]];
        this.currentDelay = this.delay;
    }

    resetAnimation(){
        this.isActive = false;
        this.currentDelay = this.delay;
        for(let index = this.animations.length-1; index >=0; index--)
            for(let i=this.animations[index].length-1; i>=0; i--){
                this.animations[index][i].reset(true);
            }
        this.index = 0;

        this.endCondition.value = this.startingEndConditionValue;
    }

    startAnimation(){
        this.isActive = true;
    }

    setNewStart(positionStart = null,thetaStart = null){
        for(let a = 0; a < this.animations.length; a++){
            for(let i=0; i < this.animations[a].length; i++){
                this.animations[a][i].setNewStart(positionStart,thetaStart);
            }
        }
    }

    checkEndCondition(){
        let condition = this.endCondition.conditionName;
        let val = this.endCondition.value || 0;
        let obj = this.endCondition.referencedObject || null;
        switch(condition){
            default:
                return false;
            case "position": // TODO: check bugs
                if(obj.position[0] == val[0] && obj.position[1] == val[1] && obj.position[2] == val[2]) return true;
                else return false;
            case "positionEnd":
                if(obj.cycleEnded){
                    obj.isActive = false;
                    return true;
                }
                else return false;
            case "repetitions":
                if(val != -1){
                    if(val > 0){
                        return false;
                    }
                    else {
                        return true;
                    }
                } 
                else return false;
        }

    }



}