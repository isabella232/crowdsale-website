import React, { Component } from 'react';
import { Card, Header, Image } from 'semantic-ui-react';

import EthereumImg from '../../images/ethereum.png';
import EthereumBlankImg from '../../images/ethereum_blank.png';

import accountCreator from './AccountCreator/accountCreator.store';
import appStore from '../../stores/app.store';

const cardStyle = {
  width: '300px',
  maxWidth: '100%',
  textAlign: 'center',
  margin: 0
};

const imageStyle = {
  width: '125px',
  margin: '0 auto'
};

const imageContainerStyle = {
  background: 'rgba(0,0,0,.05)',
  padding: '2.5em 0',
  width: '100%'
};

export default class AccountSelection extends Component {
  render () {
    return (
      <div>
        <Header as='h2' textAlign='center'>
          LOAD / GENERATE YOUR WALLET
        </Header>

        <div style={{ margin: '2em 0 3em', fontSize: '1.1em' }}>
          In order to be able to claim your DOTs, it is necessary to
          have access to the private key corresponding to the contribution
          address. <b>Hardware wallets, exchanges and multisig wallets are not supported in this process.</b>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
          <Card fluid link style={cardStyle} onClick={this.handleLoad}>
            <div style={imageContainerStyle}>
              <Image src={EthereumImg} style={imageStyle} />
            </div>
            <Card.Content>
              <Card.Header textAlign='center' style={{ padding: '0.5em 0' }}>
                Load an Ethereum JSON Keystore File
              </Card.Header>
            </Card.Content>
          </Card>

          <Card fluid link style={cardStyle} onClick={this.handleCreate}>
            <div style={imageContainerStyle}>
              <Image src={EthereumBlankImg} style={imageStyle} />
            </div>
            <Card.Content>
              <Card.Header textAlign='center' style={{ padding: '0.5em 0' }}>
                Generate a new Ethereum wallet
              </Card.Header>
            </Card.Content>
          </Card>
        </div>
      </div>
    );
  }

  handleLoad = () => {
    appStore.goto('load-account');
  };

  handleCreate = () => {
    accountCreator.generateWallet();
    appStore.goto('create-account-password');
  };
}
