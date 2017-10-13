import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Container, Header, Segment } from 'semantic-ui-react';

import appStore, { STEPS } from '../stores/app.store';
import stepperStore from '../stores/stepper.store';

import BigStepper from './BigStepper.js';
import Footer from './Footer';
import MainLogo from '../images/MainLogo.svg';
import Stepper from './Stepper';

const baseContentStyle = {
  backgroundColor: 'white',
  padding: '4em 2.5em 3em'
};

const headerStyle = {
  padding: '1.5em 2em'
};

const mainLogoStyle = {
  height: '3em'
};

@observer
export default class AppContainer extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,

    footer: PropTypes.node,
    header: PropTypes.node,
    style: PropTypes.object,
    hideStepper: PropTypes.bool
  };

  static defaultProps = {
    padded: true,
    style: {}
  };

  render () {
    const { hideStepper } = this.props;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ paddingBottom: '4em', flex: '1 1 auto' }}>
          <div style={headerStyle}>
            <img src={MainLogo} style={mainLogoStyle} />
          </div>
          {
            hideStepper
              ? null
              : (
                <div style={{ paddingTop: '0em' }}>
                  <BigStepper />
                </div>
              )
          }
          {this.renderContent()}
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <Footer />
        </div>
      </div>
    );
  }

  renderContent () {
    const { hideStepper, children, header, footer } = this.props;
    const noPadding = appStore.step === STEPS['picops'];

    const style = {
      textAlign: 'left'
    };

    const { title } = stepperStore;
    const contentStyle = Object.assign({}, baseContentStyle, this.props.style);
    const titleNode = title
      ? <Header as='h4' style={{ marginTop: '2em' }}>{title}</Header>
      : <div style={{ marginTop: hideStepper ? '2em' : '4em' }} />;

    return (
      <div>
        <Container style={style}>
          {titleNode}
          {header || null}
          <Stepper />
          {
            noPadding
              ? null
              : (
                <Segment basic style={contentStyle}>
                  {children}
                </Segment>
              )
          }
          {footer || null}
        </Container>
        {
          noPadding
            ? children
            : null
        }
      </div>
    );
  }
}
