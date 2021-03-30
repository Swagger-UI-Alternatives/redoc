import * as React from 'react';

import { darken, getLuminance, lighten } from 'polished';
import styled from '../../styled-components';
import { MenuItemLabel } from '../SideMenu/styled.elements';

export const SearchWrap = styled.div`
  padding: 5px 0;
`;

export const SearchInput = styled.input.attrs(() => ({
  className: 'search-input',
}))`
  width: calc(100% - ${props => props.theme.spacing.unit * 8}px);
  box-sizing: border-box;
  margin: 0 ${props => props.theme.spacing.unit * 4}px;
  padding: 5px ${props => props.theme.spacing.unit * 2}px 5px
    ${props => props.theme.spacing.unit * 4}px;
  border: 0;
  border-bottom: 1px solid
    ${({ theme }) =>
      (getLuminance(theme.sidebar.backgroundColor) > 0.5 ? darken : lighten)(
        0.1,
        theme.sidebar.backgroundColor,
      )};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-weight: bold;
  font-size: 13px;
  color: ${props => props.theme.sidebar.textColor};
  background-color: transparent;
  outline: none;
`;

export const SearchIcon = styled((props: { className?: string }) => (
  <svg
    className={props.className}
    version="1.1"
    viewBox="0 0 1000 1000"
    x="0px"
    xmlns="http://www.w3.org/2000/svg"
    y="0px"
  >
    <path d="M968.2,849.4L667.3,549c83.9-136.5,66.7-317.4-51.7-435.6C477.1-25,252.5-25,113.9,113.4c-138.5,138.3-138.5,362.6,0,501C219.2,730.1,413.2,743,547.6,666.5l301.9,301.4c43.6,43.6,76.9,14.9,104.2-12.4C981,928.3,1011.8,893,968.2,849.4z M524.5,522c-88.9,88.7-233,88.7-321.8,0c-88.9-88.7-88.9-232.6,0-321.3c88.9-88.7,233-88.7,321.8,0C613.4,289.4,613.4,433.3,524.5,522z" />
  </svg>
)).attrs({
  className: 'search-icon',
})`
  position: absolute;
  left: ${props => props.theme.spacing.unit * 4}px;
  height: 1.8em;
  width: 0.9em;

  path {
    fill: ${props => props.theme.sidebar.textColor};
  }
`;

export const QuestionIcon = styled((props: { className?: string }) => (
  <svg
    className={props.className}
    viewBox="0 0 16 16"
    width="16"
    height="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
    <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
  </svg>
)).attrs({
  className: 'question-icon',
})`
  position: absolute;
  right: ${props => props.theme.spacing.unit * 4}px;
  height: 1.8em;
  width: 0.9em;

  path {
    fill: ${props => props.theme.sidebar.textColor};
  }
`;

export const QuestionToolTip = styled.div`
position: absolute;
display: inline-block;
cursor: pointer;

&:hover .tooltiptext {
  visibility: visible;
}

.tooltiptext {
  font-size: 13px;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  width: 19.0em;
  background-color: ${props => props.theme.sidebar.textColor};
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 0;
  position: absolute;
  z-index: 1000;
  top: -5px;
  right: 110%;
  visibility: hidden;
}
`;

export const SearchResultsBox = styled.div`
  padding: ${props => props.theme.spacing.unit}px 0;
  background-color: ${({ theme }) => darken(0.05, theme.sidebar.backgroundColor)}};
  color: ${props => props.theme.sidebar.textColor};
  min-height: 150px;
  max-height: 250px;
  border-top: ${({ theme }) => darken(0.1, theme.sidebar.backgroundColor)}};
  border-bottom: ${({ theme }) => darken(0.1, theme.sidebar.backgroundColor)}};
  margin-top: 10px;
  line-height: 1.4;
  font-size: 0.9em;
  
  li {
    background-color: inherit;
  }

  ${MenuItemLabel} {
    padding-top: 6px;
    padding-bottom: 6px;

    &:hover,
    &.active {
      background-color: ${({ theme }) => darken(0.1, theme.sidebar.backgroundColor)};
    }

    > svg {
      display: none;
    }
  }
`;

export const ClearIcon = styled.i`
  position: absolute;
  display: inline-block;
  width: ${props => props.theme.spacing.unit * 2}px;
  text-align: center;
  right: ${props => props.theme.spacing.unit * 4}px;
  line-height: 2em;
  vertical-align: middle;
  margin-right: 2px;
  cursor: pointer;
  font-style: normal;
  color: '#666';
`;
