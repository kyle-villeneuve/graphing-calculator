(() => {
  class Desmos {
    constructor(data = []) {
      this.data = data;
      this.createCanvas();
      this.bindUIActions();
    }

    createCanvas() {
      this.canvas = document.createElement("canvas");
      this.c = this.canvas.getContext("2d");

      document.body.appendChild(this.canvas);

      this.resizeCanvas();
    }

    resizeCanvas = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };

    bindUIActions() {
      window.addEventListener("resize", this.resizeCanvas);
      window.addEventListener("orientationchange", this.resizeCanvas);
    }

    gradient(a, b) {
      return (b.y - a.y) / (b.x - a.x);
    }

    bzCurve(f = 0.3, t = 0.6) {
      // f = 0, will be straight line
      // t suppose to be 1, but changing the value can control the smoothness too

      const { data } = this;

      this.c.beginPath();
      this.c.moveTo(data[0].x, data[0].y);

      var m = 0;
      var dx1 = 0;
      var dy1 = 0;

      var previousPt = data[0];
      for (var i = 1; i < data.length; i++) {
        const currentPt = data[i];
        const nextPt = data[i + 1];

        if (nextPt) {
          m = this.gradient(previousPt, nextPt);
          dx2 = (nextPt.x - currentPt.x) * -f;
          dy2 = dx2 * m * t;
        } else {
          dx2 = 0;
          dy2 = 0;
        }

        this.c.bezierCurveTo(
          previousPt.x - dx1,
          previousPt.y - dy1,
          currentPt.x + dx2,
          currentPt.y + dy2,
          currentPt.x,
          currentPt.y
        );

        dx1 = dx2;
        dy1 = dy2;
        previousPt = currentPt;
      }
      this.c.stroke();
    }

    plotSmooth() {
      this.c.setLineDash([0]);
      this.c.lineWidth = 2;
      this.c.strokeStyle = "blue";
      this.bzCurve(0.3, 0.7);
    }

    plotStraight() {
      this.c.setLineDash([5]);
      this.c.strokeStyle = "red";
      this.c.lineWidth = 1;
      this.bzCurve(0, 0);
    }
  }

  // Generate random data
  const data = [];
  let x = 0;

  while (x < window.innerWidth) {
    const y = Math.floor(Math.random() * window.innerHeight);
    data.push({ x, y });
    x += 40;
  }

  const graph = new Desmos(data);

  graph.plotStraight();
  // graph.plotSmooth();
})();
