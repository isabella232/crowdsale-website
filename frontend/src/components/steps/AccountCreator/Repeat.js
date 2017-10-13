import keycode from 'keycode';
import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Form, Grid, Header } from 'semantic-ui-react';

import accountCreator from './accountCreator.store';
import history from '../../../stores/history';

@observer
export default class Repeat extends Component {
  state = {
    recoveryRepeat: ''
  };

  valid () {
    const { recoveryRepeat } = this.state;

    return (recoveryRepeat.trim() === accountCreator.phrase);
  }

  render () {
    const { recoveryRepeat } = this.state;
    const valid = this.valid();

    return (
      <Grid>
        <Grid.Column width={6}>
          <Header as='h3'>
            REPEAT YOUR RECOVERY PHRASE
          </Header>
          <div style={{ lineHeight: '2em' }}>
            <p>
              <b>We were serious when we reminded you: write your
              recovery phrase down.</b> Please repeat your recovery phrase
              in the box to the right.
            </p>
          </div>
        </Grid.Column>
        <Grid.Column width={10}>
          <Header as='h4'>
            Your recovery phrase
          </Header>

          <Form onSubmit={this.handleNext}>
            <div ref={this.setFocus}>
              <Form.TextArea
                onChange={this.handleRecoveryRepeatChange}
                onKeyUp={this.handleKeyUp}
                value={recoveryRepeat}
                ref={this.setFocus}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1em' }}>
              <Form.Button type='button' onClick={this.handleBack} secondary>
                Back
              </Form.Button>

              <Form.Button
                type='submit'
                primary
                disabled={!valid}
              >
                Next
              </Form.Button>
            </div>
          </Form>
        </Grid.Column>
      </Grid>
    );
  }

  handleBack = (event) => {
    if (event) {
      event.preventDefault();
    }

    history.goBack();
  };

  handleKeyUp = (event) => {
    const key = keycode(event);

    if (event.ctrlKey && key === 'enter') {
      this.handleNext();
    }
  };

  handleNext = async (event) => {
    if (event) {
      event.preventDefault();
    }

    history.push('/', { goto: 'create-account-download' });
  };

  handleRecoveryRepeatChange = (_, { value }) => {
    this.setState({ recoveryRepeat: value });
  };

  setFocus = (element) => {
    if (!element) {
      return;
    }

    const textarea = element.querySelector('textarea');

    if (textarea) {
      return textarea.focus();
    }
  };
}
