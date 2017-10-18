import EthereumWallet from 'ethereumjs-wallet';
import keycode from 'keycode';
import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Button, Input } from 'semantic-ui-react';

import accountStore from '../../../stores/account.store';
import appStore from '../../../stores/app.store';
import Logger from '../../../logger';

import AccountInfo from '../../AccountInfo';
import Step from '../../Step';

const logger = Logger('AccountLoader/Unlock');

@observer
export default class Unlock extends Component {
  state = {
    password: '',
    showPassword: false,
    loading: false
  };

  render () {
    const { jsonWallet, unlocking } = accountStore;
    const { showPassword, password, loading } = this.state;

    if (!jsonWallet) {
      return null;
    }

    return (
      <Step
        title="ENTER YOUR WALLET'S PASSWORD"
        description={(
          <div>
            <p>
              For transactions to be signed, please unlock your account with your password.
            </p>
            <p>
              <b>
                Your password is not uploaded to any server
                or handled by any third party.
              </b>
            </p>
          </div>
        )}
      >
        <div>
          <AccountInfo
            address={`0x${jsonWallet.address}`}
            showCertified={false}
          />
          <br />
          <br />
          <p><b>
            Please enter your password:
          </b></p>
          <Input
            action={{
              icon: 'eye',
              onKeyDown: this.handleShowPassword,
              onKeyUp: this.handleHidePassword,
              onMouseDown: this.handleShowPassword,
              onMouseLeave: this.handleHidePassword,
              onBlur: this.handleHidePassword,
              onMouseUp: this.handleHidePassword
            }}
            fluid
            onChange={this.handlePasswordChange}
            onKeyUp={this.handlePasswordKeyUp}
            placeholder='Enter your password...'
            ref={this.setPasswordRef}
            type={showPassword ? 'text' : 'password'}
            value={password}
          />
          <br /><br />
          <div style={{ textAlign: 'right' }}>
            {
              unlocking
                ? (
                  <Button
                    secondary
                    content='Restart'
                    onClick={this.handleRestart}
                  />
                )
                : null
            }
            <Button
              color='green'
              content={unlocking ? 'Continue' : 'Proceed'}
              loading={loading}
              onClick={this.handleUnlock}
            />
          </div>
        </div>
      </Step>
    );
  }

  handleHidePassword = () => {
    this.setState({ showPassword: false });
  };

  handleShowPassword = () => {
    this.setState({ showPassword: true });
  };

  handlePasswordChange = (_, { value }) => {
    this.setState({ password: value });
  };

  handlePasswordKeyUp = (event) => {
    const code = keycode(event);

    if (code === 'enter') {
      return this.handleUnlock();
    }
  };

  handleRestart = () => {
    accountStore.restart();
  };

  handleUnlock = async () => {
    if (this.errorId) {
      appStore.removeMessage(this.errorId);
    }

    this.setState({ loading: true });

    const { jsonWallet } = accountStore;
    const { password } = this.state;

    setTimeout(async () => {
      try {
        const wallet = EthereumWallet.fromV3(jsonWallet, password);
        const privateKey = '0x' + wallet.getPrivateKey().toString('hex');

        try {
          appStore.revertableSteps = 2;
          await accountStore.setAccount({ address: wallet.getChecksumAddressString(), privateKey });
          await accountStore.gotoContribute();
        } catch (error) {
          appStore.addError(error);
        }
      } catch (error) {
        logger.error(error);
        this.errorId = appStore.addError(new Error('Failed to unlock your wallet. The password might be wrong.'));
        this.setState({ loading: false });
      }
    });
  };

  setPasswordRef = (inputElement) => {
    if (inputElement) {
      inputElement.focus();
    }
  };
}
