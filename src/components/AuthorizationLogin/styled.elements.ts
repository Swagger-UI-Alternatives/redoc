import styled from '../../styled-components';

/* export const LoginModal = styled.div`
  border: 1px solid red;
  color: red;
  font-weight: normal;
  margin-left: 0.5em;
  display: block;
`; */

export const LoginModal = styled.div`
  display: block;
  position: fixed;
  z-index: 100;
  padding-top: 100px;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgb(0,0,0);
  background-color: rgba(0,0,0,0.4);
}
`;

export const LoginModalContent = styled.div`
  position: block;
  background-color: #fefefe;
  margin: 0 auto;
  padding: 0;
  border: 1px solid #888;
  width: 55%;
  box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);
`;

export const LoginModalHeader = styled.div`
  padding: 2px 16px;
  background-color: ${props => props.theme.colors.primary.main};
  border: 5px solid ${props => props.theme.colors.primary.main};
  color: white;
  text-align: center;
`;

export const LoginModalBody = styled.div`
  text-align: center;
  padding: 20px 16px;
`;

export const LoginModalFooter= styled.div`
  padding: 2px 16px;
  text-align: center;
`;

export const LoginLabel = styled.label`
  padding: 2px 16px;
  font-size: 1em;
`;

export const CloseButton = styled.button`
  float: right;
  border: none;
  background: none;
  color: white;
  font-size: 2em;
  cursor: pointer;
`;

export const AuthorizeButton = styled.button`
  border: 1px solid ${props => props.theme.colors.primary.main};
  color: ${props => props.theme.colors.primary.main};
  background: white;
  font-weight: normal;
  padding: 4px 8px 4px;
  display: inline-block;
  cursor: pointer;
  margin-bottom: 1.25em;
`;