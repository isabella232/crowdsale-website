import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Container, Segment } from 'semantic-ui-react';

import Footer from './Footer';
import MainLogo from '../images/MainLogo.svg';

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

export default class AppContainer extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,

    footer: PropTypes.node,
    header: PropTypes.node,
    style: PropTypes.object
  };

  static defaultProps = {
    padded: true,
    style: {}
  };

  render () {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ paddingBottom: '4em', flex: '1 1 auto' }}>
          <div style={headerStyle}>
            <img src={MainLogo} style={mainLogoStyle} />
          </div>
          {this.renderContent()}
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <Footer />
        </div>
      </div>
    );
  }

  renderContent () {
    const { children, header, footer } = this.props;

    const style = {
      textAlign: 'left'
    };

    const contentStyle = Object.assign({}, baseContentStyle, this.props.style);

    return (
      <div>
        <Container style={style}>
          <div style={{ marginTop: '1em' }} />
          {header || null}
          <Segment basic style={contentStyle}>
            {children}
          </Segment>
          {footer || null}
        </Container>
      </div>
    );
  }
}
