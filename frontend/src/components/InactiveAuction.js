import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Button, Header } from 'semantic-ui-react';

import auctionStore from '../stores/auction.store';
import config from '../stores/config.store';

@observer
export default class InactiveAuction extends Component {
  render () {
    const { beginTime, halted, now, endTime } = auctionStore;

    if (now < beginTime) {
      return this.renderNotStarted();
    }

    if (now >= endTime) {
      return this.renderHasEnded();
    }

    if (halted) {
      return this.renderHalted();
    }

    return null;
  }

  renderHalted () {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Header as='h2'>
          THE SALE IS HALTED
        </Header>
        <br />
        <br />
        <Button secondary size='large' as='a' href={config.get('saleWebsite')}>
          Return to main website
        </Button>
      </div>
    );
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
          The Polkadot auction has concluded and all DOTs have been committed.
          Unfortunately, your ETH contribution was not processed in time and you
          will not be able to receive DOTs. You will still be able to access
          this wallet and retrieve your ETH. Visit this FAQ if you require
          further instruction on how to retrieve your ETH.
        </p>

        <Button secondary size='large' as='a' href={config.get('saleWebsite')}>
          Return to main website
        </Button>
      </div>
    );
  }
}
