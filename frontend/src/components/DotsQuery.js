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
          onEnter={this.handleQuery}
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

    const { dots, bonus, received, price } = results;
    const { DIVISOR } = auctionStore;

    return (
      <div style={{ textAlign: 'center' }}>
        <Header as='h4'>
          Your contribution and resulting DOT allocation
        </Header>
        <div>
          <Statistic size='huge' style={{ marginRight: '4em' }}>
            <Statistic.Value>{fromWei(received).toFormat()}</Statistic.Value>
            <Statistic.Label>CONTRIBUTION (ETH)</Statistic.Label>
          </Statistic>

          {
            bonus.gt(0)
              ? (
                <Statistic size='large' style={{ marginRight: '3em' }}>
                  <Statistic.Value>{bonus.toFormat(2)}</Statistic.Value>
                  <Statistic.Label>BONUS (%)</Statistic.Label>
                </Statistic>
              )
              : null
          }

          <Statistic size='huge'>
            <Statistic.Value>{dots.div(DIVISOR).toFormat()}</Statistic.Value>
            <Statistic.Label>DOTS</Statistic.Label>
          </Statistic>
        </div>

        <div style={{ marginTop: '1em' }}>
          <Statistic size='small' color='grey'>
            <Statistic.Value>{fromWei(price.mul(DIVISOR)).toFormat(3)}</Statistic.Value>
            <Statistic.Label>ETH / DOT</Statistic.Label>
          </Statistic>
        </div>
      </div>
    );
  }

  async fetchInfo (who) {
    try {
      const { accounted, received, dots, bonus, price } = await backend.allocation(who);

      return { results: { accounted, received, dots, bonus, price } };
    } catch (error) {
      console.error(error);
    }
    return {};
  }

  handleQuery = async () => {
    const { who } = this.state;

    if (isValidAddress(who)) {
      this.setState({ loading: true, results: null });
      const info = await this.fetchInfo(who);

      setTimeout(() => {
        this.setState(Object.assign({ loading: false }, info));
      }, 250);
    }
  };

  handleWhoChange = (_, { value }) => {
    this.setState({ who: value, results: null });
  };
}
