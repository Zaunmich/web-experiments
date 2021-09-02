// a collection of classes to have a re-usable visualization environment

// requires the existance of the d3 libary!
if (typeof d3 === "undefined") {
    throw "You must load the d3 libary for the visualization to work! You can get it here: https://d3js.org/"
}

/*
/////////////////// utility functions ///////////////////
*/
function deg2rad(deg) { return deg / 360 * Math.PI * 2 };

function rad2deg(rad) { return rad / Math.PI / 2 * 360 };

// last of an array
function arLast(array) { if (array.length > 0) { return array[array.length - 1]; } else { return array } };



// a creator for d3 subplots
// Useage:     
// <div class="groot" id="groot"></div>   
// let figure = d3subploter.createFigure('groot', 400, 300);
// let subPlotter = new d3subploter(figure);
// subPlotter.xDomain = [0, 37.5];
// subPlotter.yDomain = [0, 50];
// subPlotter.margin = { top: 10, right: 10, bottom: 10, left: 10 };
// let sub1 = subPlotter.create();
// subPlotter.xDomain = [37.5, 100];
// subPlotter.yDomain = [0, 50];
// subPlotter.margin = { top: 10, right: 30, bottom: 30, left: 10 };
// subPlotter.alignment = { h: "l", v: "t" };
// let sub2 = subPlotter.create();

class d3subploter {
    constructor(parent) {
            this.parent = parent;
            this.margin = { top: 10, right: 30, bottom: 30, left: 10 }; // in pixels
            this.alignment = { h: "c", v: "c" }; // available options h: l/c/r, v: t/c/b
            this._xDomain = [25, 75]; // in percent of parent
            this._yDomain = [25, 75]; // in percent of parent
        }
        // getters / setters
    get xDomain() { return this._xDomain; }
    set xDomain(val) { this._xDomain = val; } // TODO: add check for val & redraw
    get yDomain() { return this._yDomain; }
    set yDomain(val) { this._yDomain = val; } // TODO: add check for val & redraw
    get xRange() { return this.xDomain.map(this.parent.xScale) }
    get yRange() { return this.yDomain.map(this.parent.yScale) }
    get xScale() {
        return d3.scaleLinear().domain([0, 100])
            .range([this.margin.left, this.margin.left + this.width]);
    }
    get yScale() {
        return d3.scaleLinear().domain([0, 100])
            .range([this.margin.top, this.margin.top + this.height]);
    }
    get width() { return (this.xRange[1] - this.xRange[0]) - this.margin.left - this.margin.right; }
    get height() { return (this.yRange[1] - this.yRange[0]) - this.margin.top - this.margin.bottom; }
    computeOrigin() {
        // horizontal
        let choice = this.alignment.h;
        var xc;
        if (typeof choice == "string") {
            switch (choice) {
                case "c":
                    xc = this.width / 2;
                    break;
                case "l":
                    xc = 0;
                    break;
                case "r":
                    xc = this.width;
                    break;
                default:
                    throw `The horizontal alignment ${choice} is invalid! Valid options: l/c/r or a number.`
            }; // end switch
        } else if (typeof choice == "number") {
            xc = choice;
        } else {
            throw `The horizontal alignment has an invalid type: ${typeof choice} !`
        }
        // add left margin
        xc += this.margin.left;

        // vertical
        choice = this.alignment.v;
        var yc;
        if (typeof choice == "string") {
            switch (choice) {
                case "c":
                    yc = this.height / 2;
                    break;
                case "t":
                    yc = 0;
                    break;
                case "b":
                    yc = this.height;
                    break;
                default:
                    throw `The vertical alignment ${choice} is invalid! Valid options: t/c/b or a number.`
            }; // end switch
        } else if (typeof choice == "number") {
            yc = choice;
        } else {
            throw `The vertical alignment has an invalid type: ${typeof choice} !`
        }
        // add top margin
        yc += this.margin.top;

        return [xc, yc];
    }
    create() {
        // outer group without any margin
        let xout = this.xRange,
            yout = this.yRange;
        let outg = this.parent.d3.append("g")
            .attr("transform", `translate(${xout[0]},${yout[0]})`)
            .classed("outerSubplot", true);
        this.d3 = outg;

        // debugging 
        outg.append("rect").attr("x", 0).attr("y", 0)
            .attr("width", xout[1] - xout[0])
            .attr("height", yout[1] - yout[0])
            .style("fill", "rgba(0,0,0,0)")
            .style("stroke", "red")
            .classed("debugging", true);
        // outg.append("circle").attr("cx", 0).attr("cy", 0)
        //     .attr("r", 10).classed("debugging", true);
        outg.append("rect").attr("x", this.margin.left).attr("y", this.margin.top)
            .attr("width", this.width)
            .attr("height", this.height)
            .style("fill", "rgba(0,0,0,0)")
            .style("stroke", "green")
            .classed("debugging", true);;

        // inner group with margin and correct origin
        let cin = this.computeOrigin();

        let ing = outg.append("g")
            .attr("transform", `translate(${cin[0]},${cin[1]})`)
            .classed("subplot", true);

        // debugging
        // ing.append("circle").attr("cx", 0).attr("cy", 0)
        //     .attr("r", 10).classed("debugging", true);

        let output = {
            d3: this.d3,
            alligned: ing,
            xScale: this.xScale,
            yScale: this.yScale,
            width: this.width,
            height: this.height,
            parent: this.parent,
            margin: this.margin,
        };
        this.parent.children.push(output);
        return output;
    }
    static createFigure(groot, width, height) {
        // groot = graphical root, e.g. the id of a div container
        let svg = d3.select(`#${groot}`)
            .append("svg")
            .attr("viewBox", `0 0 ${width} ${height}`);
        let xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
        let yScale = d3.scaleLinear().domain([0, 100]).range([0, height]);
        let margin = { top: 0, right: 0, bottom: 0, left: 0 };

        return { d3: svg, xScale: xScale, yScale: yScale, width: width, height: height, children: [], margin: margin, };
    }
};

