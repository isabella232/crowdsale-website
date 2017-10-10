import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import { Button, Header, Icon } from 'semantic-ui-react';

import accountStore from '../../../stores/account.store';
import appStore from '../../../stores/app.store';

const dropzoneStyle = {
  width: '25em',
  height: '15em',
  borderWidth: '2px',
  borderColor: 'rgb(102, 102, 102)',
  borderStyle: 'dashed',
  borderRadius: '5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '3em auto 0',
  padding: '2em',
  textAlign: 'center',
  cursor: 'pointer',
  fontSize: '1.25em'
};

export default class Upload extends Component {
  render () {
    return (
      <div>
        <Header as='h2' textAlign='center'>
          LOAD YOUR WALLET
        </Header>

        <Dropzone onDrop={this.handleDrop} style={dropzoneStyle}>
          <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
            <Icon name='file text outline' size='huge' />
            <br />
            <br />
            <p style={{ margin: 0 }}>
              Drop your Ethereum JSON wallet file here or click to upload.
            </p>
          </div>
        </Dropzone>

        <br />
        <br />

        <div style={{ textAlign: 'center' }}>
          <Button onClick={this.handleCancel} size='big' secondary>
            Back
          </Button>
        </div>
      </div>
    );
  }

  handleCancel = () => {
    appStore.goto('account-selection');
  };

  handleDrop = (files) => {
    if (files.length === 0) {
      return;
    }

    if (files[0].size > 2048) {
      return appStore.addError(new Error('The provided file is too big.'));
    }

    const reader = new FileReader();

    reader.readAsText(files[0]);
    reader.onload = (event) => {
      const content = event.target.result;

      try {
        if (content.length > 2048) {
          throw new Error('file too big: ' + content.length);
        }

        const json = JSON.parse(content);

        if (!json || !json.address || !json.crypto || !json.crypto.kdf) {
          throw new Error('wrong json');
        }

        if (json.version !== 3) {
          throw new Error('wrong wallet version');
        }

        accountStore.setJSONWallet(json);
        appStore.goto('unlock-account');
      } catch (error) {
        console.error(error, content);
        appStore.addError(new Error('Invalid file format.'));
      }
    };
  };
}
