import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Form, Grid, Header } from 'semantic-ui-react';

import accountCreator from './accountCreator.store';
import history from '../../../stores/history';

@observer
export default class Password extends Component {
  state = {
    passwordRepeat: ''
  };

  valid () {
    const { password } = accountCreator;
    const { passwordRepeat } = this.state;

    return (password.length >= 2 && password === passwordRepeat);
  }

  render () {
    const { password } = accountCreator;
    const { passwordRepeat } = this.state;
    const valid = this.valid();

    return (
      <Grid>
        <Grid.Column width={6}>
          <Header as='h3'>
            CHOOSE YOUR PASSWORD
          </Header>
          <div style={{ lineHeight: '2em' }}>
            <p>
              Choose a unique and secure password. Write it down and
              keep it safe. You will need it to unlock access your wallet.
            </p>
          </div>
        </Grid.Column>
        <Grid.Column width={10}>
          <Form onSubmit={this.handleNext}>
            <div ref={this.setFocus}>
              <Form.Input
                label='Choose your password'
                id='account-password'
                onChange={this.handlePasswordChange}
                type='password'
                value={password}
              />

              <Form.Input
                label='Repeat your password'
                id='account-repeat-password'
                onChange={this.handlePasswordRepeatChange}
                type='password'
                value={passwordRepeat}
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

  handleNext = async (event) => {
    if (event) {
      event.preventDefault();
    }

    history.push('/', { goto: 'create-account-recovery' });
  };

  handlePasswordChange = (_, { value }) => {
    accountCreator.setPassword(value);
  };

  handlePasswordRepeatChange = (_, { value }) => {
    this.setState({ passwordRepeat: value });
  };

  setFocus = (element) => {
    if (!element) {
      return;
    }

    const input = element.querySelector('input');

    if (input) {
      return input.focus();
    }
  };
}