class BaseGraph {
    constructor(subplot, graphSettings) {
        // subplot: output of d3subploter.create()
        this.subplot = subplot;
        // graph: object with setup options {tmax: 20, initYZoom: 1, xLabel: 'label', yLabel: 'label'}
        this.settings = graphSettings;

        this.init();
    };
    // setup helper
    static defaultSettings() {
        return {
            xMin: 0,
            xMax: 20,
            yMin: 0,
            yMax: 1,
            xLabel: 'xlabel',
            yLabel: 'ylabel',
            title: 'title',
            legend: { entries: [{ name: 'a', class: 'aLine' }, { name: 'b', class: 'bLine' }, ], spacing: 25, padding: 5, margin: { top: 0, left: 0 } },
        }
    };
    // getters/setters
    get origin() { return this.subplot.d3; };
    get xScale() {
        if (!this._xScale) { this._xScale = this.subplot.xScale.copy(); }
        return this._xScale.domain([this.settings.xMin, this.settings.xMax]);
    };
    get yScale() {
        if (!this._yScale) { this._yScale = this.subplot.yScale.copy(); }
        return this._yScale.domain([this.settings.yMax, this.settings.yMin]).nice();
    };
    get linesArea() { return this.linesGroup.select(".linesArea"); }
    init() {

        this.xAxisGroup = this.drawXaxis();
        this.yAxisGroup = this.drawYaxis();
        this.linesGroup = this.drawLines();
        this.title = this.drawTitle();
        this.legend = this.drawLegend();
    };
    updateAll(...args) {
        this.updateXaxis(args);
        this.updateYaxis(args);
        this.updateLines(args);
        this.updateLegend(args);
    };
    drawXaxis() {
        let subplot = this.subplot,
            origin = this.origin,
            settings = this.settings;
        // Encapsulate X axis in group
        let xAxisGroup = origin.append("g").attr("transform", `translate(0,${subplot.height + subplot.margin.top})`);
        // gridlines
        xAxisGroup.append("g").classed("gridLines", true);
        // axis
        xAxisGroup.append("g").classed("axis", true);
        // label
        xAxisGroup.append("text").classed("axisLabel", true)
            .attr("text-anchor", "end")
            .attr("x", subplot.width + subplot.margin.left - 1)
            .attr("y", subplot.margin.bottom - 1)
            .text(settings.xLabel);

        return xAxisGroup;
    };
    updateXaxis() {
        let subplot = this.subplot,
            xScale = this.xScale,
            xAxisGroup = this.xAxisGroup,
            settings = this.settings;
        xAxisGroup.select(".gridLines").call(d3.axisBottom(xScale).tickSize(-subplot.height).tickFormat(""));
        xAxisGroup.select(".axis").call(d3.axisBottom(xScale));
        xAxisGroup.select(".axisLabel").text(settings.xLabel);

        return xAxisGroup;
    };
    drawYaxis() {
        let subplot = this.subplot,
            origin = this.origin,
            settings = this.settings;
        // Encapsulate Y axis in group
        let yAxisGroup = origin.append("g").attr("transform", `translate(${subplot.margin.left},0)`);
        // gridlines
        yAxisGroup.append("g").classed("gridLines", true);
        // axis
        yAxisGroup.append("g").classed("axis", true);
        // label
        yAxisGroup.append("text").classed("axisLabel", true)
            .attr("text-anchor", "end").attr("dominant-baseline", "hanging")
            .attr("transform", "rotate(-90)")
            .attr("x", -subplot.margin.top - 1)
            .attr("y", -subplot.margin.left + 1)
            .text(settings.yLabel);

        return yAxisGroup;
    };
    updateYaxis() {
        // Y-coordinate system is up to down, but axis should go down to up
        let subplot = this.subplot,
            yScale = this.yScale,
            yAxisGroup = this.yAxisGroup,
            settings = this.settings;
        yAxisGroup.select(".gridLines").call(d3.axisLeft(yScale).tickSize(-subplot.width).tickFormat(""));
        yAxisGroup.select(".axis").call(d3.axisLeft(yScale));
        yAxisGroup.select(".axisLabel").text(settings.yLabel);
    };
    drawLines() {
        let subplot = this.subplot,
            origin = this.origin;
        let linesGroup = origin.append("g");
        linesGroup.append("g").classed("linesArea", true);
        return linesGroup;
    };
    updateLines() {
        throw 'Overwrite me!'
    };
    drawTitle() {
        let subplot = this.subplot,
            origin = this.origin,
            settings = this.settings;

        return origin.append("text").classed("titleLabel", true)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "hanging")
            .attr("x", subplot.width / 2 + subplot.margin.left)
            .attr("y", 1)
            .text(settings.title);
    };
    drawLegend() {
        let subplot = this.subplot,
            origin = this.origin,
            settings = this.settings;

        let legend = settings.legend;

        let legendGroup = origin.append("g").classed('legend', true);

        return legendGroup;

    };
    updateLegend() {
        let subplot = this.subplot,
            origin = this.origin,
            settings = this.settings,
            legendGroup = this.legend;

        let legend = settings.legend;
        let entries = legend.entries;

        if (entries.length == 0) {
            return
        };
        // remove all contents
        legendGroup.selectChildren().remove();

        // first lets create the entries
        legendGroup.selectAll('.legendEntries')
            .data(entries)
            .enter()
            .append('g')
            .attr("transform", (d, i) => { return `translate(0,${legend.spacing*(i+1)})` })
            .classed('legendEntries', true)
            .each(mkLegendEntry);

        // helper function
        function mkLegendEntry(d, i) {
            let grp = d3.select(this)
            grp.append("line")
                .attr("class", d.class)
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", 20)
                .attr("y2", 0);
            grp.append("text").classed('legendText', true)
                .attr("text-anchor", "left")
                .attr("dominant-baseline", "middle")
                .attr("x", 25)
                .attr("y", 0)
                .text(d.name);
        };

        // get the size of the legend entries
        let bbox = legendGroup.node().getBBox();

        // draw a box around them with padding
        legendGroup.insert('rect', ':first-child')
            .attr("x", bbox.x - legend.padding)
            .attr("y", bbox.y - legend.padding)
            .attr("height", bbox.height + legend.padding * 2)
            .attr("width", bbox.width + legend.padding * 2)
            .style("fill", "white")
            .style("stroke", "black");

        // finally move the legend in position
        let newX = legend.margin.left;
        let newY = legend.margin.top;
        legendGroup.attr("transform", `translate(${newX},${newY})`);
    }
}

