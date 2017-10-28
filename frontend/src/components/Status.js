import { observer } from 'mobx-react';
import React, { Component } from 'react';
import Moment from 'react-moment';
import { Portal, Popup } from 'semantic-ui-react';

import auctionStore from '../stores/auction.store';

const strokeWidth = 5;

@observer
export default class Status extends Component {
  getPathDescription () {
    const radius = 50 - strokeWidth;

    return `
      M 50,50 m 0,-${radius}
      a ${radius},${radius} 0 1 1 0,${2 * radius}
      a ${radius},${radius} 0 1 1 0,-${2 * radius}
    `;
  }

  render () {
    if (!auctionStore.loaded) {
      return null;
    }

    return (
      <Portal open>
        <div style={{
          cursor: 'pointer',
          position: 'absolute', top: 0, right: 0,
          margin: '1em',
          textAlign: 'left',
          width: '4em'
        }}>
          <Popup
            trigger={(
              <a target='_blank' href='/#/chart'>
                {this.renderProgress()}
              </a>
            )}
            content={this.renderContent()}
            hoverable
          />
        </div>
      </Portal>
    );
  }

  renderProgress () {
    const { tokenCap, tokensAvailable } = auctionStore;
    const percentage = 100 - tokensAvailable.div(tokenCap).mul(100).toNumber();

    const pathDescription = this.getPathDescription();

    const diameter = Math.PI * 2 * 50 - strokeWidth;
    const progressStyle = {
      strokeDasharray: `${diameter}px ${diameter}px`,
      strokeDashoffset: `${((100 - percentage) / 100 * diameter)}px`
    };

    return (
      <svg
        style={{
          width: '100%'
        }}
        viewBox='0 0 100 100'
      >
        <circle
          fill='#ffffff'
          cx={50}
          cy={50}
          r={48}
        />

        <path
          d={pathDescription}
          stroke='#d6d6d6'
          strokeWidth={strokeWidth}
          fillOpacity={0}
        />

        <path
          d={pathDescription}
          strokeWidth={strokeWidth}
          stroke='#3e98c7'
          fillOpacity={0}
          style={progressStyle}
        />

        <text
          x={50}
          y={50}
          style={{
            fill: '#000',
            fontSize: '1.75em',
            dominantBaseline: 'central',
            textAnchor: 'middle'
          }}
        >
          {this.renderPercentage(percentage)}%
        </text>
        }
      </svg>
    );
  }

  renderPercentage (percentage) {
    if (percentage < 1) {
      return Math.round(percentage * 100) / 100;
    }

    if (percentage < 10) {
      return Math.round(percentage * 10) / 10;
    }

    return Math.round(percentage);
  }

  renderContent () {
    const { DIVISOR, endTime, tokensAvailable } = auctionStore;
    const formattedTA = tokensAvailable.div(DIVISOR);

    return (
      <div>
        <div>
          The auction has ended.
        </div>
      </div>
    );
  }
}
