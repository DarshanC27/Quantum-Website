/* Focus Sanctuary — session controller, notification shield, iOS helpers. */
(function (global) {
  "use strict";

  var PRESETS = {
    pomodoro: { label: "Pomodoro", minutes: 25, breakMin: 5 },
    deep: { label: "Deep work", minutes: 90, breakMin: 15 },
    sprint: { label: "Sprint", minutes: 45, breakMin: 10 },
    custom: { label: "Custom", minutes: 30, breakMin: 5 }
  };

  var STORAGE_KEY = "focus-sanctuary-stats";
  var SETUP_KEY = "focus-sanctuary-setup";

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function loadStats() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  function saveStats(stats) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch (_) { /* private mode */ }
  }

  function FocusApp(options) {
    this.scene = options.scene;
    this.audio = options.audio;
    this.durationSec = PRESETS.pomodoro.minutes * 60;
    this.remaining = this.durationSec;
    this.running = false;
    this.interval = null;
    this.wakeLock = null;
    this.stats = loadStats();
    this.stats.sessions = this.stats.sessions || 0;
    this.stats.minutes = this.stats.minutes || 0;
    this.shieldActive = false;
    this._bindUI();
    this._updateDisplay();
    this._updateStats();
  }

  FocusApp.prototype._bindUI = function () {
    var self = this;

    this.els = {
      timer: $("#timer-display"),
      status: $("#session-status"),
      progress: $("#timer-ring"),
      startBtn: $("#btn-start"),
      pauseBtn: $("#btn-pause"),
      resetBtn: $("#btn-reset"),
      presetBtns: $$("[data-preset]"),
      scapeBtns: $$("[data-scape]"),
      volume: $("#volume"),
      shieldToggle: $("#shield-toggle"),
      shieldStatus: $("#shield-status"),
      fullscreenBtn: $("#btn-fullscreen"),
      iosGuide: $("#ios-guide"),
      iosGuideClose: $("#ios-guide-close"),
      iosGuideSettings: $("#ios-guide-open-settings"),
      blockSetupBtn: $("#btn-block-setup"),
      statsSessions: $("#stat-sessions"),
      statsMinutes: $("#stat-minutes"),
      customMin: $("#custom-minutes"),
      boot: $("#boot"),
      wrap: $("#app")
    };

    this.els.startBtn.addEventListener("click", function () { self.startSession(); });
    this.els.pauseBtn.addEventListener("click", function () { self.pauseSession(); });
    this.els.resetBtn.addEventListener("click", function () { self.resetSession(); });

    this.els.presetBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (self.running) return;
        self.els.presetBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var key = btn.getAttribute("data-preset");
        var preset = PRESETS[key];
        if (key === "custom" && self.els.customMin) {
          preset = { minutes: parseInt(self.els.customMin.value, 10) || 30 };
        }
        self.durationSec = preset.minutes * 60;
        self.remaining = self.durationSec;
        self._updateDisplay();
      });
    });

    if (this.els.customMin) {
      this.els.customMin.addEventListener("change", function () {
        if ($("[data-preset='custom']").classList.contains("active") && !self.running) {
          self.durationSec = (parseInt(self.els.customMin.value, 10) || 30) * 60;
          self.remaining = self.durationSec;
          self._updateDisplay();
        }
      });
    }

    this.els.scapeBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        self.els.scapeBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var scape = btn.getAttribute("data-scape");
        if (!self.audio.playing && scape !== "silence") {
          self.audio.start(scape);
        } else {
          self.audio.setScape(scape);
        }
        self._setScapeLabel(scape);
      });
    });

    if (this.els.volume) {
      this.els.volume.addEventListener("input", function () {
        self.audio.setVolume(parseFloat(self.els.volume.value));
      });
    }

    if (this.els.shieldToggle) {
      this.els.shieldToggle.addEventListener("change", function () {
        if (self.els.shieldToggle.checked) self.enableShield();
        else self.disableShield();
      });
    }

    if (this.els.fullscreenBtn) {
      this.els.fullscreenBtn.addEventListener("click", function () { self.toggleFullscreen(); });
    }

    if (this.els.iosGuideClose) {
      this.els.iosGuideClose.addEventListener("click", function () {
        self.els.iosGuide.classList.remove("open");
      });
    }

    if (this.els.blockSetupBtn) {
      this.els.blockSetupBtn.addEventListener("click", function () {
        self.openBlockSetup();
      });
    }

    if (this.els.iosGuideSettings) {
      this.els.iosGuideSettings.addEventListener("click", function () {
        self._openIosSettingsHelp();
      });
    }

    this._bindSetupSteps();
    this._restoreSetupSteps();

    document.addEventListener("visibilitychange", function () {
      if (self.running && document.hidden && self.shieldActive) {
        self._flashStatus("Return to sanctuary — focus shield active");
      }
      if (!document.hidden && self.shieldActive) self._requestWakeLock();
    });

    global.addEventListener("beforeunload", function (e) {
      if (self.running && self.shieldActive) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
  };

  FocusApp.prototype._setScapeLabel = function (scape) {
    var meta = global.FocusAudio.SCAPES[scape];
    var label = meta ? meta.label : scape;
    if (this.els.status && !this.running) {
      this.els.status.textContent = "Soundscape: " + label;
    }
  };

  FocusApp.prototype.openBlockSetup = function () {
    if (this.els.iosGuide) this.els.iosGuide.classList.add("open");
  };

  FocusApp.prototype._bindSetupSteps = function () {
    var self = this;
    $$(".step-check input[type=checkbox]").forEach(function (box) {
      box.addEventListener("change", function () {
        var row = box.closest(".step-check");
        if (row) row.classList.toggle("done", box.checked);
        self._saveSetupSteps();
      });
    });
  };

  FocusApp.prototype._saveSetupSteps = function () {
    var done = {};
    $$(".step-check input[type=checkbox]").forEach(function (box) {
      done[box.id] = box.checked;
    });
    try { localStorage.setItem(SETUP_KEY, JSON.stringify(done)); } catch (_) { /* noop */ }
  };

  FocusApp.prototype._restoreSetupSteps = function () {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(SETUP_KEY) || "{}"); } catch (_) { /* noop */ }
    $$(".step-check input[type=checkbox]").forEach(function (box) {
      if (saved[box.id]) {
        box.checked = true;
        var row = box.closest(".step-check");
        if (row) row.classList.add("done");
      }
    });
  };

  FocusApp.prototype._openIosSettingsHelp = function () {
    var msg = "On your iPhone:\n\n1. Leave Safari and open the Settings app\n2. Tap Focus\n3. Tap + to create Study (or edit Do Not Disturb)\n4. Apps → Allow Notifications From → leave empty\n\nThis blocks notifications from every app.";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).catch(function () { alert(msg); });
      if (this.els.shieldStatus) {
        this.els.shieldStatus.textContent = "Steps copied — open Settings app";
      }
    } else {
      alert(msg);
    }
  };

  FocusApp.prototype._flashStatus = function (msg) {
    if (!this.els.status) return;
    this.els.status.textContent = msg;
    this.els.status.classList.add("warn");
    var self = this;
    setTimeout(function () {
      self.els.status.classList.remove("warn");
      if (self.running) self.els.status.textContent = "Focus shield active";
    }, 3000);
  };

  FocusApp.prototype._updateDisplay = function () {
    if (this.els.timer) this.els.timer.textContent = formatTime(this.remaining);
    if (this.els.progress) {
      var pct = this.durationSec ? (1 - this.remaining / this.durationSec) : 0;
      var circ = 2 * Math.PI * 54;
      this.els.progress.style.strokeDashoffset = String(circ * (1 - pct));
    }
  };

  FocusApp.prototype._updateStats = function () {
    if (this.els.statsSessions) this.els.statsSessions.textContent = String(this.stats.sessions);
    if (this.els.statsMinutes) this.els.statsMinutes.textContent = String(this.stats.minutes);
  };

  FocusApp.prototype._requestWakeLock = async function () {
    if (!("wakeLock" in navigator)) return;
    try {
      if (this.wakeLock) await this.wakeLock.release();
      this.wakeLock = await navigator.wakeLock.request("screen");
    } catch (_) { /* low battery or unsupported PWA */ }
  };

  FocusApp.prototype._releaseWakeLock = async function () {
    if (!this.wakeLock) return;
    try { await this.wakeLock.release(); } catch (_) { /* noop */ }
    this.wakeLock = null;
  };

  FocusApp.prototype.enableShield = async function () {
    this.shieldActive = true;
    if (this.scene) this.scene.setFocus(true);
    if (this.els.shieldStatus) {
      this.els.shieldStatus.textContent = "Shield up — notifications deflected";
      this.els.shieldStatus.classList.add("on");
    }
    await this._requestWakeLock();
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      this.openBlockSetup();
    }
    document.documentElement.classList.add("shield-active");
  };

  FocusApp.prototype.disableShield = async function () {
    this.shieldActive = false;
    if (this.scene) this.scene.setFocus(false);
    if (this.els.shieldStatus) {
      this.els.shieldStatus.textContent = "Shield down";
      this.els.shieldStatus.classList.remove("on");
    }
    await this._releaseWakeLock();
    document.documentElement.classList.remove("shield-active");
  };

  FocusApp.prototype.toggleFullscreen = function () {
    var el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().catch(function () { /* iOS may reject */ });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  FocusApp.prototype.startSession = function () {
    var self = this;
    var activeScape = $("[data-scape].active");
    var scapeName = activeScape ? activeScape.getAttribute("data-scape") : "brown";
    this.audio.start(scapeName);

    if (!this.shieldActive && this.els.shieldToggle) {
      this.els.shieldToggle.checked = true;
      this.enableShield();
    }

    this.running = true;
    this.els.startBtn.disabled = true;
    this.els.pauseBtn.disabled = false;
    if (this.els.status) this.els.status.textContent = "Focus shield active";

    this.interval = setInterval(function () {
      self.remaining -= 1;
      self._updateDisplay();
      if (self.remaining <= 0) self.completeSession();
    }, 1000);
  };

  FocusApp.prototype.pauseSession = function () {
    this.running = false;
    clearInterval(this.interval);
    this.els.startBtn.disabled = false;
    this.els.pauseBtn.disabled = true;
    if (this.els.status) this.els.status.textContent = "Paused";
  };

  FocusApp.prototype.resetSession = function () {
    this.pauseSession();
    this.remaining = this.durationSec;
    this._updateDisplay();
    if (this.els.status) this.els.status.textContent = "Ready to focus";
  };

  FocusApp.prototype.completeSession = function () {
    this.pauseSession();
    this.audio.playChime();
    var completed = Math.round(this.durationSec / 60);
    this.stats.sessions += 1;
    this.stats.minutes += completed;
    saveStats(this.stats);
    this._updateStats();
    if (this.els.status) this.els.status.textContent = "Session complete — well done";
    this.remaining = this.durationSec;
    this._updateDisplay();
  };

  FocusApp.prototype.boot = function () {
    var self = this;
    var boot = this.els.boot;
    if (!boot) return;
    var fill = $("#boot-fill");
    var lbl = $("#boot-label");
    var pctEl = $("#boot-pct");
    var steps = [
      "Calibrating focus field",
      "Tuning soundscapes",
      "Raising notification shield",
      "Sanctuary ready"
    ];
    var pct = 0, step = 0;
    var iv = setInterval(function () {
      pct += 4 + Math.random() * 8;
      if (pct >= 100) {
        pct = 100;
        clearInterval(iv);
        setTimeout(function () {
          boot.classList.add("gone");
          if (self.els.wrap) self.els.wrap.classList.add("ready");
        }, 400);
      }
      if (fill) fill.style.width = pct + "%";
      if (pctEl) pctEl.textContent = Math.round(pct) + "%";
      if (lbl && step < steps.length && pct > step * 25) {
        lbl.textContent = steps[step];
        step++;
      }
    }, 70);
  };

  global.FocusApp = {
    FocusApp: FocusApp,
    PRESETS: PRESETS,
    boot: function () {
      var canvas = $("#sanctuary-canvas");
      var scene = canvas ? new global.FocusScene.SanctuaryScene(canvas).trackPointer().start() : null;
      var audio = new global.FocusAudio.Soundscape();
      var app = new FocusApp({ scene: scene, audio: audio });
      app.boot();
      return app;
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { global.FocusApp.boot(); });
  } else {
    global.FocusApp.boot();
  }
})(window);
