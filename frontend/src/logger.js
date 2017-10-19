import EventEmitter from 'eventemitter3';
import { throttle } from 'lodash';
import Logdown from 'logdown/src/browser.js';
import storeEngine from 'store/src/store-engine';
import sessionStorage from 'store/storages/sessionStorage';

const store = storeEngine.createStore([ sessionStorage ], []);

const LOGS_LS_KEY = 'parity-crowdsale::logs';

class Logger extends EventEmitter {
  logs = [];

  constructor () {
    super();
    Logdown.transports = [ this.transport ];

    // Save logs every 5 seconds max
    this.saveLogs = throttle(this._saveLogs, 5000);
  }

  clearLogs = () => {
    this.logs = [];
    store.set(LOGS_LS_KEY, []);
  };

  create = (name) => {
    const logger = Logdown(name, {
      isEnabled: true
    });

    logger.state.isEnabled = true;
    return logger;
  };

  getLogs = () => {
    const prevLogs = store.get(LOGS_LS_KEY, []);
    const allLogs = prevLogs.concat(this.logs);

    return allLogs;
  };

  // Store logs to localstorage every once in a while
  _saveLogs = () => {
    const prevLogs = store.get(LOGS_LS_KEY, []);
    const clogs = this.logs.slice();

    this.logs = [];

    // Delete logs older than 1 day
    const minDate = Date.now() - 1000 * 3600 * 24;
    const nextLogs = prevLogs
      .concat(clogs)
      .filter((log) => log.date > minDate);

    store.set(LOGS_LS_KEY, nextLogs);
  };

  transport = ({ msg, level, args }) => {
    const log = { msg, level, args, date: Date.now() };

    this.logs.push(log);
    this.saveLogs();
    this.emit('log');
  };
}

export const logger = new Logger();
export default logger.create;
