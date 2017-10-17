import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Header } from 'semantic-ui-react';
import { withRouter } from 'react-router-dom';

import auctionStore from '../stores/auction.store';

import AppContainer from './AppContainer';
import Chart from './Chart';
import Text from './ui/Text';

@observer
class ChartView extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired
  };

  componentWillMount () {
    auctionStore.ready(() => {
      const { now, beginTime } = auctionStore;

      if (now < beginTime) {
        return this.props.history.replace('/');
      }
    });
  }

  render () {
    const { beginTime, now, endTime } = auctionStore;
    const hasNotEnded = now <= beginTime || now < endTime;

    return (
      <AppContainer
        hideStepper
        header={(
          <Header style={{ marginTop: '0' }}>
            REAL TIME AUCTION DATA
          </Header>
        )}
        style={{
          padding: '2em 2.5em'
        }}
      >
        <Text.Container>
          <Text>
            <Header as='h2'>
              The Polkadot token sale is a Spend-All Second-Price Dutch Auction.
            </Header>
          </Text>
          <Text>
            <ul>
              <li>
                5,000,000 DOT tokens available
              </li>
              <li>
                DOT price starts high, lowers over time
              </li>
              <li>
                Everyone pays the lowest price per DOT
              </li>
              <li>
                15% bonus DOTs for transactions received in the first hour
              </li>
            </ul>
          </Text>
        </Text.Container>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Chart />

          {
            hasNotEnded
              ? (
                <div>
                  * "contributed so far" includes the bonuses
                </div>
              )
              : null
          }
        </div>

        <Text>
          At the beginning of the auction the effective cap starts out high and the
          contributions low. As the auction progresses the contributions rise, while
          the current cap decreases according to predetermined formula. Once the
          contributions reach the cap, the 5 million DOT tokens will be allocated to
          contributors in proportion to their contribution.
        </Text>
      </AppContainer>
    );
  }
}

export default withRouter(ChartView);
