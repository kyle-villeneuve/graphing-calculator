(() => {
  interface Graph {
    canvas: HTMLCanvasElement;
    form: HTMLElement;
    input: HTMLElement;

    c: CanvasRenderingContext2D;

    orientation: {
      zoom: number;
      x: number;
      y: number;
    };

    mouseStart: {
      x: number;
      y: number;
    };

    equation: string;
    data: any[];
    precision: number;
    zoomPercentage: number;
    sigFigs: number;
    gridSpacing: number;
  }

  class Graph implements Graph {
    constructor() {
      this.canvas = document.querySelector(".canvas");
      this.form = document.querySelector(".form");
      this.input = document.querySelector(".form__input");

      this.c = this.canvas.getContext("2d");

      this.orientation = {
        zoom: 1,
        x: this.canvas.width / 2,
        y: this.canvas.height / 2
      };

      this.mouseStart = {
        x: null,
        y: null
      };

      this.equation = "Math.sin(x / 30) * 100";

      this.data = [];

      this.precision = 1; // num of pixels traveled horizontally before calculating another coordinate
      this.zoomPercentage = 0.05; // what percent one scroll event will zoom
      this.sigFigs = 3; // significant figures of equation output
      this.gridSpacing = 0.01;

      this.addEventListeners();
      this.handleResize();
    }

    addEventListeners() {
      window.addEventListener("resize", this.handleResize);
      this.form.addEventListener("submit", this.handleSubmit);
      this.canvas.addEventListener("mousedown", this.handleMouseDown);
      this.canvas.addEventListener("mouseup", this.handleMouseUp);
      window.addEventListener("mousewheel", this.handleScroll);
    }

    handleSubmit = e => {
      e.preventDefault();

      this.equation = e.target.elements.function.value;

      this.plot();
    };

    handleResize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight - 80;

      this.orientation.x = window.innerWidth / 2;
      this.orientation.y = (window.innerHeight - 80) / 2;

      this.plot();
    };

    handleMouseDown = e => {
      const { offsetX: x, offsetY: y } = e;
      this.mouseStart = { x, y };
      this.canvas.addEventListener("mousemove", this.handleMouseMove);
    };

    handleMouseUp = e => {
      this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    };

    handleMouseMove = e => {
      const { x: startX, y: startY } = this.mouseStart;
      const { offsetX, offsetY } = e;

      this.orientation.x = this.orientation.x + (offsetX - startX);

      this.orientation.y = this.orientation.y + (offsetY - startY);

      this.mouseStart = {
        x: offsetX,
        y: offsetY
      };

      this.plot();
    };

    handleScroll = e => {
      const { wheelDeltaY, offsetX, offsetY } = e;

      let dX = (offsetX - this.canvas.width / 2) / this.canvas.width;
      let dY = (offsetY - this.canvas.height / 2) / this.canvas.height;

      const zoomPanFactor = 50;

      if (wheelDeltaY > 0) {
        this.orientation.zoom = +(
          this.orientation.zoom *
          (1 + this.zoomPercentage)
        ).toFixed(4);
        this.orientation.x = Math.round(
          this.orientation.x - dX * zoomPanFactor
        );
        this.orientation.y = Math.round(
          this.orientation.y - dY * zoomPanFactor
        );
      } else {
        this.orientation.zoom = +(
          this.orientation.zoom /
          (1 + this.zoomPercentage)
        ).toFixed(4);
        this.orientation.x = Math.round(
          this.orientation.x + dX * zoomPanFactor
        );
        this.orientation.y = Math.round(
          this.orientation.y + dY * zoomPanFactor
        );
      }

      this.plot();
    };

    calculate(x) {
      const equation = this.equation.replace(/x/gm, x);
      return eval(equation);
    }

    calculateSigFigs() {
      this.sigFigs = this.orientation.zoom.toFixed(0).length + 2;
    }

    setData() {
      const data = [];
      let x = 0;

      while (x < this.canvas.width + this.precision) {
        let _x = x;

        // horizontal pan
        _x -= this.orientation.x;

        // horizontal zoom
        _x /= this.orientation.zoom;

        let y = this.calculate(_x.toFixed(this.sigFigs));

        // flip y coordinate because canvas paints \ instead of  /
        y *= -1;

        // vertical zoom
        y *= this.orientation.zoom;

        // vertical pan
        y += this.orientation.y;

        data.push([x, y]);
        x += this.precision;
      }

      this.data = data;
    }

    plotData() {
      if (!this.data || !this.data.length) return;

      this.plotAxes();

      this.c.beginPath();
      this.c.moveTo(this.data[0][0], this.data[0][1]);
      this.c.strokeStyle = "rgba(0, 0, 139, 0.7)";

      let i = 1;
      while (this.data.length > i) {
        this.c.lineTo(this.data[i][0], this.data[i][1]);
        i++;
      }

      this.c.stroke();
    }

    plotAxes() {
      const { x, y } = this.orientation;

      this.c.strokeStyle = "#000";
      this.c.lineWidth = 2;

      // x right
      if (x <= this.canvas.width) {
        this.c.beginPath();
        this.c.moveTo(x, y);
        this.c.lineTo(this.canvas.width, y);
        this.c.stroke();
      }

      // x left
      if (x >= 0) {
        this.c.beginPath();
        this.c.moveTo(x, y);
        this.c.lineTo(0, y);
        this.c.stroke();
      }

      // y up
      if (y <= this.canvas.height) {
        this.c.beginPath();
        this.c.moveTo(x, y);
        this.c.lineTo(x, this.canvas.height);
        this.c.stroke();
      }

      // y down
      if (y >= 0) {
        this.c.beginPath();
        this.c.moveTo(x, y);
        this.c.lineTo(x, 0);
        this.c.stroke();
      }
    }

    plotGridSegment(axis, direction) {
      const { x, y } = this.orientation;
      const { gridSpacing } = this;

      let _x = x;
      let _y = y;
      let label = 0;
      let index = 0;

      while (_x < this.canvas.width) {
        this.c.strokeStyle =
          index % 5 === 0 ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.2)";

        // add grid line
        this.c.beginPath();
        this.c.moveTo(_x, 0);
        this.c.lineTo(_x, this.canvas.height);
        this.c.stroke();

        // add label
        if (label !== 0 && index % 5 === 0) {
          this.c.fillStyle = "lightblue";
          this.c.fillText("█", _x, y + 11);

          this.c.fillStyle = "black";
          this.c.fillText(label.toString(), _x, y + 11);
        }

        if (index % 5 === 0) {
          label += gridSpacing;
        }

        index++;
        _x += (gridSpacing / 5) * this.orientation.zoom;
      }
    }

    plotGridSegments() {
      const { x, y } = this.orientation;
      const { gridSpacing } = this;

      let _x = x;
      let _y = y;
      let label = 0;
      let index = 0;

      // x ->
      while (_x < this.canvas.width) {
        this.c.strokeStyle =
          index % 5 === 0 ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.2)";

        // add grid line
        this.c.beginPath();
        this.c.moveTo(_x, 0);
        this.c.lineTo(_x, this.canvas.height);
        this.c.stroke();

        // add label
        if (label !== 0 && index % 5 === 0) {
          this.c.fillStyle = "lightblue";
          this.c.fillText("█", _x, y + 11);

          this.c.fillStyle = "black";
          this.c.fillText(label.toString(), _x, y + 11);
        }

        if (index % 5 === 0) {
          label += gridSpacing;
        }

        index++;
        _x += (gridSpacing / 5) * this.orientation.zoom;
      }

      index = 0;
      _x = x;
      label = 0;
      // x <-
      while (_x > 0) {
        this.c.strokeStyle =
          index % 5 === 0 ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.2)";

        this.c.beginPath();
        this.c.moveTo(_x, 0);
        this.c.lineTo(_x, this.canvas.height);
        this.c.stroke();

        // add label
        if (label !== 0 && index % 5 === 0) {
          this.c.fillStyle = "lightblue";
          this.c.fillText("█", _x, y + 11);

          this.c.fillStyle = "black";
          this.c.fillText(label.toString(), _x, y + 11);

          console.log(label);
        }

        if (index % 5 === 0) {
          label += gridSpacing;
        }

        index++;
        _x -= (gridSpacing / 5) * this.orientation.zoom;
      }

      this.c.textAlign = "right";
      index = 0;
      _y = y;
      label = 0;
      // y ^
      while (_y < this.canvas.height) {
        this.c.strokeStyle =
          index % 5 === 0 ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.2)";

        this.c.beginPath();
        this.c.moveTo(0, _y);
        this.c.lineTo(this.canvas.width, _y);
        this.c.stroke();

        const bg = new Array(label.toString().length + 1)
          .map(() => "█")
          .join("");

        // add label
        if (label !== 0 && index % 5 === 0) {
          this.c.fillStyle = "lightblue";
          this.c.fillText(bg, x, _y + 5);

          this.c.fillStyle = "black";
          this.c.fillText(label.toString(), x - 3, _y + 4);
        }

        if (index % 5 === 0) {
          label += gridSpacing;
        }

        index++;
        _y += (gridSpacing / 5) * this.orientation.zoom;
      }

      index = 0;
      _y = y;
      label = 0;
      // y \/
      while (_y > 0) {
        this.c.strokeStyle =
          index % 5 === 0 ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.2)";

        this.c.beginPath();
        this.c.moveTo(0, _y);
        this.c.lineTo(this.canvas.width, _y);
        this.c.stroke();

        const bg = new Array(label.toString().length + 1)
          .map(() => "█")
          .join("");

        // add label
        if (label !== 0 && index % 5 === 0) {
          this.c.fillStyle = "lightblue";
          this.c.fillText(bg, x, _y + 5);

          this.c.fillStyle = "black";
          this.c.fillText(label.toString(), x - 3, _y + 4);
        }

        if (index % 5 === 0) {
          label += gridSpacing;
        }

        index++;
        _y -= (gridSpacing / 5) * this.orientation.zoom;
      }
    }

    plotGrid = () => {
      const { x, y, zoom } = this.orientation;

      const width = this.canvas.width / zoom;
      const height = this.canvas.height / zoom;

      this.c.lineWidth = 1;
      this.c.textAlign = "center";
      this.c.font = "bold 12px monospace";

      let gridSpacing = 0.05;

      const breakpoints = [
        0.1,
        0.25,
        0.5,
        1,
        2,
        5,
        10,
        25,
        50,
        100,
        250,
        500,
        1000,
        2500,
        10000,
        25000,
        50000
      ];

      let i = 0;
      while (
        breakpoints[i] &&
        (breakpoints[i] < width / 6 || breakpoints[i] < height / 6)
      ) {
        gridSpacing = breakpoints[i];
        i++;
      }

      this.gridSpacing = gridSpacing;

      this.plotGridSegments();
    };

    plot() {
      window.requestAnimationFrame(() => {
        this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.calculateSigFigs();
        this.setData();
        this.plotAxes();
        this.plotGrid();
        this.plotData();
      });
    }
  }

  const graph = new Graph();

  graph.plot();
})();
