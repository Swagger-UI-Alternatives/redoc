import { observer } from 'mobx-react';
import * as React from 'react';

import { ClickablePropertyNameCell, RequiredLabel } from '../../common-elements/fields';
import { FieldDetails } from './FieldDetails';

import {
  InnerPropertiesWrap,
  PropertyBullet,
  PropertyCellWithInner,
  PropertyDetailsCell,
  PropertyNameCell,
} from '../../common-elements/fields-layout';

import { ShelfIcon } from '../../common-elements/';

import { FieldModel } from '../../services/models';
import { Schema, SchemaOptions } from '../Schema/Schema';

export interface FieldProps extends SchemaOptions {
  className?: string;
  isLast?: boolean;
  showExamples?: boolean;

  field: FieldModel;
  expandByDefault?: boolean;

  renderDiscriminatorSwitch?: (opts: FieldProps) => JSX.Element;
}

@observer
export class Field extends React.Component<FieldProps> {
  toggle = () => {
    if (this.props.field.expanded === undefined && this.props.expandByDefault) {
      this.props.field.expanded = false;
    } else {
      this.props.field.toggle();
    }
  };

  handleKeyPress = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.toggle();
    }
  };

  // handleVersioning(field: FieldModel) {
  //   if(item.httpVerb === 'doc') {
  //     return(undefined);
  //   }
  //   // if the operation is deprecated, then
  //   if(item.deprecated) {
  //     // if deprecatedIn is not undefined, then give the version it is deprecated
  //     if(item.deprecatedIn !== 'DO_NOT_DISPLAY' && item.deprecatedIn !== undefined) {
  //       return(
  //         <Versioning>Deprecated in v{item.deprecatedIn}</Versioning>
  //       );
  //     }
  //     // if deprecated=true but version is not specified
  //     else {
  //       return(undefined);
  //     }
  //   }
  //   // else if introducedIn is not undefined
  //   else if(field.introducedIn !== 'DO_NOT_DISPLAY') {
  //     // the introducedIn prints Introduced in
  //     return(
  //       "\n(v"+field.introducedIn+")"
  //     );
  //   }
  //   // otherwise
  //   else {
  //     return(undefined);
  //   }
  //   return(undefined);
  // }

  render() {
    const { className, field, isLast, expandByDefault } = this.props;
    // const { name, deprecated, required, kind } = field;
    const { name, deprecated, required, kind, introducedIn } = field; // version-fields added
    const withSubSchema = !field.schema.isPrimitive && !field.schema.isCircular;

    const expanded = field.expanded === undefined ? expandByDefault : field.expanded;

    const paramName = withSubSchema ? (
      <ClickablePropertyNameCell
        className={deprecated ? 'deprecated' : ''}
        kind={kind}
        title={name}
      >
        <PropertyBullet />
        <button
          onClick={this.toggle}
          onKeyPress={this.handleKeyPress}
          aria-label="expand properties"
        >
          <span>{name}</span>
          <ShelfIcon direction={expanded ? 'down' : 'right'} />
        </button>
        {required && <RequiredLabel> required </RequiredLabel>}
        {/* version-field */}
        <br />&nbsp;&nbsp;{"(v"+introducedIn+")"}
      </ClickablePropertyNameCell>
    ) : (
      <PropertyNameCell className={deprecated ? 'deprecated' : undefined} kind={kind} title={name}>
        <PropertyBullet />
        <span>{name}</span>
        {required && <RequiredLabel> required </RequiredLabel>}
        {/* version-field */}
        <br />&nbsp;&nbsp;{"(v"+introducedIn+")"}
      </PropertyNameCell>
    );

    return (
      <>
        <tr className={isLast ? 'last ' + className : className}>
          {paramName}
          <PropertyDetailsCell>
            <FieldDetails {...this.props} />
          </PropertyDetailsCell>
        </tr>
        {expanded && withSubSchema && (
          <tr key={field.name + 'inner'}>
            <PropertyCellWithInner colSpan={2}>
              <InnerPropertiesWrap>
                <Schema
                  schema={field.schema}
                  skipReadOnly={this.props.skipReadOnly}
                  skipWriteOnly={this.props.skipWriteOnly}
                  showTitle={this.props.showTitle}
                />
              </InnerPropertiesWrap>
            </PropertyCellWithInner>
          </tr>
        )}
      </>
    );
  }
}