class DataTipGraph extends BaseGraph {
    constructor(subplot, graphSettings) {
        super(subplot, graphSettings);
    };
    // getters/setters
    get dataTipArea() { return this.linesGroup.select(".dataTip"); };
    // overwrites
    init() {
        super.init();

        this.callbackDataTip(this.dataTipArea)
    }
    drawLines() {
        let subplot = this.subplot;
        let linesGroup = super.drawLines();

        let g = linesGroup.append("g").classed("dataTip", true);
        g.append("rect").attr("x", subplot.margin.left).attr("y", subplot.margin.top)
            .attr("width", subplot.width).attr("height", subplot.height)
            .style("fill-opacity", 0).style("stroke-opacity", 0);
        return linesGroup;
    };
    // methods
    callbackDataTip(area) {
        const tooltip = area.append("g");
        const self = this;
        area.on("mousemove", (event) => this.moveCallback(event, tooltip));
        area.on("mouseleave", () => tooltip.call(this.drawCallout, null));
    }
    moveCallback(event, tooltip) {
        throw "Overwrite me"
    }
    drawCallout(g, value) {
        if (!value) return g.style("display", "none");

        g.style("display", null)
            .style("pointer-events", "none")
            .style("font", "10px sans-serif");

        const path = g.selectAll("path")
            .data([null])
            .join("path")
            .attr("fill", "white")
            .attr("stroke", "black");

        const text = g.selectAll("text")
            .data([null])
            .join("text")
            .call(text => text
                .selectAll("tspan")
                .data((value + "").split(/\n/))
                .join("tspan")
                .attr("x", 0)
                .attr("y", (d, i) => `${i * 1.1}em`)
                .style("font-weight", (_, i) => i ? null : "bold")
                .text(d => d));

        const { x, y, width: w, height: h } = text.node().getBBox();

        text.attr("transform", `translate(${-w / 2},${15 - y})`);
        path.attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
    }
}

