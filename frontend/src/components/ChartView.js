import React, { Component } from 'react';
import { Header } from 'semantic-ui-react';

import AppContainer from './AppContainer';
import Chart from './Chart';
import Text from './ui/Text';

export default class ChartView extends Component {
  render () {
    return (
      <AppContainer
        hideStepper
        header={(
          <Header>
            REAL TIME SALE DATA
          </Header>
        )}
        style={{
          padding: '2em 2.5em'
        }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Chart />

          <div>
            * "contributed so far" includes the bonuses
          </div>
        </div>

        <Text>
          At the beginning of the auction the effective cap starts out high and the
          contributions low. As the auction progresses the contributions rise, while
          the current cap decreases according to predetermined formula. Once the
          contributions reach the cap, the 5 million DOT tokens will be allocated to
          contributors in proportion to their contribution.
        </Text>
      </AppContainer>
    );
  }
}
