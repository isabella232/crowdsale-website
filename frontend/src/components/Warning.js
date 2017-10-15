import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Message, Portal } from 'semantic-ui-react';

import auctionStore from '../stores/auction.store';

const messageStyle = {
  margin: '0.5em 1em',
  width: '500px'
};

@observer
export default class Warning extends Component {
  render () {
    const { endTime, now } = auctionStore;

    if (endTime - now > 1000 * 3600) {
      return null;
    }

    return (
      <Portal open>
        <div style={{
          position: 'fixed', top: 0, right: 0,
          textAlign: 'left'
        }}>
          <div style={messageStyle}>
            <Message
              compact
              content={(
                <div style={{ marginTop: '0.5em' }}>
                  Any contribution you
                  send might not be processed. In case of such an
                  event, your wallet will not be debited. Your funds are safe.
                </div>
              )}
              warning
              header='The auction ends in less than 1 hour.'
              icon='warning'
            />
          </div>
        </div>
      </Portal>
    );
  }
}