/*
/////////////////// visualization classes ///////////////////
*/

class BaseVis {
    constructor(figure) {
            // figure is the output of d3subplotter.createFigure()
            this.figure = figure;

            // inital data
            this.data = [];

            // settings
            this.plotTime = 20; // in seconds; Timeframe in which the plotting data will be saved
            this.dragExperimentEnabled = true; // enable/disable the mouse-drag on the experiment

            this.drawAll();
        }
        // getters/setters
        // Methods
    drawAll() {
        // create 3 subplots
        var subs = this.makeSubplots();
        this.subplots = subs;
        // draw the experiment in the 1st subplot
        this.experiment = this.drawExperiment(subs[0]);
        // draw the output graph in the 2nd subplot
        this.outGraph = this.drawOutput(subs[1]);
        // draw the input graph in the 3rd subplot
        this.inputGraph = this.drawInput(subs[2]);
    };
    update() {
        let data = this.data;
        // update the experiment visulaization
        this.experiment.update(data);
        // update the outGraph visulaization
        this.outGraph.update(data);
        // update the inputGraph visulaization
        this.inputGraph.update(data);
    };
    reset() {
        this.data = [];
        this.update();
    }
    makeSubplots() {
        // create 3 subplots in the figure
        let subPlotter = new d3subploter(this.figure);
        subPlotter.xDomain = [0, 37.5]; // start-end percentages of the figure
        subPlotter.yDomain = [0, 100];
        subPlotter.margin = { top: 10, right: 10, bottom: 10, left: 10 }; // in pixels
        let sub1 = subPlotter.create();
        subPlotter.xDomain = [37.5, 100];
        subPlotter.yDomain = [0, 50];
        subPlotter.margin = { top: 25, right: 10, bottom: 35, left: 50 };
        subPlotter.alignment = { h: "l", v: "t" };
        let sub2 = subPlotter.create();
        subPlotter.yDomain = [50, 100];
        subPlotter.alignment = { h: "l", v: "t" };
        let sub3 = subPlotter.create();

        return [sub1, sub2, sub3];
    };
    drawExperiment(subplot) {
        // must return an object with { canvas: origin, update: updateFun }
        var self = this;
        var origin = subplot.alligned;

        const minDim = Math.min(subplot.width, subplot.height);

        var flexJoint = {};
        flexJoint['base'] = { width: minDim * .25, height: minDim * .25, }; // size of the base-plate
        flexJoint['head'] = { width: minDim * .175, height: minDim * .125, length: minDim * .2 }; // size of the head-plate
        flexJoint['arm'] = { width: minDim / 2.2, height: minDim * .030, length: minDim / 2.2 }; // size of the arm
        flexJoint['ref'] = { length: minDim / 2.1 }; // size of the reference
        flexJoint['zero'] = { length: minDim / 2 }; // size of the zero line

        // title
        subplot.d3.append("text").classed("titleLabel", true)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "hanging")
            .attr("x", subplot.width / 2 + subplot.margin.left)
            .attr("y", 1)
            .text("Experiment");

