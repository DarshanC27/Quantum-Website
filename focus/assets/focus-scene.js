/* Focus Sanctuary — 3D wireframe renderer (Canvas 2D, iOS-friendly).
 * Extends the q3d patterns from lab/q3d.js with a shield dome,
 * notification orbs, and particle field for the focus experience.
 */
(function (global) {
  "use strict";

  var reduce = global.matchMedia &&
    global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function icosahedron(radius) {
    var t = (1 + Math.sqrt(5)) / 2;
    var raw = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ];
    var scale = radius / Math.sqrt(1 + t * t);
    var pts = raw.map(function (p) {
      return [p[0] * scale, p[1] * scale, p[2] * scale];
    });
    var faces = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];
    var seen = {}, edges = [];
    faces.forEach(function (f) {
      [[f[0], f[1]], [f[1], f[2]], [f[2], f[0]]].forEach(function (e) {
        var key = Math.min(e[0], e[1]) + ":" + Math.max(e[0], e[1]);
        if (!seen[key]) { seen[key] = 1; edges.push(e); }
      });
    });
    return { points: pts, edges: edges };
  }

  function sphere(radius, rings, segments) {
    var pts = [], edges = [], grid = [];
    for (var r = 0; r <= rings; r++) {
      var phi = (r / rings) * Math.PI, row = [];
      for (var s = 0; s < segments; s++) {
        var theta = (s / segments) * Math.PI * 2;
        row.push(pts.length);
        pts.push([
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta)
        ]);
      }
      grid.push(row);
    }
    for (var i = 0; i < grid.length; i++) {
      for (var j = 0; j < grid[i].length; j++) {
        edges.push([grid[i][j], grid[i][(j + 1) % grid[i].length]]);
        if (i + 1 < grid.length) edges.push([grid[i][j], grid[i + 1][j]]);
      }
    }
    return { points: pts, edges: edges };
  }

  function makeParticles(count, spread) {
    var pts = [];
    for (var i = 0; i < count; i++) {
      var a = Math.random() * Math.PI * 2;
      var b = Math.acos(2 * Math.random() - 1);
      var r = spread * (0.35 + Math.random() * 0.65);
      pts.push([
        r * Math.sin(b) * Math.cos(a),
        r * Math.sin(b) * Math.sin(a),
        r * Math.cos(b)
      ]);
    }
    return pts;
  }

  function makeNotifOrbs(count) {
    var orbs = [];
    for (var i = 0; i < count; i++) {
      orbs.push({
        angle: Math.random() * Math.PI * 2,
        tilt: (Math.random() - 0.5) * 1.2,
        dist: 2.4 + Math.random() * 1.6,
        speed: 0.003 + Math.random() * 0.006,
        size: 0.04 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2
      });
    }
    return orbs;
  }

  function SanctuaryScene(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.core = icosahedron(0.55);
    this.shield = sphere(1.35, 14, 24);
    this.particles = makeParticles(120, 2.2);
    this.orbs = makeNotifOrbs(8);
    this.spin = 0;
    this.tilt = 0.42;
    this.pointer = { x: 0, y: 0 };
    this.shieldPulse = 0;
    this.focusActive = false;
    this.running = false;
    this.time = 0;
    this._resize();
  }

  SanctuaryScene.prototype._resize = function () {
    var rect = this.canvas.getBoundingClientRect();
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    this.w = rect.width;
    this.h = rect.height;
    this.canvas.width = Math.max(1, Math.round(this.w * dpr));
    this.canvas.height = Math.max(1, Math.round(this.h * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  SanctuaryScene.prototype.setFocus = function (active) {
    this.focusActive = !!active;
  };

  SanctuaryScene.prototype._project = function (p) {
    var cy = Math.cos(this.spin), sy = Math.sin(this.spin);
    var x = p[0] * cy - p[2] * sy;
    var z = p[0] * sy + p[2] * cy;
    var cx = Math.cos(this.tilt), sx = Math.sin(this.tilt);
    var y = p[1] * cx - z * sx;
    z = p[1] * sx + z * cx;
    var depth = 4.2 - z;
    if (depth < 0.15) depth = 0.15;
    var f = Math.min(this.w, this.h) * 0.46 / depth;
    return {
      x: this.w / 2 + x * f + this.pointer.x * 18,
      y: this.h / 2 - y * f + this.pointer.y * 12,
      d: depth
    };
  };

  SanctuaryScene.prototype._drawShape = function (shape, stroke, width, alphaBase) {
    var ctx = this.ctx, flat = [], i;
    for (i = 0; i < shape.points.length; i++) flat[i] = this._project(shape.points[i]);
    ctx.lineWidth = width;
    for (i = 0; i < shape.edges.length; i++) {
      var a = flat[shape.edges[i][0]], b = flat[shape.edges[i][1]];
      var near = 1 - Math.min(1, Math.max(0, ((a.d + b.d) / 2 - 1) / 4.2));
      ctx.globalAlpha = alphaBase + near * (1 - alphaBase);
      ctx.strokeStyle = stroke;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  SanctuaryScene.prototype.draw = function () {
    var ctx = this.ctx, i, proj;
    ctx.clearRect(0, 0, this.w, this.h);

    var pulse = this.focusActive
      ? 0.55 + Math.sin(this.shieldPulse) * 0.25
      : 0.25 + Math.sin(this.shieldPulse * 0.5) * 0.08;

    this._drawShape(
      this.shield,
      this.focusActive ? "rgba(74,222,128," + pulse + ")" : "rgba(96,165,250," + pulse + ")",
      this.focusActive ? 1.4 : 0.9,
      0.08
    );

    this._drawShape(this.core, "rgba(34,211,238,0.85)", 1.6, 0.2);

    for (i = 0; i < this.particles.length; i++) {
      var pt = this.particles[i];
      var drift = Math.sin(this.time * 0.001 + i) * 0.04;
      proj = this._project([pt[0] + drift, pt[1], pt[2]]);
      var t = 1 - Math.min(1, Math.max(0, (proj.d - 1) / 4.2));
      ctx.globalAlpha = 0.15 + t * 0.55;
      ctx.fillStyle = this.focusActive ? "rgba(74,222,128,0.9)" : "rgba(96,165,250,0.9)";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 1.2 + t * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    for (i = 0; i < this.orbs.length; i++) {
      var orb = this.orbs[i];
      orb.angle += orb.speed * (this.focusActive ? -1.2 : 1);
      var ox = Math.cos(orb.angle) * orb.dist;
      var oy = Math.sin(orb.tilt + this.time * 0.0004) * 0.5;
      var oz = Math.sin(orb.angle) * orb.dist;
      proj = this._project([ox, oy, oz]);
      var blocked = this.focusActive && orb.dist > 1.5;
      var alpha = blocked ? 0.08 : 0.35 + Math.sin(this.time * 0.003 + orb.phase) * 0.15;
      var size = (orb.size + Math.sin(this.time * 0.004 + orb.phase) * 0.02) * 80 / proj.d;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = blocked ? "rgba(251,113,133,0.4)" : "rgba(251,146,60,0.85)";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, Math.max(2, size), 0, Math.PI * 2);
      ctx.fill();
      if (blocked) {
        ctx.strokeStyle = "rgba(74,222,128,0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, Math.max(3, size + 3), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };

  SanctuaryScene.prototype.start = function () {
    var self = this;
    if (reduce) { this.draw(); return this; }
    this.running = true;

    function loop(ts) {
      if (!self.running) return;
      self.time = ts || 0;
      self.spin += self.focusActive ? 0.003 : 0.0018;
      self.shieldPulse += self.focusActive ? 0.04 : 0.015;
      self.tilt += (self.pointer.y * 0.45 - self.tilt) * 0.035;
      self.draw();
      global.requestAnimationFrame(loop);
    }
    global.requestAnimationFrame(loop);

    global.addEventListener("resize", function () {
      self._resize();
      if (reduce) self.draw();
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        self.running = false;
      } else if (!self.running) {
        self.running = true;
        global.requestAnimationFrame(loop);
      }
    });

    return this;
  };

  SanctuaryScene.prototype.trackPointer = function () {
    var self = this;
    function setFrom(x, y) {
      self.pointer.x = (x / global.innerWidth) * 2 - 1;
      self.pointer.y = (y / global.innerHeight) * 2 - 1;
    }
    global.addEventListener("mousemove", function (e) {
      setFrom(e.clientX, e.clientY);
    }, { passive: true });
    global.addEventListener("touchmove", function (e) {
      if (e.touches[0]) setFrom(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    return this;
  };

  global.FocusScene = {
    SanctuaryScene: SanctuaryScene,
    reducedMotion: reduce
  };
})(window);
