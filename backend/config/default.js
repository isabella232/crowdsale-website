const dev = require('./dev');

module.exports = Object.assign({
  http: {
    hostname: '127.0.0.1',
    port: 4000
  },
  redis: {
    host: '127.0.0.1',
    port: 6379
  },
  nodeWs: 'ws://127.0.0.1:8546/'
}, dev);
