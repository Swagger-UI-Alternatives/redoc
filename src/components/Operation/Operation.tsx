import { observer } from 'mobx-react';
import * as React from 'react';

import { Badge, DarkRightPanel, H2, MiddlePanel, Row } from '../../common-elements';
import { ShareLink } from '../../common-elements/linkify';
import { OperationModel } from '../../services/models';
import styled from '../../styled-components';
import { CallbacksList } from '../Callbacks';
import { CallbackSamples } from '../CallbackSamples/CallbackSamples';
import { Endpoint } from '../Endpoint/Endpoint';
import { ExternalDocumentation } from '../ExternalDocumentation/ExternalDocumentation';
import { Extensions } from '../Fields/Extensions';
import { Markdown } from '../Markdown/Markdown';
import { OptionsContext } from '../OptionsProvider';
import { Parameters } from '../Parameters/Parameters';
import { RequestSamples } from '../RequestSamples/RequestSamples';
import { ResponsesList } from '../Responses/ResponsesList';
import { ResponseSamples } from '../ResponseSamples/ResponseSamples';
import { SecurityRequirements } from '../SecurityRequirement/SecurityRequirement';
import { shortenHTTPVerb } from '../../utils/openapi';

// Jarod-added J-badge
import { OperationBadge } from './styled.elements';
import { VERSION } from '../../services/MenuBuilder'; // Jarod-added J-version

const OperationRow = styled(Row)`
  backface-visibility: hidden;
  contain: content;
  overflow: hidden;
`;

const Description = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.unit * 6}px;
`;

export interface OperationProps {
  operation: OperationModel;
}

@observer
export class Operation extends React.Component<OperationProps> {

  handleVersioning(item: OperationModel) {
    // hopefully we have the latest version at this point...
    // if this is a doc operation then do nothing.
    if(item.httpVerb === 'doc') {
      return(undefined);
    }

    // Note: I want to assign deprecated=true if deprecatedIn is assigned in Operation. 
    // Before rendering of the menuitems and the contentitems.

    // if the operation is deprecated, then
    if(item.deprecated) {
      // if deprecatedIn is not undefined, then give the version it is deprecated
      if(item.deprecatedIn !== 'DO_NOT_DISPLAY' && item.deprecatedIn !== undefined) {
        return(
          <Badge type="warning"> Deprecated in v{item.deprecatedIn} </Badge>
        );
      }
      // if deprecated=true but version is not specified
      else {
        return(
          <Badge type="warning"> Deprecated </Badge>
        );
      }
    }
    // else if introducedIn is not undefined
    else if(item.introducedIn !== 'DO_NOT_DISPLAY'  && item.introducedIn !== undefined) {
      // if the introducedIn is equal to the latest version, then do New in
      if(item.introducedIn === VERSION) {
        return(
          <Badge type="newIn"> New in v{item.introducedIn} </Badge>
        );
      }
      // else the introducedIn prints Introduced in
      else {
        return(
          <Badge type="introIn"> Introduced in v{item.introducedIn} </Badge>
        );
      }
    }
    // otherwise
    else {
      return(undefined);
    }
  }

  render() {
    const { operation } = this.props;

    const { name: summary, description, externalDocs, isWebhook } = operation;  // J-version
    // const { name: summary, description, deprecated, externalDocs, isWebhook } = operation;
    const hasDescription = !!(description || externalDocs);

    return (
      <OptionsContext.Consumer>
        {(options) => (
          <OperationRow>
            <MiddlePanel>
              {/* J-badge i think i should add a color coded operationBadge here in H2 */}
              <H2>
                <ShareLink to={operation.id} />
                {/* J-badge add OperationBadge here. Also have to center these 3 things */}
                <OperationBadge type={operation.httpVerb}>{shortenHTTPVerb(operation.httpVerb)}</OperationBadge>
                {summary} {this.handleVersioning(operation)}
                {isWebhook && <Badge type="primary"> Webhook </Badge>}
              </H2>
              {options.pathInMiddlePanel && !isWebhook && (
                <Endpoint operation={operation} inverted={true} />
              )}
              {hasDescription && (
                <Description>
                  {description !== undefined && <Markdown source={description} />}
                  {externalDocs && <ExternalDocumentation externalDocs={externalDocs} />}
                </Description>
              )}
              <Extensions extensions={operation.extensions} />
              <SecurityRequirements securities={operation.security} />
              <Parameters parameters={operation.parameters} body={operation.requestBody} />
              <ResponsesList responses={operation.responses} />
              <CallbacksList callbacks={operation.callbacks} />
            </MiddlePanel>
            <DarkRightPanel>
              {/* Jarod-added J-endDocTag right panel doc removal */}
              {!options.pathInMiddlePanel && !isWebhook && operation.httpVerb !== 'doc' && <Endpoint operation={operation} />}
              <RequestSamples operation={operation} />
              <ResponseSamples operation={operation} />
              <CallbackSamples callbacks={operation.callbacks} />
            </DarkRightPanel>
          </OperationRow>
        )}
      </OptionsContext.Consumer>
    );
  }
}
