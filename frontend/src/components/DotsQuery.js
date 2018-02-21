import React, { Component } from 'react';
import { Button, Header, Statistic } from 'semantic-ui-react';
import BigNumber from 'bignumber.js';

import AppContainer from './AppContainer';
import AddressInput from './AddressInput';

import { isValidAddress } from '../utils';

import DISTRIBUTION from '../distribution.json';

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
    if (!this.state.dots) {
      return null;
    }

    const dots = new BigNumber(this.state.dots);

    return (
      <div style={{ textAlign: 'center' }}>
        <Header as='h4'>
          Your contribution and resulting DOT allocation
        </Header>
        <div>
          <Statistic size='huge'>
            <Statistic.Value>{dots.div(1000).toFormat()}</Statistic.Value>
            <Statistic.Label>DOTS</Statistic.Label>
          </Statistic>
        </div>
      </div>
    );
  }

  async fetchInfo (who) {
    if (who in DISTRIBUTION) {
      return { dots: DISTRIBUTION[who] };
    }

    return { dots: 0 };
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
