import React, { Component } from 'react';
import { Button, Header } from 'semantic-ui-react';

import appStore from '../../stores/app.store';
import config from '../../stores/config.store';
import feeStore from '../../stores/fee.store';
import Text from '../ui/Text';

import { fromWei } from '../../utils';

export default class Start extends Component {
  render () {
    const { fee } = feeStore;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Header as='h2'>
          WEB3 IDENTITY VERIFICATION PROCESS
        </Header>

        <Text.Container>
          <Text>
            Welcome to the Web3 auction registration. The registration process should take approximately 20-30 minutes.
          </Text>

          <Text>
            Before participating in the auction, you will need to take the following steps:
          </Text>

          <Text>
            1. Generate a new Ether wallet JSON file through our registration process or load an existing
            JSON file with the funds you wish to commit. <b>Please note that you will NOT be able to send funds
            via an exchange wallet. Furthermore, we DO NOT support using a hardware wallet.</b>
          </Text>

          <Text>
            2. Verify your identity. Because of the existing regulatory environment, you must verify your
            identity via our certification service PICOPS. In order to do this, your Ether wallet address
            will be linked to your government issued identification. <b>Only addresses that are linked to a
            verified identity will be permitted to participate.</b> There will be a fee of {fromWei(fee).toFormat()} Ether
            for the use of this service.
          </Text>

          <Text>
            Please note that owing to regulatory uncertainty, we regret that we cannot accommodate participants
            from the following countries: USA and People's Republic of China.
          </Text>

          <Text>
            We would like to emphasize that you are participating in this auction at your own risk. We do not
            promise a return on your commitment. The crypto environment can be both volatile and hostile - please
            ensure you take the appropriate security steps to ensure your funds are safe.
          </Text>

          <Text>
            Web3 Foundation will not provide any customer support for the registration process. By participating
            in the auction, you assume <b>full responsibility</b> for your funds.
          </Text>
        </Text.Container>

        <div>
          <Button secondary size='big' as='a' href={config.get('saleWebsite')}>
            Return to website
          </Button>
          <Button primary size='big' onClick={this.handleStart}>
            Start
          </Button>
        </div>
      </div>
    );
  }

  handleStart = () => {
    appStore.goto('terms');
  };
}
