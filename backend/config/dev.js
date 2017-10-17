const kovan = require('./kovan');

module.exports = Object.assign({},
  kovan,
  {
    picopsUrl: 'http://localhost:8081',
    saleWebsite: 'http://crowdsale-staging.polkadot.network/'
  }
);
