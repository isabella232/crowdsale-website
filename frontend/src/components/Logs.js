import copy from 'copy-to-clipboard';
import React, { Component } from 'react';
import { Button, Header } from 'semantic-ui-react';

import AppContainer from './AppContainer';
import { logger } from '../logger';

const logStyle = {
  display: 'flex',
  fontFamily: 'monospace',
  marginBottom: '0.25em'
};

const logStyles = {
  error: Object.assign({ backgroundColor: '#FFF0F0', color: '#FF9999' }, logStyle),
  warn: Object.assign({ backgroundColor: '#FFFBE6' }, logStyle),
  info: Object.assign({}, logStyle),
  log: Object.assign({}, logStyle)
};

const dateStyle = {
  fontSize: '0.8em',
  color: 'gray',
  flex: '0 0 auto',
  marginRight: '0.5em'
};

const messageStyle = {
  fontSize: '0.9em'
};

export default class Logs extends Component {
  state = {
    copied: false,
    logs: []
  };

  componentWillMount () {
    this.update();
    logger.on('log', this.update);
  }

  componentWillUnmount () {
    clearTimeout(this.timeoutId);
  }

  render () {
    const { copied } = this.state;

    return (
      <AppContainer
        hideStepper
        header={(
          <Header>
            VIEW CONSOLE LOGS
          </Header>
        )}
        style={{
          padding: '2em 2.5em'
        }}
      >
        <div style={{ textAlign: 'center', margin: '0 0 1em' }}>
          <Button disabled={copied} primary basic onClick={this.handleCopy}>
            {copied ? 'Copied' : 'Copy' }
          </Button>
          <Button secondary basic onClick={this.handleClear}>
            Clear
          </Button>
        </div>
        {this.renderLogs()}
      </AppContainer>
    );
  }

  renderLogs () {
    const { logs } = this.state;

    if (logs.length === 0) {
      return (
        <div>
          No logs available..
        </div>
      );
    }

    return (
      <div>
        {logs.map((log, index) => this.renderLog(log, index))}
      </div>
    );
  }

  renderLog (log, index) {
    const { level, msg } = log;
    const style = logStyles[level];

    return (
      <div key={index} style={style}>
        <span style={dateStyle}>[{new Date(log.date).toISOString()}]</span>
        <span style={messageStyle}>{msg}</span>
      </div>
    );
  }

  update = () => {
    const logs = logger.getLogs().sort((lA, lB) => lB.date - lA.date);

    this.setState({ logs });
  };

  handleClear = () => {
    logger.clearLogs();
    this.update();
  };

  handleCopy = () => {
    const { logs } = this.state;
    const string = JSON.stringify(logs);

    copy(string);
    this.setState({ copied: true });
    setTimeout(() => {
      this.setState({ copied: false });
    }, 1500);
  };
}
