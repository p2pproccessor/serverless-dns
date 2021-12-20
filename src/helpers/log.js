/*
 * Copyright (c) 2021 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { uid } from "./util.js";

// high "error" (4); low "debug" (0)
const _LOG_LEVELS = new Map(
  ["error", "warn", "info", "timer", "debug"].reverse().map((l, i) => [l, i])
);

/**
 * Configure console log level globally. May be checked with `console.level`.
 * `console` methods are made non-functional accordingly.
 * @param {'error'|'warn'|'info'|'timer'|'debug'} level - log level
 * @returns level
 */
function _setConsoleLevel(level) {
  level = level;
  switch (level) {
    case "error":
      globalThis.console.warn = () => null;
    case "warn":
      globalThis.console.info = () => null;
    case "info":
      globalThis.console.time = () => null;
      globalThis.console.timeEnd = () => null;
      globalThis.console.timeLog = () => null;
    case "timer":
      globalThis.console.debug = () => null;
    case "debug":
      break;
    default:
      console.error("Unknown console level: ", level);
      level = null;
  }
  if (level) {
    console.log("Console level set: ", level);
    globalThis.console.level = level;
  }
  return level;
}

export default class Log {
  /**
   * Provide console methods alias and similar meta methods.
   * Sets log level for the current instance. Default: `debug`.
   * If console level has been set, log level cannot be lower than it.
   * @param {'error'|'warn'|'info'|'timer'|'debug'} [level] - log level
   * @param {boolean} [consoleLevel=false] - Set console level to `level`
   */
  constructor(level, consoleLevel) {
    if (!_LOG_LEVELS.has(level)) level = "debug";
    if (consoleLevel && !console.level) _setConsoleLevel(level);
    this.setLevel(level);
  }
  resetLevel() {
    this.l = console.log;
    this.d = () => null;
    this.lapTime = () => null;
    this.startTime = () => null;
    this.endTime = () => null;
    this.i = () => null;
    this.w = () => null;
    this.e = () => null;
  }
  setLevel(level) {
    if (!_LOG_LEVELS.has(level)) throw new Error(`Unknown log level: ${level}`);

    if (
      console.level &&
      _LOG_LEVELS.get(level) < _LOG_LEVELS.get(console.level)
    ) {
      throw new Error(
        `Cannot set (log.level='${level}') < (console.level = '${console.level}')`
      );
    }

    this.resetLevel();
    switch (level) {
      default:
      case "debug":
        this.d = console.debug;
      case "timer":
        this.lapTime = console.timeLog;
        this.startTime = function (name) {
          name += uid();
          console.time(name);
          return name;
        };
        this.endTime = console.timeEnd;
      case "info":
        this.i = console.info;
      case "warn":
        this.w = console.warn;
      case "error":
        this.e = console.error;
    }
    this.level = level;
  }
}
