import { throttle } from 'lodash';
import Logdown from 'logdown/src/browser.js';
import storeEngine from 'store/src/store-engine';
import sessionStorage from 'store/storages/sessionStorage';

const store = storeEngine.createStore([ sessionStorage ], []);

const LOGS_LS_KEY = 'parity-crowdsale::logs';
// Save logs every 5 seconds max
const saveLogs = throttle(_saveLogs, 5000);

let logs = [];

function transport ({ msg, level, args }) {
  const log = { msg, level, args, date: Date.now() };

  logs.push(log);
  saveLogs();
}

// Store logs to localstorage every once in a while
function _saveLogs () {
  const prevLogs = store.get(LOGS_LS_KEY, []);
  const clogs = logs.slice();

  logs = [];

  // Delete logs older than 1 day
  const minDate = Date.now() - 1000 * 3600 * 24;
  const nextLogs = prevLogs
    .concat(clogs)
    .filter((log) => log.date > minDate);

  store.set(LOGS_LS_KEY, nextLogs);
}

Logdown.transports = [ transport ];

const Logger = (name) => {
  const logger = Logdown(name, {
    isEnabled: true
  });

  logger.state.isEnabled = true;
  return logger;
};

export default Logger;

export const clearLogs = () => {
  logs = [];
  store.set(LOGS_LS_KEY, []);
};

export const getLogs = () => {
  const prevLogs = store.get(LOGS_LS_KEY, []);
  const allLogs = prevLogs.concat(logs);

  return allLogs;
};
