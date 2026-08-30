/* Focus Sanctuary — procedural soundscapes via Web Audio API.
 * All sounds are synthesized (no network). Requires user gesture to start (iOS).
 */
(function (global) {
  "use strict";

  var SCAPES = {
    rain: { label: "Rain", colour: "#60a5fa" },
    brown: { label: "Deep focus", colour: "#a78bfa" },
    ocean: { label: "Ocean", colour: "#22d3ee" },
    space: { label: "Deep space", colour: "#818cf8" },
    library: { label: "Library", colour: "#f0c75e" },
    silence: { label: "Silence", colour: "#93a4c8" }
  };

  function Soundscape() {
    this.ctx = null;
    this.master = null;
    this.nodes = [];
    this.current = "brown";
    this.playing = false;
    this.volume = 0.55;
  }

  Soundscape.prototype._ensure = function () {
    if (this.ctx) return this.ctx;
    var Ctx = global.AudioContext || global.webkitAudioContext;
    if (!Ctx) return null;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    return this.ctx;
  };

  Soundscape.prototype._stopNodes = function () {
    this.nodes.forEach(function (n) {
      try {
        if (n.stop) n.stop(0);
        if (n.disconnect) n.disconnect();
      } catch (_) { /* already stopped */ }
    });
    this.nodes = [];
  };

  Soundscape.prototype._noise = function (type, filterFreq, q) {
    var ctx = this.ctx;
    var len = ctx.sampleRate * 2;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    var last = 0;
    for (var i = 0; i < len; i++) {
      var white = Math.random() * 2 - 1;
      if (type === "brown") {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      } else if (type === "pink") {
        data[i] = white * 0.5;
      } else {
        data[i] = white;
      }
    }
    var src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    var filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    filter.Q.value = q || 0.7;
    var gain = ctx.createGain();
    gain.gain.value = 0.35;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start();
    this.nodes.push(src, filter, gain);
    return { src: src, filter: filter, gain: gain };
  };

  Soundscape.prototype._tone = function (freq, type, vol, detune) {
    var ctx = this.ctx;
    var osc = ctx.createOscillator();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;
    var gain = ctx.createGain();
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    this.nodes.push(osc, gain);
    return { osc: osc, gain: gain };
  };

  Soundscape.prototype._lfo = function (target, rate, depth) {
    var ctx = this.ctx;
    var lfo = ctx.createOscillator();
    lfo.frequency.value = rate;
    var lfoGain = ctx.createGain();
    lfoGain.gain.value = depth;
    lfo.connect(lfoGain);
    lfoGain.connect(target);
    lfo.start();
    this.nodes.push(lfo, lfoGain);
  };

  Soundscape.prototype._build = function (name) {
    this._stopNodes();
    if (name === "silence") return;

    if (name === "rain") {
      var rain = this._noise("white", 800, 1.2);
      rain.filter.type = "bandpass";
      rain.filter.frequency.value = 1200;
      this._lfo(rain.filter.frequency, 0.08, 200);
      var drip = this._noise("pink", 400, 2);
      drip.gain.gain.value = 0.12;
    } else if (name === "brown") {
      this._noise("brown", 320, 0.5);
    } else if (name === "ocean") {
      var ocean = this._noise("pink", 500, 0.8);
      this._lfo(ocean.filter.frequency, 0.05, 180);
      this._lfo(ocean.gain.gain, 0.07, 0.08);
    } else if (name === "space") {
      this._noise("brown", 120, 0.3);
      this._tone(55, "sine", 0.06, -8);
      this._tone(82.5, "sine", 0.04, 5);
      this._tone(110, "triangle", 0.02, 0);
    } else if (name === "library") {
      this._noise("pink", 600, 0.4);
      this._tone(196, "sine", 0.015, 0);
      this._tone(247, "sine", 0.01, 3);
      this._tone(294, "sine", 0.008, -2);
    }
  };

  Soundscape.prototype.start = function (name) {
    if (!this._ensure()) return false;
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.current = name || this.current;
    this._build(this.current);
    this.playing = this.current !== "silence";
    return true;
  };

  Soundscape.prototype.setScape = function (name) {
    this.current = name;
    if (this.playing) this._build(name);
  };

  Soundscape.prototype.setVolume = function (v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.volume;
  };

  Soundscape.prototype.stop = function () {
    this._stopNodes();
    this.playing = false;
  };

  Soundscape.prototype.playChime = function () {
    if (!this._ensure()) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    var ctx = this.ctx;
    [523, 659, 784].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.12 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 1.2);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 1.3);
    });
  };

  global.FocusAudio = {
    Soundscape: Soundscape,
    SCAPES: SCAPES
  };
})(window);
