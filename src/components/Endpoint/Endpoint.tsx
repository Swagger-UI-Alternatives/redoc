import * as React from 'react';
import { ShelfIcon } from '../../common-elements';
import { OperationModel } from '../../services';
import { Markdown } from '../Markdown/Markdown';
import { OptionsContext } from '../OptionsProvider';
import { SelectOnClick } from '../SelectOnClick/SelectOnClick';

import { UnderlinedHeader } from '../../common-elements';
import { TryItOutParameters } from './TryItOutParameters';

import { expandDefaultServerVariables, getBasePath } from '../../utils';
import {
  EndpointInfo,
  HttpVerb,
  OperationEndpointWrap,
  ServerItem,
  ServerRelativeURL,
  ServersOverlay,
  ServerUrl,
  TryButton,
  ExecuteTryButton
} from './styled.elements';

export interface EndpointProps {
  operation: OperationModel;

  hideHostname?: boolean;
  inverted?: boolean;
  compact?: boolean;
}

export interface EndpointState {
  tryExpanded: boolean;
  urlExpanded: boolean;
}

export class Endpoint extends React.Component<EndpointProps, EndpointState> {
  constructor(props) {
    super(props);
    this.state = {
      tryExpanded: false,
      urlExpanded: false,
    };
  }

  toggleTry = () => {
    this.setState({ urlExpanded: false });
    this.setState({ tryExpanded: !this.state.tryExpanded });
  };

  toggleURL = () => {
    this.setState({ tryExpanded: false });
    this.setState({ urlExpanded: !this.state.urlExpanded });
  };

  orderParams = (params) => {
    const res = {};
    params.forEach(param => {
      if (!res[param.in]) {
        res[param.in] = [];
      }
      res[param.in].push(param);
    });
    return res;
  };

  render() {
    const { operation, inverted, hideHostname } = this.props;
    const { urlExpanded } = this.state;
    const { tryExpanded } = this.state;

    const paramsMap = this.orderParams(operation.parameters);
    const paramsPlaces = operation.parameters.length > 0 ? ['path', 'query', 'cookie', 'header'] : [];

    // TODO: highlight server variables, e.g. https://{user}.test.com
    return (
      <OptionsContext.Consumer>
        {options => (
          <OperationEndpointWrap>
            <EndpointInfo expanded={urlExpanded || tryExpanded} inverted={inverted}>
              {operation.parameters.length > 0 &&
                <TryButton onClick={this.toggleTry} compact={this.props.compact}>Try</TryButton>
              }
              <HttpVerb onClick={this.toggleURL} type={operation.httpVerb} compact={this.props.compact}>
                {operation.httpVerb}
              </HttpVerb>
              <ServerRelativeURL>{operation.path}</ServerRelativeURL>
              <ShelfIcon
                float={'right'}
                color={inverted ? 'black' : 'white'}
                size={'20px'}
                direction={urlExpanded || tryExpanded  ? 'up' : 'down'}
                style={{ marginRight: '-25px' }}
              />
            </EndpointInfo>
            <ServersOverlay expanded={urlExpanded} aria-hidden={!urlExpanded}>
              {operation.servers.map(server => {
                const normalizedUrl = options.expandDefaultServerVariables
                  ? expandDefaultServerVariables(server.url, server.variables)
                  : server.url;
                const basePath = getBasePath(normalizedUrl);
                return (
                  <ServerItem key={normalizedUrl}>
                    <Markdown source={server.description || ''} compact={true} />
                    <SelectOnClick>
                      <ServerUrl>
                        <span>
                          {hideHostname || options.hideHostname
                            ? basePath === '/'
                              ? ''
                              : basePath
                            : normalizedUrl}
                        </span>
                        {operation.path}
                      </ServerUrl>
                    </SelectOnClick>
                  </ServerItem>
                );
              })}
            </ServersOverlay>
            <ServersOverlay expanded={tryExpanded} aria-hidden={!tryExpanded}>
              <UnderlinedHeader> Try-It-Out Parameters</UnderlinedHeader>
              {paramsPlaces.map(place => (
                <TryItOutParameters key={place} place={place} parameters={paramsMap[place]} />
              ))}
              <ExecuteTryButton>Execute</ExecuteTryButton>
            </ServersOverlay>
          </OperationEndpointWrap>
        )}
      </OptionsContext.Consumer>
    );
  }
}