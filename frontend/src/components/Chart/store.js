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
    auctionStore.ready(() => {
      this.update();
      blockStore.on('block', this.update);
    });
  }

  formatChartData (data) {
    const { target, raised, time } = data;

    return {
      target: fromWei(target).round().toNumber(),
      raised: raised ? fromWei(raised).toNumber() : raised,
      time: time.getTime()
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

    if (!this.priceChart || this.priceChart.length === 0) {
      this.computePriceChart();
    }

    // Only update the chart when the price updates
    const nextTotalAccounted = new BigNumber(totalAccounted);
    const update = !nextTotalAccounted.eq(this.totalAccounted) || !this.chart;

    this.totalAccounted = new BigNumber(totalAccounted);

    if (update) {
      await this.updateChartData();
    }

    if (this.loading) {
      this.setLoading(false);
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

  async updateChartData () {
    const { beginTime, now } = auctionStore;
    let raisedRawData;

    try {
      raisedRawData = await backend.chartData();
    } catch (error) {
      return console.error(error);
    }

    const raisedData = raisedRawData
      .map((datum) => {
        const { time, totalAccounted } = datum;
        const value = new BigNumber(totalAccounted);

        return { value, time: new Date(time) };
      })
      .sort((rA, rB) => rB.time - rA.time);

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
      .sort((ptA, ptB) => ptA.time - ptB.time)
      .map((datum) => this.formatChartData(datum));

    this.setChart({
      data: formattedData
    });
  }
}

export default new ChartStore();
