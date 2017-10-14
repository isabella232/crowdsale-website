import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Button, Grid, Header } from 'semantic-ui-react';

import accountStore from '../../../stores/account.store';
import appStore from '../../../stores/app.store';
import accountCreator from './accountCreator.store';

import AccountInfo from '../../AccountInfo';

@observer
export default class Download extends Component {
  state = {
    loading: false
  };

  componentWillMount () {
    accountCreator.downloadWallet();
  }

  render () {
    const { address } = accountCreator;
    const { loading } = this.state;

    return (
      <Grid>
        <Grid.Column width={6}>
          <Header as='h3'>
            WALLET DOWNLOADED - keep it safe!
          </Header>
          <div style={{ lineHeight: '2em' }}>
            <p>
              You have now created a new Ethereum wallet - it will
              download automatically. This wallet will be used to identify
              you in the auction. Once verified, this will be the address
              with which you can contribute funds to the token sale.
              Store it somewhere safe, and <b>DO NOT LOSE IT</b>.
            </p>
          </div>
        </Grid.Column>
        <Grid.Column width={10}>
          <div style={{ fontSize: '1.15em' }}><b>
            Your ethereum address
          </b></div>

          <AccountInfo
            address={address}
            showBalance={false}
            showCertified={false}
          />

          <br />
          <br />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={this.handleDownload}>
              Download the Wallet
            </Button>

            <Button
              color='green'
              onClick={this.handleDone}
              loading={loading}
            >
              Continue
            </Button>
          </div>
        </Grid.Column>
      </Grid>
    );
  }

  handleDone = async () => {
    const { address, secret } = accountCreator;

    this.setState({ loading: true });

    try {
      appStore.revertableSteps = 4;
      await accountStore.setAccount({ address, privateKey: secret });
      await accountStore.gotoContribute();
    } catch (error) {
      appStore.addError(error);
    }

    this.setState({ loading: false });
  };

  handleDownload = () => {
    accountCreator.downloadWallet();
  };
}