        // // zero line
        // origin.append("line")
        //     .attr("x1", 0)
        //     .attr("y1", 0)
        //     .attr("x2", flexJoint.zero.length)
        //     .attr("y2", 0)
        //     .classed("zeroLine", true);

        // base plate
        origin.append("g").attr("id", "base")
            .append("rect")
            .attr("x", -flexJoint.base.width / 2)
            .attr("y", -flexJoint.base.height / 2)
            .attr("width", flexJoint.base.width)
            .attr("height", flexJoint.base.height)
            .classed("baseRect", true);

        // head plate
        let hg = origin.append("g").attr("id", "head").attr("transform", `rotate(${-0})`);
        hg.append("rect")
            .attr("x", -flexJoint.head.width / 2)
            .attr("y", -flexJoint.head.height / 2)
            .attr("width", flexJoint.head.width)
            .attr("height", flexJoint.head.height)
            .classed("headRect", true);

        // arm
        var ag = origin.append("g").attr("id", "arm").attr("transform", `rotate(${-0})`);
        ag.append("rect")
            .attr("x", 0)
            .attr("y", -flexJoint.arm.height / 2)
            .attr("width", flexJoint.arm.width)
            .attr("height", flexJoint.arm.height)
            .classed("armRect", true);

        // springs
        origin.append("line")
            .attr("x1", 0).attr("y1", -flexJoint.head.height / 2)
            .attr("x2", flexJoint.arm.width / 4).attr("y2", 0)
            .classed("springLine", true);
        origin.append("line")
            .attr("x1", 0).attr("y1", +flexJoint.head.height / 2)
            .attr("x2", flexJoint.arm.width / 4).attr("y2", 0)
            .classed("springLine", true);


        // angle lines
        origin.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", flexJoint.ref.length)
            .attr("y2", 0)
            .attr("transform", `rotate(${-0})`)
            .attr("pointer-events", "none")
            .classed("refLine", true).attr("id", "ref");
        origin.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", flexJoint.arm.length)
            .attr("y2", 0)
            .attr("transform", `rotate(${-0})`)
            .attr("pointer-events", "none")
            .classed("armLine", true).attr("id", "arm");
        origin.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", flexJoint.head.length)
            .attr("y2", 0)
            .attr("transform", `rotate(${-0})`)
            .attr("pointer-events", "none")
            .classed("headLine", true).attr("id", "head");

