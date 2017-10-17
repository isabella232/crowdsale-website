import PropTypes from 'prop-types';
import React, { Component } from 'react';

import auctionStore from '../../stores/auction.store';

import DotPair from './DotPair';
import Line from './Line';

export default class PointedElement extends Component {
  static propTypes = {
    data: PropTypes.array.isRequired,
    xScale: PropTypes.func.isRequired,
    yScale: PropTypes.func.isRequired,

    mouse: PropTypes.object
  };

  render () {
    const { data, mouse, xScale, yScale } = this.props;

    if (!mouse) {
      return null;
    }

    const { beginTime, now } = auctionStore;
    const time = xScale.invert(mouse.x);
    const yDomain = yScale.domain();
    const datum = data.find((d) => d.time >= time);

    if (!datum || time < beginTime || time > now) {
      return null;
    }

    return (
      <g>
        <Line
          color='lightgray'
          dashed
          from={[ datum.time, yDomain[1] ]}
          to={[ datum.time, yDomain[0] ]}
          scales={[ xScale, yScale ]}
          width={2}
        />

        <DotPair
          datum={datum}
          r={3}
          xScale={xScale}
          yScale={yScale}
        />
      </g>
    );
  }
}
