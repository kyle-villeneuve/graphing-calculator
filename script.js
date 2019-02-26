(function () {
    var Graph = /** @class */ (function () {
        function Graph() {
            var _this = this;
            this.handleSubmit = function (e) {
                e.preventDefault();
                _this.equation = e.target.elements["function"].value;
                _this.plot();
            };
            this.handleResize = function () {
                _this.canvas.width = window.innerWidth;
                _this.canvas.height = window.innerHeight - 80;
                _this.orientation.x = window.innerWidth / 2;
                _this.orientation.y = (window.innerHeight - 80) / 2;
                _this.plot();
            };
            this.handleMouseDown = function (e) {
                var x = e.offsetX, y = e.offsetY;
                _this.mouseStart = { x: x, y: y };
                _this.canvas.addEventListener("mousemove", _this.handleMouseMove);
            };
            this.handleMouseUp = function (e) {
                _this.canvas.removeEventListener("mousemove", _this.handleMouseMove);
            };
            this.handleMouseMove = function (e) {
                var _a = _this.mouseStart, startX = _a.x, startY = _a.y;
                var offsetX = e.offsetX, offsetY = e.offsetY;
                _this.orientation.x = _this.orientation.x + (offsetX - startX);
                _this.orientation.y = _this.orientation.y + (offsetY - startY);
                _this.mouseStart = {
                    x: offsetX,
                    y: offsetY
                };
                _this.plot();
            };
            this.handleScroll = function (e) {
                var wheelDeltaY = e.wheelDeltaY, offsetX = e.offsetX, offsetY = e.offsetY;
                var dX = (offsetX - _this.canvas.width / 2) / _this.canvas.width;
                var dY = (offsetY - _this.canvas.height / 2) / _this.canvas.height;
                var zoomPanFactor = 50;
                if (wheelDeltaY > 0) {
                    _this.orientation.zoom = +(_this.orientation.zoom *
                        (1 + _this.zoomPercentage)).toFixed(4);
                    _this.orientation.x = Math.round(_this.orientation.x - dX * zoomPanFactor);
                    _this.orientation.y = Math.round(_this.orientation.y - dY * zoomPanFactor);
                }
                else {
                    _this.orientation.zoom = +(_this.orientation.zoom /
                        (1 + _this.zoomPercentage)).toFixed(4);
                    _this.orientation.x = Math.round(_this.orientation.x + dX * zoomPanFactor);
                    _this.orientation.y = Math.round(_this.orientation.y + dY * zoomPanFactor);
                }
                _this.plot();
            };
            this.plotGrid = function () {
                var _a = _this.orientation, x = _a.x, y = _a.y, zoom = _a.zoom;
                var width = _this.canvas.width / zoom;
                var height = _this.canvas.height / zoom;
                _this.c.lineWidth = 1;
                _this.c.textAlign = "center";
                _this.c.font = "bold 12px monospace";
                var gridSpacing = 0.05;
                var breakpoints = [
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
                var i = 0;
                while (breakpoints[i] &&
                    (breakpoints[i] < width / 6 || breakpoints[i] < height / 6)) {
                    gridSpacing = breakpoints[i];
                    i++;
                }
                _this.gridSpacing = gridSpacing;
                _this.plotGridSegments();
            };
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
        Graph.prototype.addEventListeners = function () {
            window.addEventListener("resize", this.handleResize);
            this.form.addEventListener("submit", this.handleSubmit);
            this.canvas.addEventListener("mousedown", this.handleMouseDown);
            this.canvas.addEventListener("mouseup", this.handleMouseUp);
            window.addEventListener("mousewheel", this.handleScroll);
        };
        Graph.prototype.calculate = function (x) {
            var equation = this.equation.replace(/x/gm, x);
            return eval(equation);
        };
        Graph.prototype.calculateSigFigs = function () {
            this.sigFigs = this.orientation.zoom.toFixed(0).length + 2;
        };
        Graph.prototype.setData = function () {
            var data = [];
            var x = 0;
            while (x < this.canvas.width + this.precision) {
                var _x = x;
                // horizontal pan
                _x -= this.orientation.x;
                // horizontal zoom
                _x /= this.orientation.zoom;
                var y = this.calculate(_x.toFixed(this.sigFigs));
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
        };
        Graph.prototype.plotData = function () {
            if (!this.data || !this.data.length)
                return;
            this.plotAxes();
            this.c.beginPath();
            this.c.moveTo(this.data[0][0], this.data[0][1]);
            this.c.strokeStyle = "rgba(0, 0, 139, 0.7)";
            var i = 1;
            while (this.data.length > i) {
                this.c.lineTo(this.data[i][0], this.data[i][1]);
                i++;
            }
            this.c.stroke();
        };
        Graph.prototype.plotAxes = function () {
            var _a = this.orientation, x = _a.x, y = _a.y;
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
        };
        Graph.prototype.plotGridSegment = function (axis, direction) {
            var _a = this.orientation, x = _a.x, y = _a.y;
            var gridSpacing = this.gridSpacing;
            var _x = x;
            var _y = y;
            var label = 0;
            var index = 0;
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
        };
        Graph.prototype.plotGridSegments = function () {
            var _a = this.orientation, x = _a.x, y = _a.y;
            var gridSpacing = this.gridSpacing;
            var _x = x;
            var _y = y;
            var label = 0;
            var index = 0;
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
                var bg = new Array(label.toString().length + 1)
                    .map(function () { return "█"; })
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
                var bg = new Array(label.toString().length + 1)
                    .map(function () { return "█"; })
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
        };
        Graph.prototype.plot = function () {
            var _this = this;
            window.requestAnimationFrame(function () {
                _this.c.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
                _this.calculateSigFigs();
                _this.setData();
                _this.plotAxes();
                _this.plotGrid();
                _this.plotData();
            });
        };
        return Graph;
    }());
    var graph = new Graph();
    graph.plot();
})();
