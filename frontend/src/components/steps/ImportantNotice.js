import React, { Component } from 'react';
import { Button, Header } from 'semantic-ui-react';

import appStore from '../../stores/app.store';
import Text from '../ui/Text';

export default class ImportantNotice extends Component {
  render () {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Header as='h2'>
          IMPORTANT NOTICE
        </Header>

        <Text.Container>
          <Text>
            The Polkadot auction requires experience and knowledge of <b>sending and receiving Ether</b> as well
            as the <b>safe storage of JSON wallet files</b>.
          </Text>

          <Text>
            Web3 Foundation will not provide any customer support for the registration process. <b>By
            participating in the auction, you assume full responsibility for your funds.</b>
          </Text>
        </Text.Container>

        <Button primary size='big' onClick={this.handleContinue}>
          Continue
        </Button>
      </div>
    );
  }

  handleContinue = () => {
    appStore.goto('start');
    // appStore.goto('picops-country-selection');
  };
}
