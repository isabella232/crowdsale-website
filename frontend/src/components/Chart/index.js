import React, { Component } from 'react';

import Chart from './chart';

export default class ChartContainer extends Component {
  render () {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        width: '200px',
        margin: '0 auto'
      }}>
        <Chart />
      </div>
    );
  }
}
