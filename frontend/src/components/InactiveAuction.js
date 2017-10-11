import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Button, Header } from 'semantic-ui-react';

import auctionStore from '../stores/auction.store';
import config from '../stores/config.store';

@observer
export default class InactiveAuction extends Component {
  render () {
    const { beginTime, now, endTime } = auctionStore;

    if (now < beginTime) {
      return this.renderNotStarted();
    }

    if (now >= endTime) {
      return this.renderHasEnded();
    }

    return null;
  }

  renderNotStarted () {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Header as='h2'>
          THE SALE HAS NOT STARTED YET
        </Header>
        <br />
        <br />
        <Button secondary size='large' as='a' href={config.get('saleWebsite')}>
          Return to main website
        </Button>
      </div>
    );
  }

  renderHasEnded () {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Header as='h2'>
          THE SALE HAS ENDED
        </Header>

        <p style={{ margin: '1em 0 2em' }}>
          You can safely use your JSON wallet file
          to withdraw any Ethere you might have sent there.
        </p>

        <Button secondary size='large' as='a' href={config.get('saleWebsite')}>
          Return to main website
        </Button>
      </div>
    );
  }
}
