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
            // TODO: have a working slow-motion mode
            // choose integration method. Available choices: _fwdEulerInt, _rk4Int
            this.integrationMethod = this._rk4Int;

            // internal parameters
            this._isRunning = false;
            this._simMulti = 1; // multiplicator for the sampling time of the simulation
            this._plotStep = 1 / 60; // plotting timestep in seconds

            this.init();
        }
        // getters/setters
    get isRunning() { return this._isRunning; };
    get Ts() { return this.simStep * this._simMulti };
    set Ts(target) { throw 'Set simRate instead of Ts!' };
    get t() { return this.time };
    get x() { return this.states };
    get z() { return this.disturbances };
    get w() { return this.reference };
    get y() { return this.outputEquation(this.t, this.x, this.u, this.z) };
    get u() { return this.controlLaw(this.t, this.x, this.w, this.z) };
    get plotUpdate() { this.plotFun(this.t, this.x, this.u, this.z, this.y, this.w) };
    set plotRate(rate) { this._plotStep = Math.round(this.simRate / rate) / this.simRate }; // set target plot-refresh rate in Hz
    get plotRate() { return 1 / (this._plotStep) }; // get the current plot-refresh rate in Hz
    get plotMulti() { return Math.round(this.simRate / this.plotRate) };
    get simRate() { return 1 / this.simStep };
    set simRate(rate) { this.simStep = 1 / rate };
    set simMulti(value) {
            this._simMulti = value;
            if (this._isRunning) {
                this.stop();
                this.start();
            }
        }
        // methods
    init() {
        this.states = [0, 0];
        this.inputs = [0];
        this.disturbances = [0];
        this.reference = [0];
        this.params = { K: 1, D: .1 };
        this.simMulti = 1; // multiplicator for real-time / slow-mo / speed-up
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
    plotFun(t, x, u, z, y, w) {
        // overwrite me
        console.log(x);
    }
    update(self) {
        let Ts = self.Ts;

        // compute the control law
        let u = self.u;


        // update the states
        let x_new = self.integrationMethod(Ts, self.t, self.x, self.u, self.z);


        // is it time to call the plotting function?
        if (self.nSim % self.plotMulti == 0) {
            let y = self.y;
            self.plotUpdate;
        };


        // store the new values
        self.states = x_new;
        self.time += Ts;
        self.nSim += 1;

        // call output function
        return self.y;

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
        this._timer = setInterval(this.update, 1 / this.simRate * 1000, this);
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
    };
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
        this.reference = [0];

        // set base simulation frequency
        this.simRate = 120; // Hz
        // aim for 60Hz plotting rate
        this.plotRate = 60; //Hz

        //Dennis matlab
        this.params = {
            B_m: 0.069648931118612,
            J_m: 0.003622925174363,
            J_r: 0.003971695304273,
            K_m: 0.558365859391204,
            MC: 3.449773381133479e-05,
            R_m: 2.604774845208310,
            c: 0.003217432900875,
            k: 0.201546116084800,
        };
    };
    systemEquation(t, x, u, z) {
        // must return x_dot(t)
        let x_dot = [];
        let params = this.params;

        // define a value to force the base to 0 deg
        let epsilon = 0;

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
            x[3 - 1] - x[0] * epsilon,
            x[4 - 1],
            1 / J_m * (k * x[2 - 1] - (B_m + K_m ** 2 / R_m) * x[3 - 1] - MC * Math.tanh(1000 * x[3 - 1]) + c * x[4 - 1] + K_m / R_m * u[1 - 1] + z[0]), -(k / J_r + k / J_m) * x[2 - 1] + (B_m + K_m ** 2 / R_m) / J_m * x[3 - 1] + MC * Math.tanh(1000 * x[3 - 1]) / J_m - (c / J_r + c / J_m) * x[4 - 1] - K_m / R_m / J_m * u[1 - 1]
        ];

        return x_dot;
    };
    outputEquation(t, x, u, z) {
        // output are head angle (measured from global zero) and arm angle (measured from global zero) in radiants
        return [x[0], x[0] + x[1]];
    };
}

class FlexJointPID extends FlexJointBase {
    constructor() {
        super();
        // just define them so that they exist
        this.Kp = 0;
        this.Ki = 0;
        this.Kd = 0;

        this.referencePeriod = 10 // in seconds 
        this.referenceMagnitude = Math.PI / 4 // in radiants
    };
    // overwrites
    init() {
        super.init();
        this.int_error = 0;
        this.old_error = 0;
    }
    controlLaw(t, x, w, z) {
        // must return u(t)
        let Ts = this.Ts;
        let e = w[0] - (x[0] + x[1]);

        this.int_error += e * Ts;
        let diff_error = (this.old_error - e) / Ts;
        this.old_error = e;

        return [this.Kp * e + this.Ki * this.int_error + this.Kd * diff_error];
    };
    get w() { return this.referenceLaw(this.t) };
    // methods
    referenceLaw(t) {
        return [(t % this.referencePeriod < this.referencePeriod / 2) * this.referenceMagnitude];
    }
}