import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Moment from 'react-moment';
import styled from 'styled-components';
import * as d3 from 'd3';
import { Header, Loader } from 'semantic-ui-react';

import DotPair from './DotPair';
import Line from './Line';
import { LabelRaised, LabelTarget } from './Labels';

import auctionStore from '../../stores/auction.store';
import chartStore from './store';

const Container = styled.div`
  cursor: move;
  position: relative;
`;

const PointedLabelContainer = styled.span`
  position: absolute;
  transform: translate(-50%, -50%);
  text-align: center;
`;

const PointedLabel = styled.span`
  background-color: white;
  border: 1px solid lightgray;
  border-radius: 5px;
  display: block;
  font-size: 0.75rem;
  padding: 1px 5px;
  white-space: nowrap;
`;

class CustomChart extends Component {
  static propTypes = {
    data: PropTypes.array
  };

  state = {
    chart: null,
    mouse: null,
    xScale: null,
    yScale: null,
    xDomain: null,
    yDomain: null,
    size: {
      width: 400,
      height: 200
    }
  };

  componentWillMount () {
    window.addEventListener('resize', this.computeSize);
    this.computeScales();
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.computeSize);
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.data !== this.props.data) {
      this.computeScales();
    }
  }

  computeSize = () => {
    if (!this.containerRef) {
      return null;
    }

    const { width } = this.containerRef.getBoundingClientRect();
    const height = width * 0.75;

    this.setState({ size: { width, height } }, () => {
      this.computeScales();
    });
  };

  computeScales () {
    const { width, height } = this.state.size;
    const margins = { top: 20, right: 0, bottom: 80, left: 10 };

    const { data } = this.props;

    if (!data || data.length < 2) {
      return;
    }

    const { beginTime, endTime } = auctionStore;
    const lastTime = data[data.length - 1].time;
    const xMax = lastTime > beginTime.getTime()
      ? beginTime.getTime() + (lastTime - beginTime.getTime()) * 2
      : endTime;

    const xDomain = [
      beginTime.getTime(),
      xMax
    ];

    const yDomain = [
      Math.round(data[0].target) * 1.25,
      0
    ];

    const chartWidth = width - margins.left - margins.right;
    const chartHeight = height - margins.top - margins.bottom;

    let xScale = d3.scaleTime()
      .domain(xDomain)
      .range([ 0, chartWidth ]);

    const yScale = d3.scalePow()
      .exponent(0.15)
      .domain(yDomain)
      .range([ 0, chartHeight ]);

    const { transform } = this.state;

    if (transform) {
      xScale = transform.rescaleX(xScale);
    }

    this.setState({ xDomain, yDomain, xScale, yScale, chart: { width, height, margins } });
  }

  render () {
    const { data } = this.props;
    const { chart, xScale, yScale, xDomain, yDomain } = this.state;

    if (!chart) {
      return null;
    }

    const { width, height, margins } = chart;

    const targetLine = d3.line()
      .x((datum) => xScale(datum.time))
      .y((datum) => yScale(datum.raised))
      .curve(d3.curveLinear);

    const raisedLine = d3.line()
      .x((datum) => xScale(datum.time))
      .y((datum) => yScale(datum.target))
      .curve(d3.curveLinear);

    return (
      <div ref={this.setContainerRef}>
        <Container style={{ height, width }}>
          {this.renderNowLabels()}
          {this.renderPointedLabels()}

          <svg
            height={height}
            onMouseLeave={this.handleMouseLeave}
            onMouseMove={this.handleMouseMove}
            ref={this.setSVGRef}
            width={width}
          >
            <g transform={`translate(${margins.left},${margins.top})`}>

              <Line
                color='lightgray'
                from={[ xDomain[0], yDomain[0] ]}
                to={[ xDomain[0], yDomain[1] ]}
                scales={[ xScale, yScale ]}
                width={1}
              />
              <Line
                color='lightgray'
                from={[ xDomain[0], yDomain[1] ]}
                to={[ xDomain[1], yDomain[1] ]}
                scales={[ xScale, yScale ]}
                width={1}
              />
              <DotPair
                datum={data[0]}
                r={3}
                xScale={xScale}
                yScale={yScale}
              />

              <path
                d={raisedLine(data)}
                fill='none'
                stroke='gray'
                strokeWidth={2}
              />
              <path
                d={targetLine(data)}
                fill='none'
                stroke='red'
                strokeWidth={2}
              />

              <Line
                color='lightgray'
                dashed
                from={[ data[data.length - 1].time, data[data.length - 1].raised ]}
                to={[ data[data.length - 1].time, data[data.length - 1].target ]}
                scales={[ xScale, yScale ]}
                width={2}
              />

              <DotPair
                datum={data[data.length - 1]}
                r={4}
                xScale={xScale}
                yScale={yScale}
              />

              <DotPair
                animated
                datum={data[data.length - 1]}
                plain={false}
                r={7}
                xScale={xScale}
                yScale={yScale}
              />

              {this.renderPointedElements()}
            </g>
          </svg>
        </Container>
      </div>
    );
  }

  renderNowLabels () {
    const { data } = this.props;
    const { chart, xScale, yScale } = this.state;
    const { now } = auctionStore;
    const { margins } = chart;

    const minTime = xScale.invert(xScale(now) - 20);
    const maxTime = xScale.invert(xScale(now) - 10);
    const xDomain = xScale.domain();

    if (xDomain[1] < maxTime || xDomain[0] > minTime) {
      return null;
    }

    return (
      <span>
        <LabelTarget
          style={{
            left: xScale(data[data.length - 1].time) + margins.left,
            top: yScale(data[data.length - 1].target) + margins.top,
            border: '2px solid gray'
          }}
        >
          CURRENT CAP
        </LabelTarget>
        <LabelRaised
          style={{
            left: xScale(data[data.length - 1].time) + margins.left,
            top: yScale(data[data.length - 1].raised) + margins.top,
            border: '2px solid red'
          }}
        >
          CONTRIBUTED SO FAR*
        </LabelRaised>
      </span>
    );
  }

  renderPointedElements () {
    const { mouse, xScale, yScale } = this.state;

    if (!mouse) {
      return null;
    }

    const { beginTime, now } = auctionStore;
    const { data } = this.props;
    const time = xScale.invert(mouse.x);
    const datum = data.find((datum) => datum.time >= time);

    if (!datum || time < beginTime || time > now) {
      return null;
    }

    return (
      <g>
        <Line
          color='lightgray'
          dashed
          from={[ datum.time, data[0].target ]}
          to={[ datum.time, 0 ]}
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

  renderPointedLabels () {
    const { chart, mouse, xScale, yScale } = this.state;

    if (!mouse) {
      return null;
    }

    const { beginTime, now } = auctionStore;
    const { data } = this.props;
    const time = xScale.invert(mouse.x);
    const datum = data.find((datum) => datum.time >= time);

    if (!datum || time < beginTime || time > now) {
      return null;
    }

    const left = xScale(datum.time) + chart.margins.left;

    return (
      <span>
        <PointedLabelContainer style={{
          top: yScale(0) + chart.margins.top,
          left
        }}>
          <PointedLabel>
            <Moment format='L LT'>{datum.time}</Moment>
          </PointedLabel>
        </PointedLabelContainer>

        <PointedLabelContainer style={{
          fontSize: '0.85rem',
          top: yScale(data[0].target) + chart.margins.top,
          display: 'flex',
          flexDirection: 'column',
          left
        }}>
          <PointedLabel style={{
            borderColor: 'gray'
          }}>
            {this.renderFigure(datum.target)}
          </PointedLabel>

          <PointedLabel style={{
            borderColor: 'red',
            marginTop: '5px'
          }}>
            {this.renderFigure(datum.raised)}
          </PointedLabel>
        </PointedLabelContainer>
      </span>
    );
  }

  renderFigure (figure) {
    let fFigure = Math.round(figure * 100) / 100;
    let denom = '';

    if (figure >= Math.pow(10, 9)) {
      fFigure = Math.round(figure / Math.pow(10, 7)) / 100;
      denom = 'G';
    } else if (figure >= Math.pow(10, 6)) {
      fFigure = Math.round(figure / Math.pow(10, 4)) / 100;
      denom = 'M';
    } else if (figure >= Math.pow(10, 3)) {
      fFigure = Math.round(figure / Math.pow(10, 1)) / 100;
      denom = 'K';
    }

    return (
      <span>
        <b>{fFigure}</b> <small>{denom}</small>ETH
      </span>
    );
  }

  handleMouseMove = (event) => {
    if (!event || !this.svgRef || !this.state.chart) {
      return null;
    }

    const { margins } = this.state.chart;
    const targetBCR = this.svgRef.getBoundingClientRect();

    const x = event.clientX - targetBCR.left - margins.left;

    this.setState({ mouse: { x } });
  };

  handleMouseLeave = () => {
    this.setState({ mouse: null });
  };

  setContainerRef = (containerRef) => {
    this.containerRef = containerRef;

    this.computeSize();
  };

  setSVGRef = (svgRef) => {
    const { width, height } = this.state.chart;

    const zoom = d3
      .zoom()
      .scaleExtent([ 1, Infinity ])
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]])
      .on('zoom', this.zoomed);

    this.svgRef = svgRef;
    this.d3SvgRef = d3.select(this.svgRef);

    this.d3SvgRef
      .call(zoom);
  };

  zoomed = () => {
    const transform = d3.zoomTransform(this.d3SvgRef.node());

    this.setState({ transform }, () => {
      this.computeScales();
    });
  };
}

@observer
export default class Chart extends Component {
  render () {
    const { chart, loading } = chartStore;

    if (loading) {
      return (
        <div style={{ textAlign: 'center' }}>
          <Loader active inline='centered' size='huge' />

          <Header as='h2'>
            Loading data...
          </Header>
        </div>
      );
    }

    if (!chart.data) {
      return null;
    }

    return (
      <CustomChart data={chart.data.slice()} />
    );
  }
}
