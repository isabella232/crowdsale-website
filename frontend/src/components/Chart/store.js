import BigNumber from 'bignumber.js';
import { action, observable } from 'mobx';

import backend from '../../backend';
import blockStore from '../../stores/block.store';
import auctionStore from '../../stores/auction.store';
import { fromWei } from '../../utils';

class ChartStore {
  @observable chart = null;
  @observable loading = true;
  @observable priceChart = null;

  totalAccounted = new BigNumber(0);

  constructor () {
    auctionStore.ready(async () => {
      await this.fetchChartData();
      await this.computePriceChart();

      this.setLoading(false);
      blockStore.on('block', this.update);
    });
  }

  formatChartData (data) {
    const { target, raised, time } = data;
    const { DIVISOR } = auctionStore;
    const { initialRaised = new BigNumber(0) } = this;

    return {
      target: fromWei(target.div(DIVISOR).sub(initialRaised)).toNumber(),
      raised: raised ? fromWei(raised.sub(initialRaised)).toNumber() : raised,
      raw: {
        target: fromWei(target.div(DIVISOR)),
        raised: raised ? fromWei(raised) : raised
      },
      time: time.getTime(),
      date: time
    };
  }

  @action setChart (chart) {
    this.chart = chart;
  }

  @action setPriceChart (priceChart) {
    this.priceChart = priceChart;
  }

  @action setLoading (loading) {
    this.loading = loading;
  }

  update = async () => {
    const { totalAccounted } = auctionStore;

    // Only update the chart when the price updates
    const nextTotalAccounted = new BigNumber(totalAccounted);
    const update = !nextTotalAccounted.eq(this.totalAccounted) || !this.chart;

    this.totalAccounted = new BigNumber(totalAccounted);

    if (update) {
      await this.updateChartData();
    } else {
      const { now } = auctionStore;
      const target = auctionStore.getTarget(now, false);

      this.addChartData([ {
        target: target,
        raised: totalAccounted,
        time: now
      } ]);
    }
  }

  computePriceChart () {
    const { beginTime, initialEndTime } = auctionStore;
    const NUM_TICKS = 200;
    const data = [];

    const beginTarget = auctionStore.getTarget(beginTime);
    const endTarget = auctionStore.getTarget(initialEndTime);

    const targetInteval = beginTarget.sub(endTarget).div(NUM_TICKS);

    for (let i = 0; i <= NUM_TICKS; i++) {
      // The target decreases with time
      const target = beginTarget.sub(targetInteval.mul(i));
      const time = auctionStore.getTimeFromTarget(target);

      data.push({ target, time });
    }

    const dateInterval = (initialEndTime - beginTime) / NUM_TICKS;

    for (let i = 0; i <= NUM_TICKS; i++) {
      const time = new Date(beginTime.getTime() + dateInterval * i);
      const target = auctionStore.getTarget(time, false);

      if (target.lt(0)) {
        break;
      }

      data.push({ target, time });
    }

    const formattedData = data
      .map((datum) => this.formatChartData(datum))
      .sort((ptA, ptB) => ptA.time - ptB.time);

    this.setPriceChart({
      data: formattedData
    });
  }

  addChartData (nextData) {
    const nextChartData = this.chart.data.slice()
      .concat(nextData.map((datum) => this.formatChartData(datum)))
      .sort((dA, dB) => dA.time - dB.time);

    this.setChart({ data: nextChartData });
  }

  async updateChartData () {
    let raisedRawData;

    try {
      raisedRawData = await backend.chartData(this.lastUpdate || null);
    } catch (error) {
      return console.error(error);
    }

    if (raisedRawData.length === 0) {
      return;
    }

    this.lastUpdate = raisedRawData.slice(-1)[0].time;

    const data = raisedRawData
      .map((datum) => {
        const { time, totalAccounted } = datum;
        const date = new Date(time);
        const value = new BigNumber(totalAccounted);
        const target = auctionStore.getTarget(date);

        return {
          target: target,
          raised: value,
          time: date
        };
      });

    this.addChartData(data);
  }

  async fetchChartData () {
    const { beginTime, endTime, now: blockNow } = auctionStore;
    const now = new Date(Math.min(endTime, blockNow));

    let raisedRawData;

    try {
      raisedRawData = await backend.chartData(this.lastUpdate || null);
    } catch (error) {
      return console.error(error);
    }

    if (raisedRawData.length < 2) {
      return console.warn('no chart data...');
    }

    // Order by DESC time
    const raisedData = raisedRawData
      .map((datum) => {
        const { time, totalAccounted } = datum;
        const value = new BigNumber(totalAccounted);

        return { value, time: new Date(time) };
      })
      .sort((rA, rB) => rB.time - rA.time);

    this.lastUpdate = raisedData[0].time;
    this.initialRaised = raisedData.slice(-1)[0].value;

    const NUM_TICKS = 200;
    const data = [];

    const beginTarget = auctionStore.getTarget(beginTime);
    const nowTarget = auctionStore.getTarget(now);

    const targetInteval = beginTarget.sub(nowTarget).div(NUM_TICKS);

    for (let i = 0; i <= NUM_TICKS; i++) {
      // The target decreases with time
      const target = beginTarget.sub(targetInteval.mul(i));
      const time = auctionStore.getTimeFromTarget(target);
      const raisedIndex = raisedData.findIndex((d) => d.time <= time);
      const raised = raisedIndex === -1
        ? new BigNumber(0)
        : raisedData[raisedIndex].value;

      data.push({ target, time, raised });
    }

    const dateInterval = (now - beginTime) / NUM_TICKS;

    for (let i = 0; i <= NUM_TICKS; i++) {
      const time = new Date(beginTime.getTime() + dateInterval * i);
      const target = auctionStore.getTarget(time);
      const raisedIndex = raisedData.findIndex((d) => d.time <= time);
      const raised = raisedIndex === -1
        ? new BigNumber(0)
        : raisedData[raisedIndex].value;

      data.push({ target, time, raised });
    }

    const firstRaisedData = raisedData.length > 0
      ? raisedData[0].value
      : new BigNumber(0);

    data.push({
      time: new Date(now.getTime() + dateInterval),
      raised: firstRaisedData,
      target: nowTarget
    });

    const formattedData = data
      .map((datum) => this.formatChartData(datum))
      .sort((dA, dB) => dA.time - dB.time);

    this.setChart({
      data: formattedData
    });
  }
}

export default new ChartStore();
