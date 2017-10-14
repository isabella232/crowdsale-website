import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Button, Checkbox, Header, Segment } from 'semantic-ui-react';

import appStore from '../../stores/app.store';
import feeStore from '../../stores/fee.store';

import { fromWei } from '../../utils';

import TermsMD from '../../terms.md';

@observer
export default class Terms extends Component {
  state = {
    hitBottom: false
  };

  render () {
    const { citizenAccepted, spendingAccepted, termsAccepted } = appStore;
    const { hitBottom } = this.state;
    const { fee } = feeStore;

    return (
      <Segment basic textAlign='center'>
        <Header
          as='h2'
        >
          TERMS & CONDITIONS
        </Header>
        <div style={{
          fontSize: '1.3em',
          color: 'red',
          fontWeight: 'bold',
          lineHeight: '1.5em',
          margin: '1.5em 0'
        }}>
          <div>
            The Web3 Auction Terms & Conditions are important, detailed, and govern your transaction.
          </div>
          <div>
            Please read and understand them fully before proceeding.
          </div>
        </div>
        <div
          style={{
            maxHeight: 350,
            marginBottom: '2em',
            overflow: 'auto',
            textAlign: 'left'
          }}
          ref={this.setTermsRef}
        >
          <Segment>
            <TermsMD />
          </Segment>
        </div>

        <div style={{
          maxWidth: '40em',
          margin: '0 auto',
          textAlign: 'justify'
        }}>
          <div>
            <Checkbox
              disabled={!hitBottom}
              label={`I confirm that I have read and agreed to the Terms & Conditions`}
              checked={termsAccepted}
              onChange={this.handleTermsChecked}
              style={{ marginBottom: '1em' }}
            />
          </div>

          <div>
            <Checkbox
              disabled={!hitBottom}
              label={`
                I confirm that I am not a citizen or resident of the People's Republic of
                China or the United States (我确定自己非中国公民，也非美国公民。)
              `}
              checked={citizenAccepted}
              onChange={this.handleCitizenChecked}
              style={{ marginBottom: '1em' }}
            />
          </div>

          <div>
            <Checkbox
              disabled={!hitBottom}
              label={`
                I confirm that I agree to pay a fee of ${fromWei(fee).toFormat()} Ether for the certification process
                in the event that my Ethereum wallet has not already been certified through PICOPS.
              `}
              checked={spendingAccepted}
              onChange={this.handleSpendingChecked}
              style={{ marginBottom: '3em' }}
            />
          </div>
        </div>

        <Button
          disabled={!termsAccepted || !spendingAccepted || !citizenAccepted}
          onClick={this.handleContinue}
          primary
          size='big'
          style={{ marginBottom: '-1em' }}
        >
          Continue
        </Button>
      </Segment>
    );
  }

  setTermsRef = (element) => {
    if (element) {
      element.addEventListener('scroll', this.handleScroll);
    }
  };

  handleContinue = () => {
    appStore.storeTermsAccepted();
    appStore.goto('country-selection');
  };

  handleScroll = (event) => {
    const { clientHeight, scrollHeight, scrollTop } = event.target;
    const scroll = scrollTop + clientHeight;
    const height = scrollHeight;
    // Precise at +-1%
    const atBottom = Math.abs(scroll - height) / height <= 0.01;

    if (atBottom) {
      this.setState({ hitBottom: true });
      event.target.removeEventListener('scroll', this.handleScroll);
    }
  };

  handleCitizenChecked = (_, { checked }) => {
    appStore.setCitizenChecked(checked);
  };

  handleSpendingChecked = (_, { checked }) => {
    appStore.setSpendingChecked(checked);
  };

  handleTermsChecked = (_, { checked }) => {
    appStore.setTermsAccepted(checked);
  };
}
