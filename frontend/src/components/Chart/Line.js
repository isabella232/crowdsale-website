import PropTypes from 'prop-types';
import React from 'react';
import * as d3 from 'd3';

const Line = (props) => {
  const { color, dashed, from, to, scales, width } = props;
  const line = d3.line()
    .x((datum) => scales[0](datum.x))
    .y((datum) => scales[1](datum.y))
    .curve(d3.curveLinear);

  return (
    <path
      d={line([
        { x: from[0], y: from[1] },
        { x: to[0], y: to[1] }
      ])}
      fill='none'
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dashed ? '3 3' : ''}
    />
  );
};

Line.propTypes = {
  color: PropTypes.string.isRequired,
  from: PropTypes.array.isRequired,
  to: PropTypes.array.isRequired,
  scales: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired,

  dashed: PropTypes.bool
};

Line.defaultProps = {
  dashed: false
};

export default Line;
