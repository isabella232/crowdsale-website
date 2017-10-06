import React, { Component } from 'react';
import { Header, Loader } from 'semantic-ui-react';

import buyStore from '../../stores/buy.store';

export default class FeePayment extends Component {
  componentWillMount () {
    buyStore.watchPurchase();
  }

  componentWillUnmount () {
    buyStore.unwatchPurchase();
  }

  render () {
    return (
      <div style={{ textAlign: 'center' }}>
        <Loader active inline='centered' size='huge' />

        <Header as='h2' style={{ textTransform: 'uppercase' }}>
          Processing purchase
        </Header>
      </div>
    );
  }
}
