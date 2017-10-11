import React, { Component } from 'react';
import { Button, Header } from 'semantic-ui-react';

import config from '../../stores/config.store';

export default class InactiveAuction extends Component {
  render () {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Header as='h2'>
          THE SALE IS YET TO BE OVER
        </Header>
        <p style={{ margin: '1em 0 2em' }}>
          We are sorry but the sale ends in less than 1 hour, so
          as you are not certified, you will not be able to participate
          in the sale.
        </p>
        <Button secondary size='large' as='a' href={config.get('saleWebsite')}>
          Return to main website
        </Button>
      </div>
    );
  }
}
