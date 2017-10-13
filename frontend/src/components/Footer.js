import { observer } from 'mobx-react';
import React, { Component } from 'react';
import styled from 'styled-components';
import { Container } from 'semantic-ui-react';

import config from '../stores/config.store';

import MainLogo from '../images/MainLogo.svg';

const FooterContainer = styled.div`
  background-color: #F9F9F9;
  padding: 1.5em 1em;
`;

const Content = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: row;
  max-width: 80em;
  margin: 0 auto;
  flex-wrap: wrap;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 3em;
  padding-bottom: 1em;
`;

const Title = styled.div`
  color: gray;
  margin-bottom: 0.5em;
`;

const Grid = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const Link = styled.a`
  margin-bottom: 0.35em;
`;

@observer
export default class Footer extends Component {
  render () {
    return (
      <FooterContainer>
        <Container>
          <Content>
            <img src={MainLogo} style={{ maxHeight: '2em', marginRight: '8em', marginBottom: '1.5em' }} />

            <Grid>
              <Column>
                <Title>FAQs</Title>
                <Link target='_blank' href='http://picops.parity.io/#/faq'>
                  PICOPS FAQ
                </Link>
              </Column>

              <Column>
                <Title>Content e-mails</Title>
                <Link target='_blank' href='mailto:help@polkadot.network'>
                  help@polkadot.network
                </Link>
                <Link target='_blank' href='mailto:picops@parity.io'>
                  picops@parity.io
                </Link>
              </Column>

              <Column>
                <Title>Legal</Title>
                <Link target='_blank' href={`${config.saleWebsite}memorandum`}>
                  Polkadot Memorandum
                </Link>
              </Column>
            </Grid>
          </Content>
        </Container>
      </FooterContainer>
    );
  }
}
