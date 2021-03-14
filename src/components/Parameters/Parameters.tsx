import * as React from 'react';
import { DropdownOrLabel } from '../DropdownOrLabel/DropdownOrLabel';
import { ParametersGroup } from './ParametersGroup';

import { UnderlinedHeader } from '../../common-elements';

import { MediaContentModel } from '../../services';
import { FieldModel, RequestBodyModel } from '../../services/models';
import { MediaTypesSwitch } from '../MediaTypeSwitch/MediaTypesSwitch';
import { Schema } from '../Schema';

import { Markdown } from '../Markdown/Markdown';

function safePush(obj, prop, item) {
  if (!obj[prop]) {
    obj[prop] = [];
  }
  obj[prop].push(item);
}

export interface ParametersProps {
  parameters?: FieldModel[];
  body?: RequestBodyModel;
}

const PARAM_PLACES = ['path', 'query', 'cookie', 'header'];

export class Parameters extends React.PureComponent<ParametersProps> {
  orderParams(params: FieldModel[]): Record<string, FieldModel[]> {
    const res = {};
    params.forEach(param => {
      safePush(res, param.in, param);
    });
    return res;
  }

  render() {
    const { body, parameters = [] } = this.props;
    console.log("body");
    console.log(body);
    console.log("parameters");
    console.log(parameters);
    if (body === undefined && parameters === undefined) {
      return null;
    }

    const paramsMap = this.orderParams(parameters);
    console.log("paramsMap");
    console.log(paramsMap);
    const paramsPlaces = parameters.length > 0 ? PARAM_PLACES : [];
    console.log("paramsPlaces");
    console.log(paramsPlaces);
    const bodyContent = body && body.content;
    console.log("bodyContent");
    console.log(bodyContent);
    const bodyDescription = body && body.description;
    console.log("bodyDescription");
    console.log(bodyDescription);
    return (
      <>
        {paramsPlaces.map(place => (
          <ParametersGroup key={place} place={place} parameters={paramsMap[place]} />
        ))}
        {bodyContent && <BodyContent content={bodyContent} description={bodyDescription} />}
      </>
    );
  }
}

function DropdownWithinHeader(props) {
  return (
    <UnderlinedHeader key="header">
      Request Body schema: <DropdownOrLabel {...props} />
    </UnderlinedHeader>
  );
}

export function BodyContent(props: { content: MediaContentModel; description?: string }): JSX.Element {
  const { content, description } = props;
  return (
    <MediaTypesSwitch content={content} renderDropdown={DropdownWithinHeader}>
      {({ schema }) => {
        return (
          <>
            {description !== undefined && <Markdown source={description} />}
            <Schema skipReadOnly={true} key="schema" schema={schema} />
          </>
        );
      }}
    </MediaTypesSwitch>
  );
}
