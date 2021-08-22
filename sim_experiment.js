// convienience functions
function objOrFun2fun(objOrFun) {
    if (typeof objOrFun === 'function') { return objOrFun; } else { return () => { return objOrFun } }
};
function objOrArray2array(objOrArray) {
    if (Array.isArray(objOrArray)) { return objOrArray; } else { return [objOrArray]; }
};
function vectAdd(vecA,vecB){
    return vecA.map((e,i)=>{return e+vecB[i]});
};
function vectScale(vecA,scaling){
    return vecA.map((e,i)=>{return e*scaling});
};

class BaseSim {
    constructor(){
        this.params = {K:1,D:.1};

        this.time = 0;
        this.nSim = 0;
        
        this.simStep = 1/100; // simulation timestep in seconds
        this.simMulti = 1; // multiplicator for real-time / slow-mo / speed-up
        this.plotMulti = 6; // multiplicator for the update-rate of a plotting function

        this._isRunning = false;

        this.init();
    }
    // getters/setters
    get isRunning(){return this._isRunning;};
    // methods
    init(){
        this.states = [0,0];
        this.inputs = [0];
        this.disturbances = [0];
        this.reference = 0;
    };
    controlLaw(t,x,w,z){
        // must return u(t)
        return [0];
    };
    systemEquation(t,x,u,z){
        // must return x_dot(t)
        let params = this.params;

        let x_dot = [x[1],-params.K*x[0]-params.D*x[1]+u[0]+z[0]];
        return x_dot;
    };
    outputEquation(t,x,u,z){
        // must return y(t)
        return x[0];
    };
    plotFun(t,x,u,z){
        // overwrite me
        console.log(x);
    }
    update(self){
        let t = self.time;
        let w = self.reference;
        let x = self.states;
        let z = self.disturbances;
        let Ts = self.simStep;
        
        
        // compute the control law
        let u = self.controlLaw(t,x,w,z);

        
        // update the states
        let x_new = self._rk4Int(Ts,t,x,u,z);


        // is it time to call the plotting function?
        if (self.nSim % self.plotMulti == 0){
            self.plotFun(t,x,u,z);
        };


        // store the new values
        self.states = x_new;
        self.time += Ts;
        self.nSim += 1;

        // call output function
        return self.outputEquation(t,x,u,z);

    };
    _fwdEulerInt(Ts,t,x,u,z){
        let x_dot = this.systemEquation(t,x,u,z);
        return vectAdd(x,vectScale(x_dot,Ts));
    };
    _rk4Int(Ts,t,x,u,z){
        let k1 = this.systemEquation(t,x,u,z);
        let k2 = this.systemEquation(t+Ts/2,vectAdd(x,vectScale(k1,Ts/2)),u,z);
        let k3 = this.systemEquation(t+Ts/2,vectAdd(x,vectScale(k2,Ts/2)),u,z);
        let k4 = this.systemEquation(t+Ts,vectAdd(x,vectScale(k3,Ts)),u,z);
        var temp = vectAdd(k1,vectScale(k2,2));
        temp = vectAdd(temp,vectScale(k3,2));
        temp = vectAdd(temp,k4);
        return vectAdd(x,vectScale(temp,Ts/6))
    }
    start(){
        if (this._isRunning){return false;}
        this._timer = setInterval(this.update,this.simStep*1000*this.simMulti,this);
        this._isRunning = true;
    };
    stop(){
        clearInterval(this._timer);
        this._isRunning = false;
    };
    reset(){
        this.time = 0;
        this.nSim = 0;

        this.init();
    }
}