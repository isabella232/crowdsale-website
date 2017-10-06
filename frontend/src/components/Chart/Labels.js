import styled from 'styled-components';

const Label = styled.span`
  border-radius: 7px;
  font-size: 0.85rem;
  font-weight: bold;
  position: absolute;
  padding: 1px 10px;
  transform: translate(15px, -50%);
  white-space: nowrap;

  &:after, &:before {
    border: solid transparent;
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
    border-width: 8px;
  }
`;

export const LabelTarget = styled(Label)`
  transform: translate(calc(-2px - 15%), calc(-100% - 17px));

  &:after, &:before {
    top: 100%;
    left: 15%;
  }

  &:after {
    border-top-color: white;
    margin-left: -5px;
  }

  &:before {
    border-top-color: gray;
    margin-left: -8px;
  }
`;

export const LabelRaised = styled(Label)`
  transform: translate(15px, -50%);

  &:after, &:before {
    right: 100%;
    top: 50%;
  }

  &:after {
    border-right-color: white;
    margin-top: -5px;
  }

  &:before {
    border-right-color: red;
    margin-top: -8px;
  }
`;
