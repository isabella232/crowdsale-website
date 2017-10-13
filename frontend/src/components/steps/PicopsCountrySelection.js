import React, { Component } from 'react';

import IFrame from '../ui/IFrame';
import picopsBackend from '../../picops-backend';
import appStore from '../../stores/app.store';

export default class PicopsCountrySelection extends Component {
  render () {
    return (
      <IFrame
        onMessage={this.handleMessage}
        src={`${picopsBackend.baseUrl}/?no-padding&blacklist[]=CHN#/country-selection`}
      />
    );
  }

  handleMessage = (_, message) => {
    if (message.action !== 'selected-country') {
      return;
    }

    const { country } = message;

    console.warn('selected country', country);
    appStore.goto('contribute');
  };
}
