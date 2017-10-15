import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Button, Header } from 'semantic-ui-react';

import AccountInfo from '../AccountInfo';

import accountStore from '../../stores/account.store';
import appStore from '../../stores/app.store';
import buyStore from '../../stores/buy.store';
import config from '../../stores/config.store';
import auctionStore from '../../stores/auction.store';
import Text from '../ui/Text';

import { fromWei } from '../../utils';

const dotsLink = window.location.origin + '/#/dots';

@observer
export default class Summary extends Component {
  render () {
    const { address } = accountStore;
    const { bonus, success, accounted, received } = buyStore;
    const dots = accounted
      ? auctionStore.weiToDot(accounted)
      : null;

    if (!success || !accounted || accounted.eq(0)) {
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

          <Text.Container>
            <Text>
              <span>You have successfully contributed {fromWei(received).toFormat()} ETH and will receive at
              least {dots.toFormat()} DOTs. </span>
              {
                bonus
                  ? (
                    <span>
                      A {bonus}% bonus has been accounted for.
                    </span>
                  )
                  : null
              }
            </Text>

            <Text>
              DOT tokens will become available upon the genesis of the Polkadot network. Once the auction
              ends, you will be able to check your DOT allocation
              at <a href={dotsLink} target='_blank'>{dotsLink}</a>
            </Text>
          </Text.Container>

          <div style={{ marginTop: '1em' }}>
            <Button secondary size='big' onClick={this.handleRetry}>
              Contribute again
            </Button>
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

          <Text>
            Something went wrong during the contribution.
            Please try again and contrat us if it fails again.
          </Text>

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
