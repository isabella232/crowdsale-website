import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Button, Header } from 'semantic-ui-react';

import AccountInfo from '../AccountInfo';

import accountStore from '../../stores/account.store';
import appStore from '../../stores/app.store';
import buyStore from '../../stores/buy.store';
import config from '../../stores/config.store';
import auctionStore from '../../stores/auction.store';

import { fromWei } from '../../utils';

@observer
export default class Summary extends Component {
  render () {
    const { address } = accountStore;
    const { success, accounted } = buyStore;
    const dots = auctionStore.weiToDot(accounted);

    if (!success) {
      return this.renderFailure();
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Header as='h2'>
          YOU HAVE CONTRIBUTED TO THE AUCTION
        </Header>

        <div style={{
          fontSize: '1em',
          margin: '2em 0 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <AccountInfo
            address={address}
          />

          <div style={{ marginTop: '1.5em', fontSize: '1.25em' }}>
            You have successfully contributed {fromWei(accounted).toFormat()} ETH and will
            receive at least {dots.toFormat()} DOTs
          </div>

          <div style={{ marginTop: '1em', fontSize: '1.25em' }}>
            You will receive your DOTs once the sale has ended to the address above
          </div>

          <div style={{ marginTop: '2.5em' }}>
            <Button primary size='big' as='a' href={config.get('saleWebsite')}>
              Return to the main website
            </Button>
          </div>
        </div>
      </div>
    );
  }

  renderFailure () {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Header as='h2'>
          YOU CONTRIBUTION HAS FAILED
        </Header>

        <div style={{
          fontSize: '1em',
          margin: '2em 0 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>

          <div style={{ marginTop: '1em', fontSize: '1.25em' }}>
            Something went wrong during the contribution.
            Please try again and contrat us if it fails again.
          </div>

          <div style={{ marginTop: '2.5em' }}>
            <Button primary size='big' onClick={this.handleRetry}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  handleRetry = () => {
    appStore.goto('contribute');
  };
}