        // update function
        function updateExperiment(data) {
            let nowData = arLast(data);
            let headAngle = nowData.headAngle,
                armAngle = nowData.armAngle,
                refAngle = nowData.refAngle;
            if (isNaN(headAngle)) { headAngle = 0 };
            if (isNaN(armAngle)) { armAngle = 0 };
            if (isNaN(refAngle)) {
                refAngle = 0;
                origin.selectAll('#ref').attr('display', 'none');
            } else {
                origin.selectAll('#ref').attr('display', 'block');
            };
            // rotate the head
            origin.selectAll('#head').attr("transform", `rotate(${-headAngle})`);
            // rotate the arm
            origin.selectAll('#arm').attr("transform", `rotate(${-armAngle})`);
            // rotate the ref
            origin.selectAll('#ref').attr("transform", `rotate(${-refAngle})`);
            // the order of the springs is important! We use the index to decide if it is the upper/lower spring
            origin.selectAll('.springLine')
                .attr("x1", (d, i) => { return (i * 2 - 1) * flexJoint.head.height / 2 * Math.sin(deg2rad(headAngle)) })
                .attr("y1", (d, i) => { return (i * 2 - 1) * flexJoint.head.height / 2 * Math.cos(deg2rad(headAngle)) })
                .attr("x2", flexJoint.arm.width / 4 * Math.cos(deg2rad(armAngle)))
                .attr("y2", -flexJoint.arm.width / 4 * Math.sin(deg2rad(armAngle)));


            if (!self.dragExperimentEnabled) {
                // TODO: re-enable the dragging function once it has been disabled
                origin.select('.armRect').on('mousedown.drag', null);
            }

            let calcDisturbances = function(self, armAngle) {
                if (isNaN(self.dragArmPos) || isNaN(self.dragAngle)) {
                    return [0];
                }

                // console.log(`${(Math.cos(self.dragAngle - deg2rad(90 + armAngle))).toFixed(3)}°, ${self.dragDist}`);
                const scalingFactor = 10;
                return [Math.cos(self.dragAngle - deg2rad(90 + armAngle)) * self.dragDist * self.dragArmPos * scalingFactor];
            };
            self.disturbances = calcDisturbances(self, armAngle);
        };

        // drag ?
        origin.select('.armRect').call(d3.drag()
            .on("start", (e) => {
                self.dragArmPos = d3.pointer(e)[0] / flexJoint.arm.width;
                let cursor = d3.pointer(e, origin.node());
                self.dragAngle = (Math.atan2(-cursor[1], cursor[0]));
                self.dragDist = Math.sqrt(cursor[0] ** 2 + cursor[1] ** 2) / flexJoint.arm.width;
                ag.append('circle').attr("cx", d3.pointer(e, ag.node())[0]).attr("cy", 0).attr("r", 8).attr('id', 'dragArmCirc').attr('fill', 'none').attr('stroke', 'blue');
                origin.append('circle').attr("cx", d3.pointer(e, origin.node())[0]).attr("cy", d3.pointer(e, origin.node())[1]).attr("r", 10).attr('id', 'dragMouseCirc').attr('fill', 'none').attr('stroke', 'red');
                // console.log(`start drag: ${self.dragArmPos}`);
            })
            .on("drag", (e) => {
                let cursor = d3.pointer(e, origin.node());
                self.dragAngle = (Math.atan2(-cursor[1], cursor[0]));
                self.dragDist = Math.sqrt(cursor[0] ** 2 + cursor[1] ** 2) / flexJoint.arm.width;
                origin.select('#dragMouseCirc').attr("cx", cursor[0]).attr("cy", cursor[1]);
                // console.log(`dragging: ${self.dragAngle}°, ${self.dragDist}`);
            })
            .on("end", (e) => {
                delete self.dragArmPos;
                delete self.dragAngle;
                delete self.dragDist;
                ag.select('#dragArmCirc').remove();
                origin.select('#dragMouseCirc').remove();
                // console.log('drag end')
            }));

