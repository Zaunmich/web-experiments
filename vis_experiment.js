// a collection of classes to have a re-usable visualization environment

// requires the existance of the d3 libary!
if (typeof d3 === "undefined") {
    throw "You must load the d3 libary for the visualization to work! You can get it here: https://d3js.org/"
}

class BaseVis {
    constructor(groot) {
        // groot = graphical root, e.g. a div container
        this.groot = groot;

        this.container = {};
        // define the size of the container
        this.container.width = 800; // in px
        this.container.height = 500; // in px

        // define the margins around the svg 
        this.container.margin = { top: 10, right: 30, bottom: 30, left: 10 }; // in px

    }
    // getters/setters
    get svgWidth() { return this.container.width - this.container.margin.left - this.container.margin.right }
    get svgHeight() { return this.container.height - this.container.margin.top - this.container.margin.top }
}