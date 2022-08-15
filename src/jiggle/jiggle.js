"use strict";

/**
 * Jiggle
 *
 * © 2020 Jeff Channell
 *
 * Heavily influenced by https://github.com/davidgodzsak/mouse-shake.js
 */

const ExtensionUtils = imports.misc.extensionUtils;
const Mainloop = imports.mainloop;

const Me = ExtensionUtils.getCurrentExtension();
const PointerWatcher = imports.ui.pointerWatcher.getPointerWatcher();
const JHistory = Me.imports.src.jiggle.history;
const JLog = Me.imports.src.jiggle.log;
// effects
const { Effects, ScalingEffect, SpotlightEffect } = Me.imports.src.jiggle.effects;

const INTERVAL_MS = 10;

class JiggleExt {
  constructor() {
    this.effect;
    this.effectID;
    this.intervals = [];
    this.jiggling = false;
    this.pointerListener;

    this.enable();
  }

  /**
   * Stop the listeners and clean up any leftover assets.
   */
  destroy() {
    JLog.logInfo("Jiggle disable");
    // reset to defaults
    this.jiggling = false;
    JHistory.clear();
    // remove our pointer listener
    if (this.pointerListener) {
      JLog.logDebug("Clearing pointer listener");
      try{
        PointerWatcher._removeWatch(pointerListener);
      }catch(error) {
        logError(error)
      }
    }
    // stop the interval
    this.intervals.map((i) => Mainloop.source_remove(i));
    this.intervals = [];
  }

  /**
   * Start the listeners.
   */
  enable() {
    try {
      JLog.logInfo("Jiggle enable");
      this.update();

      // start the listeners
      this.pointerListener = PointerWatcher.addWatch(INTERVAL_MS, (x, y) => {
        JHistory.push(x, y);
        if (this.effect) this.effect.run(x, y);
      });
      this.intervals.push(
        Mainloop.timeout_add(INTERVAL_MS, () => {
          if (JHistory.check()) {
            if (!this.jiggling) {
              this.jiggling = true;
              if (this.effect) {
                JLog.logDebug("Starting jiggle effect");
                this.effect.start();
              }
            }
          } else if (this.jiggling) {
            this.jiggling = false;
            if (this.effect) {
              JLog.logDebug("Stopping jiggle effect");
              this.effect.stop();
            }
          }

          if (this.effect) this.effect.run(JHistory.lastX, JHistory.lastY);

          return true;
        })
      );
      this.intervals.push(
        Mainloop.timeout_add(34, () => {
          if (this.effect) this.effect.render();
          return true;
        })
      );
    } catch (e) {
      // ensure we clean up any leftovers if there's a problem!
      this.destroy();
      throw e;
    }
  }

  update() {
    this.effect = ScalingEffect.new_effect();
    this.effect.update();

    JHistory.threshold = Math.max(10, Math.min(500, 300));
    JLog.setLogLevel(7, 10);
  }
}

var Jiggle = JiggleExt;
