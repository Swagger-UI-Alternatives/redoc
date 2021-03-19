import { action, observable, makeObservable } from 'mobx';

import {
  OpenAPIParameter,
  OpenAPIParameterLocation,
  OpenAPIParameterStyle,
  Referenced,
} from '../../types';
import { IMenuItem } from '../MenuStore'; //EXTENDED SEARCH
import { RedocNormalizedOptions } from '../RedocNormalizedOptions';

import { extractExtensions } from '../../utils/openapi';
import { OpenAPIParser } from '../OpenAPIParser';
import { MediaContentModel } from './MediaContent';  //EXTENDED SEARCH
import { ResponseModel } from './Response'; //EXTENDED SEARCH
import { SchemaModel } from './Schema';
import { ExampleModel } from './Example';
import { mapValues } from '../../utils/helpers';

const DEFAULT_SERIALIZATION: Record<
  OpenAPIParameterLocation,
  { explode: boolean; style: OpenAPIParameterStyle }
> = {
  path: {
    style: 'simple',
    explode: false,
  },
  query: {
    style: 'form',
    explode: true,
  },
  header: {
    style: 'simple',
    explode: false,
  },
  cookie: {
    style: 'form',
    explode: true,
  },
};

/**
 * Field or Parameter model ready to be used by components
 */
export class FieldModel implements IMenuItem {
  @observable
  expanded: boolean = false;

  //EXTENDED SEARCH START
  depth: number;
  items = [];

  ready?: boolean = true;
  active: boolean = false;

  id: string;
  absoluteIdx?: number;
  parent?: IMenuItem;

  containerContentModel?: MediaContentModel;
  containerOneOf?: SchemaModel;
  activeContentModel?: number;
  activeOneOf?: number;
  responseContainer?: ResponseModel;

  type = 'field' as 'field';
  //EXTENDED SEARCH END

  schema: SchemaModel;
  name: string;
  required: boolean;
  description: string;
  example?: string;
  examples?: Record<string, ExampleModel>;
  deprecated: boolean;
  in?: OpenAPIParameterLocation;
  kind: string;
  extensions?: Record<string, any>;
  explode: boolean;
  style?: OpenAPIParameterStyle;

  serializationMime?: string;

  constructor(
    parser: OpenAPIParser,
    infoOrRef: Referenced<OpenAPIParameter> & { name?: string; kind?: string },
    pointer: string,
    options: RedocNormalizedOptions,
  ) {
    makeObservable(this);

    const info = parser.deref<OpenAPIParameter>(infoOrRef);
    this.kind = infoOrRef.kind || 'field';
    this.name = infoOrRef.name || info.name;
    this.in = info.in;
    this.required = !!info.required;

    let fieldSchema = info.schema;
    let serializationMime = '';
    if (!fieldSchema && info.in && info.content) {
      serializationMime = Object.keys(info.content)[0];
      fieldSchema = info.content[serializationMime] && info.content[serializationMime].schema;
    }

    this.schema = new SchemaModel(parser, fieldSchema || {}, pointer, options);
    this.description =
      info.description === undefined ? this.schema.description || '' : info.description;
    this.example = info.example || this.schema.example;

    if (info.examples !== undefined) {
      this.examples = mapValues(
        info.examples,
        (example, name) => new ExampleModel(parser, example, name, info.encoding),
      );
    }

    if (serializationMime) {
      this.serializationMime = serializationMime;
    } else if (info.style) {
      this.style = info.style;
    } else if (this.in) {
      this.style = DEFAULT_SERIALIZATION[this.in]?.style ?? 'form'; // fallback to from in case "in" is invalid
    }

    if (info.explode === undefined && this.in) {
      this.explode = DEFAULT_SERIALIZATION[this.in]?.explode ?? true;
    } else {
      this.explode = !!info.explode;
    }

    this.deprecated = info.deprecated === undefined ? !!this.schema.deprecated : info.deprecated;
    parser.exitRef(infoOrRef);

    if (options.showExtensions) {
      this.extensions = extractExtensions(info, options.showExtensions);
    }
  }

  @action
  toggle() {
    this.expanded = !this.expanded;
  }

  //EXTENDED SEARCH START
  @action
  activate() {
    if (this.parent) {
      this.parent.activate();
      if (this.responseContainer !== undefined) {
        this.responseContainer.expand();
      }
      if (this.containerContentModel !== undefined && this.activeContentModel !== undefined) {
        this.containerContentModel.activate(this.activeContentModel);
      }
      if (this.containerOneOf !== undefined && this.activeOneOf !== undefined) {
        this.containerOneOf.activateOneOf(this.activeOneOf);
      }
    }
  }

  @action
  deactivate() {
    if (this.parent) {
      this.parent.deactivate();
    }
  }

  @action
  expand() {
    if (this.parent) {
      if (this.parent.type === 'field') {
        this.parent.expanded = true;
      }
      this.parent.expand();
    }
  }

  collapse() {
    // Do nothing
  }
  //EXTENDED SEARCH END
}
