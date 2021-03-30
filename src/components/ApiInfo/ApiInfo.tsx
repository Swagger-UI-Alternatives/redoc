import { observer } from 'mobx-react';
import * as React from 'react';

import { AppStore } from '../../services/AppStore';

import { MiddlePanel, Row, Section } from '../../common-elements/';
import { ExternalDocumentation } from '../ExternalDocumentation/ExternalDocumentation';
import { Markdown } from '../Markdown/Markdown';
import { StyledMarkdownBlock } from '../Markdown/styled.elements';
import {
  ApiHeader,
  DownloadButton,
  AuthorizeButton, //added by Madi
  InfoSpan,
  InfoSpanBox,
  InfoSpanBoxWrap,
} from './styled.elements';
import { AuthorizationLogin } from '../AuthorizationLogin/AuthorizationLogin'; //added by madi

export interface ApiInfoProps {
  store: AppStore;
}

@observer
export class ApiInfo extends React.Component<ApiInfoProps> {

  state = {
    show: false
  };

  showAuthLogin = e => {
    console.log(e);
    this.setState({
      show: !this.state.show
    });
  };

  handleDownloadClick = e => {
    if (!e.target.href) {
      e.target.href = this.props.store.spec.info.downloadLink;
    }
  };

  render() {
    const { store } = this.props;
    const { info, externalDocs } = store.spec;
    const hideDownloadButton = store.options.hideDownloadButton;

    const downloadFilename = info.downloadFileName;
    const downloadLink = info.downloadLink;

    const license =
      (info.license && (
        <InfoSpan>
          License: <a href={info.license.url}>{info.license.name}</a>
        </InfoSpan>
      )) ||
      null;

    const website =
      (info.contact && info.contact.url && (
        <InfoSpan>
          URL: <a href={info.contact.url}>{info.contact.url}</a>
        </InfoSpan>
      )) ||
      null;

    const email =
      (info.contact && info.contact.email && (
        <InfoSpan>
          {info.contact.name || 'E-mail'}:{' '}
          <a href={'mailto:' + info.contact.email}>{info.contact.email}</a>
        </InfoSpan>
      )) ||
      null;

    const terms =
      (info.termsOfService && (
        <InfoSpan>
          <a href={info.termsOfService}>Terms of Service</a>
        </InfoSpan>
      )) ||
      null;

    const version = (info.version && <span>({info.version})</span>) || null;

    return (
      <Section>
        <Row>
          <MiddlePanel className="api-info">
            <ApiHeader>
              {info.title} {version}
            </ApiHeader>
            {!hideDownloadButton && (
              <p>
                Download OpenAPI specification:
                <DownloadButton
                  download={downloadFilename || true}
                  target="_blank"
                  href={downloadLink}
                  onClick={this.handleDownloadClick}
                >
                  Download
                </DownloadButton>
                
                <AuthorizeButton
                  target="_blank"
                  onClick={this.showAuthLogin}>
                  Authorize &#128274;
                </AuthorizeButton>
                <AuthorizationLogin onClose={this.showAuthLogin} show={this.state.show}>
                </AuthorizationLogin>
              </p>
            )}
            <StyledMarkdownBlock>
              {((info.license || info.contact || info.termsOfService) && (
                <InfoSpanBoxWrap>
                  <InfoSpanBox>
                    {email} {website} {license} {terms}
                  </InfoSpanBox>
                </InfoSpanBoxWrap>
              )) ||
                null}
            </StyledMarkdownBlock>
            <Markdown source={store.spec.info.description} data-role="redoc-description" />
            {externalDocs && <ExternalDocumentation externalDocs={externalDocs} />}
              {<p>
              </p>}
            </MiddlePanel>
        </Row>
      </Section>
    );
  }
}
