import styled from 'styled-components';

import { background as bgColor, border as borderColor } from './colors';

const Label = styled.span`
  background-color: ${bgColor};
  border-radius: 7px;
  font-size: 0.85rem;
  font-weight: bold;
  position: absolute;
  padding: 1px 10px;
  transform: translate(15px, -50%);
  white-space: nowrap;

  &:after, &:before {
    border: solid ${bgColor};
    content: " ";
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
  }

  &:after {
    border-color: rgba(136, 183, 213, 0);
    border-width: 5px;
  }

  &:before {
    border-color: rgba(194, 225, 245, 0);
    border-width: 6px;
  }
`;

export const LabelTarget = styled(Label)`
  transform: translate(calc(-2px - 15%), calc(-100% - 17px));

  &:after, &:before {
    top: 100%;
    left: 15%;
  }

  &:after {
    border-top-color: ${bgColor};
    margin-left: -5px;
  }

  &:before {
    border-top-color: ${borderColor};
    margin-left: -6px;
  }
`;

export const LabelRaised = styled(Label)`
  transform: translate(15px, -50%);

  &:after, &:before {
    right: 100%;
    top: 50%;
  }

  &:after {
    border-right-color: ${bgColor};
    margin-top: -5px;
  }

  &:before {
    border-right-color: ${borderColor};
    margin-top: -6px;
  }
`;
