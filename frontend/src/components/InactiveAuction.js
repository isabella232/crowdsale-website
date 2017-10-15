import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Button, Header } from 'semantic-ui-react';

import auctionStore from '../stores/auction.store';
import config from '../stores/config.store';
import Moment from 'react-moment';
import Text from './ui/Text';

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
          THE AUCTION IS HALTED
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
    // Add a 30 sec delay
    const beginTime = new Date(Math.max(auctionStore.beginTime, Date.now()) + 30000);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Header as='h2'>
          THE AUCTION HAS NOT STARTED YET
        </Header>
        <Text.Container>
          <Text>
            Come back <Moment fromNow title={beginTime.toLocaleString()}>{beginTime}</Moment>.
          </Text>
        </Text.Container>
        <Button secondary size='large' as='a' href={config.get('saleWebsite')}>
          Return to main website
        </Button>
      </div>
    );
  }

  renderHasEnded () {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Header as='h2' style={{ margin: '0' }}>
          THE AUCTION HAS ENDED
        </Header>

        <Text.Container>
          <Text>
            The Polkadot Auction has concluded and all DOTs have been committed.
            If you were in the middle of the process, your ETH contribution
            will not be processed in time and you will not be able to receive
            DOTs. You will still be able to access this wallet and retrieve
            your ETH. Visit this FAQ if you require further instruction on how
            to retrieve your ETH.
          </Text>
        </Text.Container>

        <Button secondary size='large' as='a' href={config.get('saleWebsite')}>
          Return to main website
        </Button>
      </div>
    );
  }
}
