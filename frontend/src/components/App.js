import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { HashRouter as Router, Route } from 'react-router-dom';
import { Header, Loader } from 'semantic-ui-react';

import AppContainer from './AppContainer';
import AccountCreator from './steps/AccountCreator';
import AccountLoader from './steps/AccountLoader';
import AccountSelection from './steps/AccountSelection';
import Contribute from './steps/Contribute';
import CountrySelection from './steps/CountrySelection';
import FeePayment from './steps/FeePayment';
import ImportantNotice from './steps/ImportantNotice';
import LateUncertified from './steps/LateUncertified';
import Payment from './steps/Payment';
import Picops from './steps/Picops';
import PicopsCountrySelection from './steps/PicopsCountrySelection';
import PicopsTerms from './steps/PicopsTerms';
import Purchase from './steps/Purchase';
import Start from './steps/Start';
import Summary from './steps/Summary';
import Terms from './steps/Terms';

import ChartView from './ChartView';
import InactiveAuction from './InactiveAuction';
import DotsQuery from './DotsQuery';
import Messages from './Messages';
import Status from './Status';
import Warning from './Warning';

import appStore, { STEPS } from '../stores/app.store';
import auctionStore from '../stores/auction.store';

@observer
export default class App extends Component {
  render () {
    return (
      <Router>
        <div>
          <Route exact path='/dots' component={DotsQuery} />
          <Route exact path='/chart' component={ChartView} />
          <Route exact path='/' component={MainApp} />
          <Messages />
        </div>
      </Router>
    );
  }
}

@observer
class MainApp extends Component {
  render () {
    return (
      <AppContainer
        hideStepper={!auctionStore.isActive() || auctionStore.halted}
      >
        {this.renderContent()}
      </AppContainer>
    );
  }

  renderContent () {
    const { loading, step } = appStore;

    if (loading) {
      return (
        <div style={{ textAlign: 'center' }}>
          <Loader active inline='centered' size='huge' />

          <Header as='h2'>
            Loading data...
          </Header>
        </div>
      );
    }

    if (!auctionStore.isActive() || auctionStore.halted) {
      return (
        <InactiveAuction />
      );
    }

    return (
      <div>
        <Status />
        <Warning />
        {this.renderStep(step)}
      </div>
    );
  }

  renderStep (step) {
    switch (step) {
      case STEPS['important-notice']:
        return (<ImportantNotice />);

      case STEPS['start']:
        return (<Start />);

      case STEPS['terms']:
        return (<Terms />);

      case STEPS['country-selection']:
        return (<CountrySelection />);

      case STEPS['account-selection']:
        return (<AccountSelection />);

      case STEPS['load-account']:
        return (<AccountLoader.Upload />);

      case STEPS['unlock-account']:
        return (<AccountLoader.Unlock />);

      case STEPS['create-account-password']:
        return (<AccountCreator.Password />);

      case STEPS['create-account-recovery']:
        return (<AccountCreator.Recovery />);

      case STEPS['create-account-repeat']:
        return (<AccountCreator.Repeat />);

      case STEPS['create-account-download']:
        return (<AccountCreator.Download />);

      case STEPS['contribute']:
        return (<Contribute />);

      case STEPS['payment']:
        return (<Payment />);

      case STEPS['fee-payment']:
        return (<FeePayment />);

      case STEPS['picops-terms']:
        return (<PicopsTerms />);

      case STEPS['picops-country-selection']:
        return (<PicopsCountrySelection />);

      case STEPS['picops']:
        return (<Picops />);

      case STEPS['purchase']:
        return (<Purchase />);

      case STEPS['summary']:
        return (<Summary />);

      case STEPS['late-uncertified']:
        return (<LateUncertified />);

      default:
        return null;
    }
  }
}