        let experiment = { canvas: origin, model: flexJoint, update: updateExperiment };
        return experiment;
    };
    drawOutput(subplot) {
        var self = this;
        var origin = subplot.d3;
        origin.classed("outGraph", true);

        const settings = BaseGraph.defaultSettings();
        settings.xMax = this.plotTime;
        settings.yMin = -1;
        settings.xLabel = "Time in s";
        settings.yLabel = "Angle in deg";
        settings.title = "System response";
        settings.legend.entries = [{ name: 'Arm', class: 'armLine' }, { name: 'Head', class: 'headLine' }, { name: 'Ref.', class: 'refLine' }];
        settings.legend.margin = { left: -75, top: 20 };

        // create the scales, axes, makeFunctions, and updateFunctions
        const graphPlot = new DataTipGraph(subplot, settings);

        // overwrite the plotting function
        graphPlot.updateLines = function(args) {

            let data = args[0];
            // plot head angle
            pltLine('headAngle', 'headLine');
            // plot arm angle
            pltLine('armAngle', 'armLine');
            // plot ref angle
            pltLine('refAngle', 'refLine');

            // plot and append lines
            function pltLine(key, className) {
                let y = graphPlot.linesArea.selectAll(`.${className}`).data([data]);
                y.enter().append("path").merge(y).attr("d", mkLine(key))
                    .classed(`${className}`, true);
                // make a d3 line object
                function mkLine(key) {
                    return d3.line().defined((d) => !isNaN(d[key]))
                        .x((d, i, all) => graphPlot.xScale(d.t))
                        .y((d) => graphPlot.yScale(d[key]));
                };
            }
        };

        // overwrite the mousemove function
        graphPlot.moveCallback = function(event, tooltip) {
            let xCursor = graphPlot.xScale.invert(d3.pointer(event)[0]);
            let yCursor = graphPlot.yScale.invert(d3.pointer(event)[1]);
            let tnow = arLast(self.data).t;
            let bisect = d3.bisector((d) => d.t).left;
            let idxCursor = bisect(self.data, tnow - xCursor, 1);
            let dataCursor = self.data[idxCursor];

            let tooltipText
            try {
                tooltipText = `Time: ${(tnow - dataCursor.t).toFixed(2)}` +
                    `\nArm: ${(dataCursor.armAngle).toFixed(2)}°`;
                if (!isNaN(dataCursor.headAngle)) { tooltipText += `\nHead: ${(dataCursor.headAngle).toFixed(2)}°` };
                if (!isNaN(dataCursor.refAngle)) { tooltipText += `\nReference: ${(dataCursor.refAngle).toFixed(2)}°` };
            } catch (e) {

            }
            tooltip.attr("transform", `translate(${graphPlot.xScale(xCursor)},${graphPlot.yScale(yCursor)})`)
                .call(graphPlot.drawCallout, tooltipText);
        }

        // create a update function
        function updateAll(data) {
            // TODO: make sure that the data property is not growing indefinetly...
            // compute visible data
            let visibleData = d3.filter(data, (d, i, a) => d.t >= arLast(a).t - self.plotTime);
            // compute min/max values of all lines
            let yMin = d3.min(visibleData, (d) => d3.min([d.headAngle, d.armAngle, d.refAngle]));
            let yMax = d3.max(visibleData, (d) => d3.max([d.headAngle, d.armAngle, d.refAngle]));
            if (isNaN(yMin)) { yMin = 0 };
            if (isNaN(yMax)) { yMax = 0 };
            let xMax = d3.max(visibleData, (d) => d.t);
            let xMin = d3.max([0, xMax - self.plotTime]);
            if (isNaN(xMin)) { xMin = 0 };
            if (isNaN(xMax)) { xMax = 0 };

            graphPlot.settings.yMin = yMin;
            graphPlot.settings.yMax = yMax;
            graphPlot.settings.xMin = xMin;
            graphPlot.settings.xMax = xMax;
            graphPlot.updateAll(visibleData);
        };

        // update once to draw axes/grid/...
        updateAll([]);

        let graphOut = { canvas: origin, settings: settings, update: updateAll, graph: graphPlot };
        return graphOut;
    };
    drawInput(subplot) {
        var self = this;
        var origin = subplot.d3;
        origin.classed("inputGraph", true);

        const settings = BaseGraph.defaultSettings();
        settings.xMax = this.plotTime;
        settings.yMin = -1;
        settings.xLabel = "Time in s";
        settings.yLabel = "Input in V";
        settings.title = "System input";
        settings.legend.entries = [];


        // create the scales, axes, makeFunctions, and updateFunctions
        const graphPlot = new DataTipGraph(subplot, settings);

        // overwrite the plotting function
        graphPlot.updateLines = function(args) {

            let data = args[0];
            // plot input voltage
            pltLine('u', 'inputLine');

            // plot and append lines
            function pltLine(key, className) {
                let y = graphPlot.linesArea.selectAll(`.${className}`).data([data]);
                y.enter().append("path").merge(y).attr("d", mkLine(key))
                    .classed(`${className}`, true);
                // make a d3 line object
                function mkLine(key) {
                    return d3.line().defined((d) => !isNaN(d[key]))
                        .x((d, i, all) => graphPlot.xScale(d.t))
                        .y((d) => graphPlot.yScale(d[key]));
                };
            }
        };
        // overwrite the mousemove function
        graphPlot.moveCallback = function(event, tooltip) {
            let xCursor = graphPlot.xScale.invert(d3.pointer(event)[0]);
            let yCursor = graphPlot.yScale.invert(d3.pointer(event)[1]);
            let tnow = arLast(self.data).t;
            let bisect = d3.bisector((d) => d.t).left;
            let idxCursor = bisect(self.data, tnow - xCursor, 1);
            let dataCursor = self.data[idxCursor];

            let tooltipText
            try {
                tooltipText = `Time: ${(tnow - dataCursor.t).toFixed(2)}` +
                    `\nInput: ${(dataCursor.u).toFixed(2)}V`;
            } catch (e) {

            }
            tooltip.attr("transform", `translate(${graphPlot.xScale(xCursor)},${graphPlot.yScale(yCursor)})`)
                .call(graphPlot.drawCallout, tooltipText);
        }

        function updateAll(data) {
            // compute visible data
            let visibleData = d3.filter(data, (d, i, a) => d.t >= arLast(a).t - self.plotTime);
            // compute min/max values of all lines
            let yMin = d3.min(visibleData, (d) => d3.min([d.u]));
            let yMax = d3.max(visibleData, (d) => d3.max([d.u]));
            if (isNaN(yMin)) { yMin = 0 };
            if (isNaN(yMax)) { yMax = 0 };
            let xMax = d3.max(visibleData, (d) => d.t);
            let xMin = d3.max([0, xMax - self.plotTime]);
            if (isNaN(xMin)) { xMin = 0 };
            if (isNaN(xMax)) { xMax = 0 };

            graphPlot.settings.yMin = yMin;
            graphPlot.settings.yMax = yMax;
            graphPlot.settings.xMin = xMin;
            graphPlot.settings.xMax = xMax;
            graphPlot.updateAll(visibleData);
        };

        // update once to draw axes/grid/...
        updateAll([]);

        let graphOut = { canvas: origin, settings: settings, update: updateAll };
        return graphOut;
    }

};



function downloadCSV(csv, filename) {
    var csvFile;
    var downloadLink;

    // CSV File
    csvFile = new Blob([csv], { type: "text/csv" });

    // download link
    downloadLink = document.createElement("a");

    // file name
    downloadLink.download = filename;

    // create link to file
    downloadLink.href = window.URL.createObjectURL(csvFile);

    // hide download link
    downloadLink.style.display = "";

    // add link to DOM
    document.body.appendChild(downloadLink);

    // click download link
    downloadLink.click();
}

function exportData(data, filename) {
    if (data.length == 0) { return };
    var csv = [];

    csv.push(Object.keys(data[0]).join(';'));
    data.forEach((d) => csv.push(Object.values(d).join(';')));

    // download csv file
    downloadCSV(csv.join("\n"), filename);

}