import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Button, Header, Statistic } from 'semantic-ui-react';

import AppContainer from './AppContainer';
import AddressInput from './AddressInput';

import auctionStore from '../stores/auction.store';
import backend from '../backend';
import { fromWei, isValidAddress } from '../utils';

@observer
export default class DotsQuery extends Component {
  state = {
    loading: false,
    results: null,
    who: ''
  };

  render () {
    const { loading, who } = this.state;
    const valid = isValidAddress(who);

    return (
      <AppContainer
        hideStepper
        header={(
          <Header>
            QUERY YOUR DOTS ALLOCATION
          </Header>
        )}
        style={{
          padding: '2em 2.5em'
        }}
      >
        <Header as='h4'>
          Enter the Ethereum address you would like to query
        </Header>
        <AddressInput
          onChange={this.handleWhoChange}
          value={who}
        />
        {this.renderResult()}
        <div style={{ textAlign: 'center', marginTop: '2em' }}>
          <Button disabled={!valid} primary size='big' loading={loading} onClick={this.handleQuery}>
            Query
          </Button>
        </div>
      </AppContainer>
    );
  }

  renderResult () {
    const { results } = this.state;

    if (!results) {
      return null;
    }

    const { accounted } = results;
    const dots = auctionStore.weiToDot(accounted);
    const { currentPrice, DIVISOR } = auctionStore;

    return (
      <div style={{ textAlign: 'center' }}>
        <Header as='h4'>
          Your current contribution and resulting DOT allocation
        </Header>
        <p>
          Please note, your DOT allocation is not final until the auction concludes.
        </p>
        <div>
          <Statistic size='huge' style={{ marginRight: '4em' }}>
            <Statistic.Value>{fromWei(accounted).toFormat()}</Statistic.Value>
            <Statistic.Label>ETH</Statistic.Label>
          </Statistic>

          <Statistic size='huge'>
            <Statistic.Value>{dots.toFormat()}</Statistic.Value>
            <Statistic.Label>DOTS</Statistic.Label>
          </Statistic>
        </div>

        <div style={{ marginTop: '1em' }}>
          <Statistic size='small' color='grey'>
            <Statistic.Value>{fromWei(currentPrice.mul(DIVISOR)).toFormat(5)}</Statistic.Value>
            <Statistic.Label>ETH / DOT</Statistic.Label>
          </Statistic>
        </div>
      </div>
    );
  }

  async fetchInfo (who) {
    try {
      const { accounted } = await backend.getAddressInfo(who);

      this.setState({ results: { accounted } });
    } catch (error) {
      console.error(error);
    }
  }

  handleQuery = () => {
    const { who } = this.state;

    if (isValidAddress(who)) {
      this.setState({ loading: true });
      this.fetchInfo(who);
      this.setState({ loading: false });
    }
  };

  handleWhoChange = (_, { value }) => {
    this.setState({ who: value, results: null });
  };
}
