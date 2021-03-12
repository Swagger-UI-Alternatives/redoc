import styled from '../../styled-components';
// SideMenu's styled.elements.ts (the little httpVerb styling)
/*
  width: 9ex;
  display: inline-block;
  height: ${props => props.theme.typography.code.fontSize};
  line-height: ${props => props.theme.typography.code.fontSize};
  background-color: #333;
  border-radius: 3px;
  background-repeat: no-repeat;
  background-position: 6px 4px;
  font-size: 7px;
  font-family: Verdana, sans-serif; // web-safe
  color: white;
  text-transform: uppercase;
  text-align: center;
  font-weight: bold;
  vertical-align: middle;
  margin-right: 6px;
  margin-top: 2px;
*/

// J-endDocTag J-badge
export const OperationBadge = styled.span.attrs((props: { type: string }) => ({
  className: `operation-type ${props.type}`,
}))<{ type: string }>`

  display: inline-block;
  line-height: 1.6em;
  background-color: #333;
  border-radius: 4px;
  background-repeat: no-repeat;
  background-position: center;
  font-size: 13px;
  font-family: Verdana, sans-serif; // web-safe
  color: white;
  text-transform: uppercase;
  text-align: center;
  font-weight: bold;
  vertical-align: middle;
  margin: 0;
  margin-right: 6px;
  margin-bottom: 4px;
  padding: 4px 20px;

  &.get {
    background-color: ${props => props.theme.colors.http.get};
  }

  &.post {
    background-color: ${props => props.theme.colors.http.post};
  }

  &.put {
    background-color: ${props => props.theme.colors.http.put};
  }

  &.options {
    background-color: ${props => props.theme.colors.http.options};
  }

  &.patch {
    background-color: ${props => props.theme.colors.http.patch};
  }

  &.delete {
    background-color: ${props => props.theme.colors.http.delete};
  }

  &.basic {
    background-color: ${props => props.theme.colors.http.basic};
  }

  &.link {
    background-color: ${props => props.theme.colors.http.link};
  }

  &.head {
    background-color: ${props => props.theme.colors.http.head};
  }

  &.hook {
    background-color: ${props => props.theme.colors.primary.main};
  }
`;
/*
// badge styling from shelfs.tsx
export const Badge = styled.span<{ type: string }>`
  display: inline-block;
  padding: 2px 8px;
  margin: 0;
  background-color: ${props => props.theme.colors[props.type].main};
  color: ${props => props.theme.colors[props.type].contrastText};
  font-size: ${props => props.theme.typography.code.fontSize};
  vertical-align: middle;
  line-height: 1.6;
  border-radius: 4px;
  font-weight: ${({ theme }) => theme.typography.fontWeightBold};
  font-size: 12px;
  + span[type] {
    margin-left: 4px;
  }
`;
*/