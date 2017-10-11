import React, { Component } from 'react';

import Chart from './chart';

export default class ChartContainer extends Component {
  render () {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        padding: '2em'
      }}>
        <Chart />
      </div>
    );
  }
}
