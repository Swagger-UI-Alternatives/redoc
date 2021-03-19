import * as React from 'react';
import {
    LoginModal,
    LoginModalContent,
    LoginModalHeader,
    LoginModalBody,
    LoginModalFooter,
    LoginLabel,
    AuthorizeButton,
    CloseButton
} from './styled.elements';

interface AuthorizeProps {
    onClose: any,
    show: boolean
};

export class AuthorizationLogin extends React.Component<AuthorizeProps> {
    onClose = e => {this.props.onClose && this.props.onClose(e);};

    render() {
        if(!this.props.show){
            return null;
        }
        return (
            <LoginModal>
              <LoginModalContent>
                  <LoginModalHeader>
                    <CloseButton  onClick={e => {this.onClose(e);}}>
                        &times;
                    </CloseButton>
                    <h1>Basic Authorization</h1>
                  </LoginModalHeader>
                  <LoginModalBody>
                    <form>
                        <LoginLabel>Username:</LoginLabel>
                        <input type="text" id="authUser" name="authUser" /><br/><br/>
                        <LoginLabel>Password:</LoginLabel>
                        <input type="text" id="authPass" name="authPass" /><br/><br/>
                    </form>
                  </LoginModalBody>
                  <LoginModalFooter>
                    <AuthorizeButton>Authorize</AuthorizeButton>
                  </LoginModalFooter>
              </LoginModalContent>
            </LoginModal>
          );
    }
  }