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
    results: null,
    who: ''
  };

  render () {
    const { who } = this.state;

    return (
      <AppContainer
        hideStepper
        header={(
          <Header>
            QUERY YOUR DOTS TOKEN
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
          <Button secondary as='a' href='/#/' size='big'>
            Back
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
          Here are the information about this address as written in the Smart Contract.
        </Header>
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
            <Statistic.Value>{fromWei(currentPrice.mul(DIVISOR)).toFormat()}</Statistic.Value>
            <Statistic.Label>ETH / DOT</Statistic.Label>
          </Statistic>
        </div>
      </div>
    );
  }

  async fetchInfo (who) {
    const { accounted } = await backend.getAddressInfo(who);

    this.setState({ results: { accounted } });
  }

  handleWhoChange = (_, { value }) => {
    this.setState({ who: value, results: null });

    if (isValidAddress(value)) {
      this.fetchInfo(value);
    }
  };
}
