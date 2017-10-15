import React, { Component } from 'react';
import { Card, Header, Image } from 'semantic-ui-react';

import EthereumImg from '../../images/ethereum.png';
import EthereumBlankImg from '../../images/ethereum_blank.png';

import accountCreator from './AccountCreator/accountCreator.store';
import history from '../../stores/history';
import Text from '../ui/Text';

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

const cardHeaderStyle = {
  padding: '1em 0.5em',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export default class AccountSelection extends Component {
  render () {
    return (
      <div>
        <Header as='h2' textAlign='center'>
          LOAD / GENERATE YOUR WALLET
        </Header>

        <Text.Container>
          <Text>
            In order to be able to claim your DOTs, it is necessary to
            have access to the private key corresponding to the contribution
            address. <b>Hardware wallets, exchanges and multisig wallets are not supported
            in this process.</b>
          </Text>

          <Text>
            Your private key will be used only to send a fee for the KYC service,
            to sign terms and conditions, and to sign your contribution transaction. <b>All signing
            is done in-browser. Your private key is not uploaded to any server
            or handled by any third party.</b> Your private key will be necessary to access your
            DOTs upon the launch of Polkadot's genesis block.
          </Text>
        </Text.Container>

        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
          <Card fluid link style={cardStyle} onClick={this.handleLoad}>
            <div style={imageContainerStyle}>
              <Image src={EthereumImg} style={imageStyle} />
            </div>
            <Card.Content style={cardHeaderStyle}>
              <Card.Header textAlign='center'>
                Load an Ethereum JSON Keystore File
              </Card.Header>
            </Card.Content>
          </Card>

          <Card fluid link style={cardStyle} onClick={this.handleCreate}>
            <div style={imageContainerStyle}>
              <Image src={EthereumBlankImg} style={imageStyle} />
            </div>
            <Card.Content style={cardHeaderStyle}>
              <Card.Header textAlign='center'>
                Generate a new Ethereum wallet
              </Card.Header>
            </Card.Content>
          </Card>
        </div>
      </div>
    );
  }

  handleLoad = () => {
    history.push('/', { goto: 'load-account' });
  };

  handleCreate = () => {
    accountCreator.generateWallet();
    history.push('/', { goto: 'create-account-password' });
  };
}
