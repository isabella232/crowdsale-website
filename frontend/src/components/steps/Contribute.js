import BigNumber from 'bignumber.js';
import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Button, Header, Input } from 'semantic-ui-react';

import { fromWei, toWei } from '../../utils';

import accountStore from '../../stores/account.store';
import auctionStore from '../../stores/auction.store';
import buyStore from '../../stores/buy.store';
import feeStore from '../../stores/fee.store';
import appStore from '../../stores/app.store';
import AccountInfo from '../AccountInfo';
import Step from '../Step';

@observer
export default class AccountLoader extends Component {
  state = {
    dots: new BigNumber(0)
  };

  render () {
    const { address, balance, missingWei, spending } = accountStore;
    const { DUST_LIMIT, maxSpendable } = auctionStore;

    return (
      <Step
        title='ADD CONTRIBUTION TO WALLET'
        description={(
          <div>
            <p>
              Please confirm how much ETH you would like to contribute to the auction.
            </p>

            <p>
              At the end of the auction, you will be able to check the amount of DOTs
              you received with your public Ethereum address.
            </p>

            <p style={{ color: 'red', fontWeight: 'bold' }}>
              Be advised that by clicking forward you will not be able to change the
              amount contributed to the auction. If you still need to certify, your
              contribution will only be debited after certification.
            </p>
          </div>
        )}
      >
        <div>
          <Header as='h3'>
            Your Ethereum address
          </Header>

          {
            missingWei.gt(0) || balance.eq(0)
              ? (
                <div>
                  You will need to transfer the desired funds to the Ethereum address below.
                </div>
              )
              : null
          }

          <AccountInfo
            address={address}
          />

          <div style={{ marginTop: '0.5em' }}>
            <span>
              How much ETH would you like to contribute?
            </span>
            <Input
              label='ETH'
              labelPosition='right'
              onChange={this.handleSpendChange}
              ref={this.setInputRef}
              style={{
                marginLeft: '1.5em',
                width: '6.5em'
              }}
              type='number'
              min={fromWei(DUST_LIMIT).toNumber()}
              max={fromWei(maxSpendable).toNumber()}
              step={0.01}
              defaultValue={fromWei(spending).toNumber()}
            />
          </div>
          {
            spending.gte(DUST_LIMIT)
              ? spending.lt(maxSpendable)
                ? (
                  <div>
                    {this.renderSending()}
                    {this.renderFee()}
                  </div>
                )
                : (
                  <div style={{ color: 'red', fontSize: '1em', marginTop: '1em' }}>
                    You cannot spend more than {fromWei(maxSpendable).toFormat(5)} ETH
                  </div>
                )
              : (
                <div style={{ color: 'red', fontSize: '1em', marginTop: '1em' }}>
                  You should spend at least {fromWei(DUST_LIMIT).toFormat()} ETH
                </div>
              )
          }
          {this.renderAction()}
        </div>
      </Step>
    );
  }

  renderAction () {
    const { DUST_LIMIT } = auctionStore;
    const { certified, missingWei, spending } = accountStore;

    return (
      <div style={{ textAlign: 'right', marginTop: '1.5em' }}>
        <Button primary onClick={this.handleContinue} disabled={!spending || spending.eq(0) || spending.lt(DUST_LIMIT)}>
          {
            missingWei.eq(0)
              ? (certified ? 'Contribute' : 'Certify your identity')
              : 'Continue'
          }
        </Button>
      </div>
    );
  }

  renderFee () {
    const { certified, paid } = accountStore;
    const { fee } = feeStore;

    if (!fee) {
      console.warn('no total fee set...');
      return;
    }

    let txFees = buyStore.totalGas;
    const willPayFee = !certified || !paid;

    if (willPayFee) {
      txFees = txFees.add(feeStore.txFee || 0);
    }

    return (
      <div style={{ color: 'gray', fontSize: '1em' }}>
        {
          willPayFee
            ? (
              <div style={{ marginTop: '0.5em' }}>Additional certification fee will be {fromWei(fee).toFormat()} ETH. </div>
            )
            : null
        }
        <div style={{ marginTop: '0.5em' }}>
          Addtional transaction fee{willPayFee ? <span>s</span> : null} will be {fromWei(txFees).toFormat()} ETH.
        </div>
      </div>
    );
  }

  renderSending () {
    const { spending } = accountStore;
    const { dots } = this.state;

    if (!dots) {
      return null;
    }

    return (
      <div style={{ marginTop: '1.5em', color: 'gray' }}>
        By spending {fromWei(spending).toFormat()} ETH you will receive at least {dots.toFormat()} DOTs.
      </div>
    );
  }

  handleContinue = async () => {
    const { spending } = accountStore;

    if (!spending || spending.eq(0)) {
      return;
    }

    try {
      await accountStore.checkPayment();
    } catch (error) {
      appStore.addError(error);
    }
  };

  handleSpendChange = async (_, { value }) => {
    let spending = new BigNumber(0);
    let dots = null;

    try {
      spending = new BigNumber(value);
      dots = auctionStore.weiToDot(toWei(spending));
    } catch (error) {
    }

    accountStore.setSpending(toWei(spending));
    this.setState({ dots });
  };

  setInputRef = (inputElement) => {
    if (inputElement) {
      inputElement.focus();
    }
  };
}
