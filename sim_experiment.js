// convienience functions
function objOrFun2fun(objOrFun) {
    if (typeof objOrFun === 'function') { return objOrFun; } else { return () => { return objOrFun } }
};
function objOrArray2array(objOrArray) {
    if (Array.isArray(objOrArray)) { return objOrArray; } else { return [objOrArray]; }
};

class BaseSim {
    constructor(){
        this.params = {K:1,D:.1};

        this.time = 0;
        this.nSim = 0;
        
        this.simStep = 1/60; // simulation timestep in seconds
        this.simMulti = 1; // multiplicator for real-time / slow-mo / speed-up
        this.plotMulti = 6; // multiplicator for the update-rate of a plotting function

        this._isRunning = false;

        this.init();
    }
    // getters/setters
    get isRunning(){return this._isRunning;};
    // methods
    init(){
        this.states = [10,0];
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
        let x_dot = self.systemEquation(t,x,u,z);
        let x_new = self._fwdEulerInt(x,x_dot,Ts);


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
    _fwdEulerInt(x0,x_dot,Ts){
        return x0.map((x,i)=>x+x_dot[i]*Ts);
    };
    // TODO: also add a rk4 method
    start(){
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