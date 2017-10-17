const kovan = require('./kovan');

module.exports = Object.assign({},
  kovan,
  {
    picopsUrl: 'https://staging-picops.parity.io',
    saleWebsite: 'https://crowdsale-staging.polkadot.network/'
  }
);
