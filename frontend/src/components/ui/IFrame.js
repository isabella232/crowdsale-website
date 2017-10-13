import { iframeResizer } from 'iframe-resizer';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

export default class IFrame extends Component {
  static propTypes = {
    onMessage: PropTypes.func.isRequired,
    src: PropTypes.string.isRequired
  };

  componentWillMount () {
    window.addEventListener('message', this.listener, false);
  }

  componentWillUnmount () {
    window.removeEventListener('message', this.listener, false);

    if (this.iframe) {
      const { iFrameResizer } = this.iframe;

      // should close after React has deleted the node,
      // otherwise React throws an error on unmounting
      // since `iFrameResizer.close` removes the node
      // manually
      setTimeout(() => {
        if (iFrameResizer && iFrameResizer.close) {
          iFrameResizer.close();
        }
      }, 1000);
    }
  }

  render () {
    const { src } = this.props;

    return (
      <iframe
        frameBorder={0}
        src={src}
        style={{
          minHeight: '350px',
          width: '100%',
          position: 'relative',
          bottom: 0,
          left: 0,
          right: 0,
          top: 0
        }}
        onLoad={this.iFrameResize}
        ref={this.setIframeRef}
        scrolling='yes'
      />
    );
  }

  listener = (event) => {
    let message = {};

    // iFrameSizer events
    if (/iFrameSizer/.test(event.data)) {
      return;
    }

    try {
      message = JSON.parse(event.data);
    } catch (error) {
      return console.warn('could not parse JSON', event.data);
    }

    this.props.onMessage(event, message);
  };

  iFrameResize = () => {
    if (!this.iframe) {
      return;
    }

    iframeResizer({
      log: false,
      heightCalculationMethod: 'taggedElement',
      scrolling: 'yes'
    }, this.iframe);

    // Resize every 250ms for the next 4s
    const interval = setInterval(() => {
      if (!this.iframe || !this.iframe.iFrameResizer || !this.iframe.iFrameResizer.resize) {
        return clearInterval(interval);
      }

      this.iframe.iFrameResizer.resize();
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
    }, 4000);
  };

  setIframeRef = (iframe) => {
    this.iframe = iframe;
  };
}
