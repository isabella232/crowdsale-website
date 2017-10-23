import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Moment from 'react-moment';
import styled from 'styled-components';
import * as d3 from 'd3';
import { Header, Loader } from 'semantic-ui-react';

import { target as targetColor, raised as raisedColor, border as borderColor } from './colors';
import DotPair from './DotPair';
import Line from './Line';
import { LabelRaised, LabelTarget } from './Labels';
import PointedElement from './PointedElement';

import auctionStore from '../../stores/auction.store';
import chartStore from './store';

const Container = styled.div`
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

@observer
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
    const height = width * 1 / (4 / 3);

    this.computeScales({ size: { width, height } });
  };

  computeScales (nextState) {
    const { width, height } = nextState
      ? nextState.size
      : this.state.size;

    const margins = { top: 30, right: 30, bottom: 20, left: 20 };

    const { data } = this.props;

    if (!data || data.length < 2) {
      return;
    }

    const { beginTime, endTime, initialEndTime } = auctionStore;
    // between the initial end and end + (end - begin) / 4
    const domainEnd = Math.min(initialEndTime.getTime(), endTime.getTime() * 1.25 - 0.25 * beginTime.getTime());

    const xDomain = [
      data[0].time,
      domainEnd
      // initialEndTime.getTime()
    ];

    const yDomain = [
      // Math.round(data[0].target) * 1.05,
      Math.max(
        (data.slice(-1)[0].raised - data[0].raised) * 4 + data[0].raised,
        data.slice(-1)[0].target * 1.15
      ),
      data[0].raised
    ];

    const chartWidth = width - margins.left - margins.right;
    const chartHeight = height - margins.top - margins.bottom;

    let xScale = d3.scaleTime()
      .domain(xDomain)
      .range([ 0, chartWidth ]);

    const yScale = d3.scalePow()
      .exponent(0.75)
      .domain(yDomain)
      .range([ 0, chartHeight ]);

    const { transform } = this.state;

    if (transform) {
      xScale = transform.rescaleX(xScale);
    }
    const targetLine = d3.line()
      .x((datum) => xScale(datum.time))
      .y((datum) => yScale(datum.target))
      .curve(d3.curveLinear);

    const targetFutureLine = d3.line()
      .x((datum) => xScale(datum.time))
      .y((datum) => yScale(datum.target))
      .curve(d3.curveLinear);

    const raisedLine = d3.line()
      .x((datum) => xScale(datum.time))
      .y((datum) => yScale(datum.raised))
      .curve(d3.curveLinear);

    this.setState(Object.assign(
      { xDomain, yDomain, xScale, yScale, chart: { width, height, margins } },
      { targetLine, targetFutureLine, raisedLine },
      nextState || {}
    ));
  }

  render () {
    const { data } = this.props;
    const { chart, xScale, yScale, xDomain, yDomain } = this.state;

    if (!chart) {
      return null;
    }

    const { width, height, margins } = chart;
    const { mouse, targetLine, targetFutureLine, raisedLine } = this.state;
    const { endTime } = auctionStore;
    const { priceChart } = chartStore;

    const lastTime = data[data.length - 1].time;
    const futurePriceData = priceChart.data.filter((datum) => datum.time >= lastTime);

    return (
      <div ref={this.setContainerRef} style={{ width: '100%' }}>
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
              { /** The line from current point to end price */ }
              <Line
                color='lightgray'
                dashed
                from={[ data[data.length - 1].time, data[data.length - 1].raised ]}
                to={[ endTime.getTime(), data[data.length - 1].raised ]}
                scales={[ xScale, yScale ]}
                width={2}
              />

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
                to={[
                  futurePriceData.length > 0 ? futurePriceData[futurePriceData.length - 1].time : xDomain[1],
                  yDomain[1]
                ]}
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
                stroke={raisedColor}
                strokeWidth={2}
              />
              <path
                d={targetLine(data)}
                fill='none'
                stroke={targetColor}
                strokeWidth={2}
              />
              <path
                d={targetFutureLine(futurePriceData)}
                fill='none'
                stroke={targetColor}
                strokeDasharray='2, 2'
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
                r={7}
                xScale={xScale}
                yScale={yScale}
              />

              <DotPair
                animated
                datum={data[data.length - 1]}
                plain={false}
                r={10}
                xScale={xScale}
                yScale={yScale}
              />

              <PointedElement
                data={data}
                mouse={mouse}
                xScale={xScale}
                yScale={yScale}
              />
            </g>
          </svg>
        </Container>
        <div style={{
          textAlign: 'center',
          fontSize: '1.2em'
        }}>
          Time
        </div>
      </div>
    );
  }

  renderNowLabels () {
    const { data } = this.props;
    const { chart, xScale, yScale } = this.state;
    const { beginTime, now, endTime } = auctionStore;
    const { margins } = chart;
    const hasNotEnded = now <= beginTime || now < endTime;

    return (
      <span>
        {
          hasNotEnded
            ? (
              <LabelTarget
                style={{
                  left: xScale(data[data.length - 1].time) + margins.left,
                  top: yScale(data[data.length - 1].target) + margins.top - 5,
                  border: `1px solid ${borderColor}`
                }}
              >
                CURRENT EFFECTIVE CAP
              </LabelTarget>
            )
            : null
        }
        <LabelRaised
          style={{
            left: xScale(data[data.length - 1].time) + margins.left + 5,
            top: yScale(data[data.length - 1].raised) + margins.top,
            border: `1px solid ${borderColor}`
          }}
        >
          {hasNotEnded ? 'CONTRIBUTED SO FAR*' : 'TOTAL CONTRIBUTIONS' }
        </LabelRaised>
      </span>
    );
  }

  renderPointedLabels () {
    const { chart, mouse, xScale, yScale, yDomain } = this.state;

    if (!mouse) {
      return null;
    }

    const { priceChart } = chartStore;
    const { data } = this.props;
    const time = xScale.invert(mouse.x);
    const datum = data.find((d) => d.time >= time) ||
      priceChart.data.find((d) => d.time >= time);

    if (!datum) {
      return null;
    }

    const left = xScale(datum.time) + chart.margins.left;

    return (
      <span>
        <PointedLabelContainer style={{
          top: yScale(yDomain[1]) + chart.margins.top,
          left
        }}>
          <PointedLabel>
            <Moment format='L LT'>{datum.time}</Moment>
          </PointedLabel>
        </PointedLabelContainer>

        {
          datum.raw.raised
            ? (
              <PointedLabelContainer style={{
                fontSize: '0.85rem',
                top: yScale(yDomain[0]) + chart.margins.top,
                display: 'flex',
                flexDirection: 'column',
                left
              }}>
                <PointedLabel style={{
                  borderColor: raisedColor,
                  marginTop: '5px'
                }}>
                  {this.renderFigure(datum.raw.raised)}
                </PointedLabel>
              </PointedLabelContainer>
            )
            : (
              <PointedLabelContainer style={{
                fontSize: '0.85rem',
                top: yScale(yDomain[0]) + chart.margins.top,
                display: 'flex',
                flexDirection: 'column',
                left
              }}>
                <PointedLabel style={{
                  borderColor: targetColor,
                  marginTop: '5px'
                }}>
                  {this.renderFigure(datum.raw.target)}
                </PointedLabel>
              </PointedLabelContainer>
            )
        }
      </span>
    );
  }

  renderFigure (figure) {
    return (
      <span>
        <b>{figure.toFormat(0)}</b>
        <small style={{ marginLeft: '0.4em' }}>ETH</small>
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
    // const { width, height } = this.state.chart;

    // const zoom = d3
    //   .zoom()
    //   .scaleExtent([ 1, Infinity ])
    //   .translateExtent([[0, 0], [width, height]])
    //   .extent([[0, 0], [width, height]])
    //   .on('zoom', this.zoomed);

    this.svgRef = svgRef;
    this.d3SvgRef = d3.select(this.svgRef);

    // this.d3SvgRef.call(zoom);
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
    const { now, beginTime } = auctionStore;

    if (loading) {
      return (
        <div style={{ textAlign: 'center', minHeight: '15em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>
            <Loader active inline='centered' size='huge' />

            <Header as='h2'>
              Loading data...
            </Header>
          </div>
        </div>
      );
    }

    if (now < beginTime) {
      return (
        <div style={{ textAlign: 'center' }}>
          <Header as='h2'>
            Sale is not active
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
