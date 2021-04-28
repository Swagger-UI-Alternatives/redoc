import * as React from 'react';
import { PropertiesTable } from '../../common-elements/fields-layout';
import { FieldModel } from '../../services/models';
import { mapWithLast } from '../../utils';

import { RequiredLabel, PlaceLabel, FieldTextBox } from '../../common-elements/fields';
import { PropertyBullet, PropertyDetailsCell, PropertyNameCell } from '../../common-elements/fields-layout';

export interface TryItOutProps {
  place: string;
  parameters: FieldModel[];
}

export class TryItOutParameters extends React.PureComponent<TryItOutProps, any> {
  render() {
    const { place, parameters } = this.props;
                
    return (
        <PropertiesTable>
          <tbody>
            { parameters && mapWithLast(parameters, (field) => (
                <tr className={field.name} key={field.name}>
                <PropertyNameCell className={field.deprecated ? 'deprecated' : undefined} kind={field.kind} title={field.name}>
                  <PropertyBullet />
                  <span>{field.name}</span>
                  {place && <PlaceLabel> ({place}) </PlaceLabel>}
                  <PlaceLabel>{field.schema.displayType}</PlaceLabel>
                  {field.required && <RequiredLabel> *required </RequiredLabel>}
                </PropertyNameCell>

                <PropertyDetailsCell>
                  <FieldTextBox type="text" placeholder="Enter value ..." />
                </PropertyDetailsCell>
              </tr>
            ))}
          </tbody>
        </PropertiesTable>
    );
  }
}