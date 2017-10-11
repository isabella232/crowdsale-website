import PropTypes from 'prop-types';
import React from 'react';
import styled, { keyframes } from 'styled-components';

import { target as targetColor, raised as raisedColor } from './colors';

const animate = false;

const animation = keyframes`
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.1);
  }
  50% {
    transform: scale(1);
  }
  75% {
    transform: scale(1.1);
  }
`;

const AnimatedCircle = animate
  ? styled.g`
    animation: ${animation} 2s cubic-bezier(0.4, 0, 1, 1) infinite;
    transform-origin: center center;
  `
  : styled.g``;

const DotPair = (props) => {
  const { animated, datum, plain, r, xScale, yScale } = props;

  const defaultProps = plain
    ? {}
    : {
      fill: 'none',
      strokeWidth: 1
    };

  const raisedProps = plain
    ? { ...defaultProps, fill: raisedColor }
    : { ...defaultProps, stroke: raisedColor };

  const targetProps = plain
    ? { ...defaultProps, fill: targetColor }
    : { ...defaultProps, stroke: targetColor };

  const circles = [
    <circle
      cx={xScale(datum.time)}
      cy={yScale(datum.raised)}
      r={r}
      {...raisedProps}
    />,
    <circle
      cx={xScale(datum.time)}
      cy={yScale(datum.target)}
      r={r}
      {...targetProps}
    />
  ];

  if (!animated) {
    return (
      <g>
        {circles[0]}
        {circles[1]}
      </g>
    );
  }

  return (
    <g>
      <AnimatedCircle>{circles[0]}</AnimatedCircle>
      <AnimatedCircle>{circles[1]}</AnimatedCircle>
    </g>
  );
};

DotPair.propTypes = {
  datum: PropTypes.object.isRequired,
  r: PropTypes.number.isRequired,
  xScale: PropTypes.func.isRequired,
  yScale: PropTypes.func.isRequired,

  animated: PropTypes.bool,
  plain: PropTypes.bool
};

DotPair.defaultProps = {
  animated: false,
  plain: true
};

export default DotPair;
