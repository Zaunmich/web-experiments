// convienience functions
function objOrFun2fun(objOrFun) {
    if (typeof objOrFun === 'function') { return objOrFun; } else { return () => { return objOrFun } }
};
function objOrArray2array(objOrArray) {
    if (Array.isArray(objOrArray)) { return objOrArray; } else { return [objOrArray]; }
};
function vectAdd(vecA, vecB) {
    return vecA.map((e, i) => { return e + vecB[i] });
};
function vectScale(vecA, scaling) {
    return vecA.map((e, i) => { return e * scaling });
};

class BaseSim {
    constructor() {

        this.time = 0;
        this.nSim = 0;

        this.simStep = 1 / 100; // simulation timestep in seconds
        this.simMulti = 1; // multiplicator for real-time / slow-mo / speed-up
        this.plotMulti = 6; // multiplicator for the update-rate of a plotting function
        // TODO: have a working slow-motion mode

        this._isRunning = false;

        this.init();
    }
    // getters/setters
    get isRunning() { return this._isRunning; };
    // methods
    init() {
        this.states = [0, 0];
        this.inputs = [0];
        this.disturbances = [0];
        this.reference = 0;
        this.params = { K: 1, D: .1 };
    };
    controlLaw(t, x, w, z) {
        // must return u(t)
        return [0];
    };
    systemEquation(t, x, u, z) {
        // must return x_dot(t)
        let params = this.params;

        let x_dot = [x[1], -params.K * x[0] - params.D * x[1] + u[0] + z[0]];
        return x_dot;
    };
    outputEquation(t, x, u, z) {
        // must return y(t)
        return x[0];
    };
    plotFun(t, x, u, z, y) {
        // overwrite me
        console.log(x);
    }
    update(self) {
        let t = self.time;
        let w = self.reference;
        let x = self.states;
        let z = self.disturbances;
        let Ts = self.simStep;


        // compute the control law
        let u = self.controlLaw(t, x, w, z);


        // update the states
        let x_new = self._fwdEulerInt(Ts,t,x,u,z); // fwd euler integration
        // let x_new = self._rk4Int(Ts, t, x, u, z); // runge kutta 4th order


        // is it time to call the plotting function?
        if (self.nSim % self.plotMulti == 0) {
            let y = self.outputEquation(t, x, u, z);
            self.plotFun(t, x, u, z, y);
        };


        // store the new values
        self.states = x_new;
        self.time += Ts;
        self.nSim += 1;

        // call output function
        return self.outputEquation(t, x, u, z);

    };
    _fwdEulerInt(Ts, t, x, u, z) {
        let x_dot = this.systemEquation(t, x, u, z);
        return vectAdd(x, vectScale(x_dot, Ts));
    };
    _rk4Int(Ts, t, x, u, z) {
        let k1 = this.systemEquation(t, x, u, z);
        let k2 = this.systemEquation(t + Ts / 2, vectAdd(x, vectScale(k1, Ts / 2)), u, z);
        let k3 = this.systemEquation(t + Ts / 2, vectAdd(x, vectScale(k2, Ts / 2)), u, z);
        let k4 = this.systemEquation(t + Ts, vectAdd(x, vectScale(k3, Ts)), u, z);
        var temp = vectAdd(k1, vectScale(k2, 2));
        temp = vectAdd(temp, vectScale(k3, 2));
        temp = vectAdd(temp, k4);
        return vectAdd(x, vectScale(temp, Ts / 6))
    }
    start() {
        if (this._isRunning) { return false; }
        this._timer = setInterval(this.update, this.simStep * 1000 * this.simMulti, this);
        this._isRunning = true;
    };
    stop() {
        clearInterval(this._timer);
        this._isRunning = false;
    };
    reset() {
        this.time = 0;
        this.nSim = 0;

        this.init();
    }
};

class FlexJointBase extends BaseSim {
    constructor() {
        super();
    }
    // overwrites
    init() {
        this.states = [0, 0, 0, 0];
        this.inputs = [0];
        this.disturbances = [0];
        this.reference = 0;
        // this.params = {Rm:1.4637,Km:0.0071,kg:70,Jeq:0.0063,Jl:0.0124,Beq:0.0619,Ks:2.2376}; //Vrilic presi
        this.params = { B_m: 0.069648931118612, c: 0.00321743290087495, J_m: 0.00362292517436335, J_r: 0.00397169530427267, k: 0.2015461160848, K_m: 0.558365859391204, MC: 3.44977338113348e-05, R_m: 2.60477484520831 }; //Dennis matlab

    };
    systemEquation(t, x, u, z) {
        // must return x_dot(t)
        let x_dot = [];
        let params = this.params;

        // define a value to force the base to 0 deg
        let epsilon = 0;

        // vrilic presi
        // let a=params.Ks/params.Jeq,
        // b=(params.Beq)/(params.Jeq),
        // c=(1)/(params.Jeq),
        // d=(params.Ks*(params.Jeq+params.Jl))/(params.Jeq*params.Jl);
        // x_dot = [
        //     x[2] - x[0]*epsilon,
        //     x[3],
        //     +x[1]*a - x[2]*b + u[0]*c,
        //     -x[1]*d + x[2]*b - u[0]*c + z[0]/params.Jeq
        // ];

        // Dennis matlab
        // J_m ... mass moment of inertia of the motor refered to the shaft in kg*m^2
        // J_r ... mass moment of inertia of the joint in kg*m^2
        // K_m ... motor constant referred to the shaft in Nm/A
        // R_m ... motor resistance in Ohm
        // B_m ... friction in Nm*s/rad
        // k ... stiffness of the springs in Nm/rad
        // c ... damping coefficient of the connection in Nms/rad
        // MC ... Coulomb friction Nm
        let B_m = params.B_m,
            c = params.c,
            J_m = params.J_m,
            J_r = params.J_r,
            k = params.k,
            K_m = params.K_m,
            MC = params.MC,
            R_m = params.R_m;
        // nonlinear
        x_dot = [
            x[3 - 1] - x[0]*epsilon,
            x[4 - 1],
            1 / J_m * (k * x[2 - 1] - (B_m + K_m ^ 2 / R_m) * x[3 - 1] - MC * Math.tanh(1000 * x[3 - 1]) + c * x[4 - 1] + K_m / R_m * u[1 - 1] + z[0]),
            -(k / J_r + k / J_m) * x[2 - 1] + (B_m + K_m ^ 2 / R_m) / J_m * x[3 - 1] + MC * Math.tanh(10 * x[3 - 1]) / J_m - (c / J_r + c / J_m) * x[4 - 1] - K_m / R_m / J_m * u[1 - 1]
        ];
        // TODO: find out why the model drifts!

        return x_dot;
    };
    outputEquation(t, x, u, z) {
        // must return y(t)
        return [x[0], x[0]+x[1]];
    };
}