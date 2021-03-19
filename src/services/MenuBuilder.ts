import {
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPISpec,
  OpenAPITag,
  Referenced,
  OpenAPIServer,
  OpenAPIPaths,
} from '../types';
import {
  isOperationName, safeSlugify,
  SECURITY_DEFINITIONS_COMPONENT_NAME,
  setSecuritySchemePrefix,
  JsonPointer,
} from '../utils';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FieldModel, GroupModel, OperationModel } from './models';
import { OpenAPIParser } from './OpenAPIParser';
import { RedocNormalizedOptions } from './RedocNormalizedOptions';

export type TagInfo = OpenAPITag & {
  operations: ExtendedOpenAPIOperation[];
  used?: boolean;
};

export type ExtendedOpenAPIOperation = {
  pointer: string;
  pathName: string;
  httpVerb: string;
  pathParameters: Array<Referenced<OpenAPIParameter>>;
  pathServers: Array<OpenAPIServer> | undefined;
  isWebhook: boolean;
} & OpenAPIOperation;

export type TagsInfoMap = Record<string, TagInfo>;

export interface TagGroup {
  name: string;
  tags: string[];
}

export const GROUP_DEPTH = 0;

export let VERSION: string = '';  // Jarod-added J-version
export type ContentItemModel = GroupModel | OperationModel | FieldModel; //EXTENDED SEARCH added in FieldModel
//export type ContentItemModel = GroupModel | OperationModel;

export class MenuBuilder {
  /**
   * Builds page content structure based on tags
   */

  static buildStructure(
    parser: OpenAPIParser,
    options: RedocNormalizedOptions,
  ): ContentItemModel[] {
    const spec = parser.spec;

    const items: ContentItemModel[] = [];
    const tagsMap = MenuBuilder.getTagsWithOperations(spec);
    items.push(...MenuBuilder.addMarkdownItems(spec.info.description || '', undefined, 1, options));
    if (spec['x-tagGroups'] && spec['x-tagGroups'].length > 0) {
      items.push(
        ...MenuBuilder.getTagGroupsItems(parser, undefined, spec['x-tagGroups'], tagsMap, options),
      );
    } else {
      items.push(...MenuBuilder.getTagsItems(parser, tagsMap, undefined, undefined, options));
    }
    return items;
  }

  /**
   * extracts items from markdown description
   * @param description - markdown source
   */
  static addMarkdownItems(
    description: string,
    parent: GroupModel | undefined,
    initialDepth: number,
    options: RedocNormalizedOptions,
  ): ContentItemModel[] {
    const renderer = new MarkdownRenderer(options);
    const headings = renderer.extractHeadings(description || '');

    if (headings.length && parent && parent.description) {
      parent.description = MarkdownRenderer.getTextBeforeHading(
        parent.description,
        headings[0].name,
      );
    }

    const mapHeadingsDeep = (_parent, items, depth = 1) =>
      items.map(heading => {
        const group = new GroupModel('section', heading, _parent);
        group.depth = depth;
        if (heading.items) {
          group.items = mapHeadingsDeep(group, heading.items, depth + 1);
        }
        if (
          MarkdownRenderer.containsComponent(
            group.description || '',
            SECURITY_DEFINITIONS_COMPONENT_NAME,
          )
        ) {
          setSecuritySchemePrefix(group.id + '/');
        }
        return group;
      });

    return mapHeadingsDeep(parent, headings, initialDepth);
  }

  /**
   * Returns array of OperationsGroup items for the tag groups (x-tagGroups vendor extension)
   * @param tags value of `x-tagGroups` vendor extension
   */
  static getTagGroupsItems(
    parser: OpenAPIParser,
    parent: GroupModel | undefined,
    groups: TagGroup[],
    tags: TagsInfoMap,
    options: RedocNormalizedOptions,
  ): GroupModel[] {
    const res: GroupModel[] = [];
    for (const group of groups) {
      const item = new GroupModel('group', group, parent);
      item.depth = GROUP_DEPTH;
      item.items = MenuBuilder.getTagsItems(parser, tags, item, group, options);
      res.push(item);
    }
    // TODO checkAllTagsUsedInGroups
    return res;
  }

  /**
   * Returns array of OperationsGroup items for the tags of the group or for all tags
   * @param tagsMap tags info returned from `getTagsWithOperations`
   * @param parent parent item
   * @param group group which this tag belongs to. if not provided gets all tags
   */
  static getTagsItems(
    parser: OpenAPIParser,
    tagsMap: TagsInfoMap,
    parent: GroupModel | undefined,
    group: TagGroup | undefined,
    options: RedocNormalizedOptions,
  ): ContentItemModel[] {
    let tagNames;

    if (group === undefined) {
      tagNames = Object.keys(tagsMap); // all tags
    } else {
      tagNames = group.tags;
    }

    const tags = tagNames.map(tagName => {
      if (!tagsMap[tagName]) {
        console.warn(`Non-existing tag "${tagName}" is added to the group "${group!.name}"`);
        return null;
      }
      tagsMap[tagName].used = true;
      return tagsMap[tagName];
    });

    const res: Array<GroupModel | OperationModel | FieldModel> = []; //EXTENDED SEARCH
    for (const tag of tags) {
      if (!tag) {
        continue;
      }
      const item = new GroupModel('tag', tag, parent);
      item.depth = GROUP_DEPTH + 1;

      // don't put empty tag into content, instead put its operations
      if (tag.name === '') {
        const items = [
          ...MenuBuilder.addMarkdownItems(tag.description || '', item, item.depth + 1, options),
          ...this.getOperationsItems(parser, undefined, tag, item.depth + 1, options),
        ];
        res.push(...items);
        continue;
      }

      item.items = [
        ...MenuBuilder.addMarkdownItems(tag.description || '', item, item.depth + 1, options),
        ...this.getOperationsItems(parser, item, tag, item.depth + 1, options),
      ];

      res.push(item);
    }
    return res;
  }

  /**
   * Returns array of Operation items for the tag
   * @param parent parent OperationsGroup
   * @param tag tag info returned from `getTagsWithOperations`
   * @param depth items depth
   */
  static getOperationsItems(
    parser: OpenAPIParser,
    parent: GroupModel | undefined,
    tag: TagInfo,
    depth: number,
    options: RedocNormalizedOptions,
  ): ContentItemModel[] { //EXTENDED SEARCH changed OperationModel to ContentItemModel
    if (tag.operations.length === 0) {
      return [];
    }

    const res: ContentItemModel[] = []; //EXTENDED SEARCH changed OperationModel to ContentItemModel
    for (const operationInfo of tag.operations) {
      const operation = new OperationModel(parser, operationInfo, parent, options);
      operation.depth = depth;
      // Jarod-added J-version
      if(operation.introducedIn !== undefined) {
        if(VERSION === '') {
          VERSION = operation.introducedIn;
        }
        else {
          if(operation.introducedIn > VERSION) {
            VERSION = operation.introducedIn;
          }
        }
      }
      res.push(operation);
      res.push(...this.getOperationFields(operation, depth+1)); //EXTENDED SEARCH added this line
    }
    return res;
  }

  //BEGIN EXTENDED SEARCH METHOD
  static getOperationFields(
    parent: OperationModel,
    depth: number,
  ): FieldModel[] {

    const fields: FieldModel[] = [];

    if (parent.parameters !== undefined) {
      const parameters = parent.parameters;
      fields.push(...this.getFields(parameters, parent, 'parameters', depth));
    }

    if (parent.requestBody !== undefined) {
      const body = parent.requestBody;
      const bodyFields: FieldModel[] = [];

      if (body.content) {
        const mediaTypes = body.content.mediaTypes;
        mediaTypes.forEach(mediaType => {
          const type = mediaType.name.split('/')[1];
          const schema = mediaType.schema;
          if (schema && schema.oneOf) { // One of
            let active = 0;
            schema.oneOf.forEach(s => {
              bodyFields.push(...this.getFields(s.fields, parent, 'body/' + type + '/' + s.title, depth).map(f => {
                f.containerContentModel = body.content;
                f.activeContentModel = mediaTypes.indexOf(mediaType);
                f.containerOneOf = schema;
                f.activeOneOf = active;
                return f;
              }));
              active++;
            });
          } else if (schema && schema.fields) {
            bodyFields.push(...this.getFields(schema.fields, parent, 'body/' + type, depth).map(f => {
              f.containerContentModel = body.content;
              f.activeContentModel = mediaTypes.indexOf(mediaType);
              return f;
            }));
          }
        });
        fields.push(...bodyFields);
      }
    }

    if (parent.responses !== undefined) {
      const responses = parent.responses;
      const responseFields: FieldModel[] = [];

      responses.forEach(response => {
        responseFields.push(...this.getFields(response.headers, parent, 'responses/' + response.code + '/headers', depth).map(r => {
          r.responseContainer = response;
          return r;
        }));

        if (response.content) {
          const mediaTypes = response.content.mediaTypes;
          mediaTypes.forEach(mediaType => {
            const type = mediaType.name.split('/')[1];
            const schema = mediaType.schema;
            if (schema && schema.oneOf) { // One of
              let active = 0;
              schema.oneOf.forEach(s => {
                responseFields.push(...this.getFields(s.fields, parent, 'responses/' + response.code + '/' + type + '/' + s.title, depth).map(f => {
                  f.responseContainer = response;
                  f.containerContentModel = response.content;
                  f.activeContentModel = mediaTypes.indexOf(mediaType);
                  f.containerOneOf = schema;
                  f.activeOneOf = active;
                  return f;
                }));
                active++;
              });
            } else if (schema && schema.fields) {
              responseFields.push(...this.getFields(schema.fields, parent, 'responses/' + response.code + '/' + type, depth).map(f => {
                f.responseContainer = response;
                f.containerContentModel = response.content;
                f.activeContentModel = mediaTypes.indexOf(mediaType);
                return f;
              }));
            }
          });
        }
      });
      fields.push(...responseFields);
    }

    return fields;
  }

  static getFields(fields, parent, section, depth): FieldModel[] {
    const temp: FieldModel[] = [];
    fields.forEach(field => {
      if(field.name !== undefined) {
      temp.push(...this.getDeepFields(field, parent, section, depth));
      }
    });
    return temp.filter((field, index, self) => {
      return index === self.findIndex(f => {
        return f.id === field.id;
      });
    });
  }

  static getDeepFields(field: FieldModel, parent: ContentItemModel, section: string, depth: number): FieldModel[] {
    const temp: FieldModel[] = [];
    console.log(field.name); //debug
    field.id = parent.id.includes(section) ? parent.id + '/' + safeSlugify(field.name) : parent.id + '/' + section + '/' + safeSlugify(field.name);
    field.parent = parent;
    temp.push(field);

    if (field.schema.fields !== undefined) {
      field.schema.fields.forEach(fieldInner => {
        temp.push(...this.getDeepFields(fieldInner, field, section, depth + 1));
      });
    }
    if (field.schema.items !== undefined && field.schema.items.fields !== undefined) {
      field.schema.items.fields.forEach(fieldInner => {
        temp.push(...this.getDeepFields(fieldInner, field, section, depth + 1));
      });
    }

    return temp;
  } //END EXTENDED SEARCH METHOD

  /**
   * collects tags and maps each tag to list of operations belonging to this tag
   */
  static getTagsWithOperations(spec: OpenAPISpec): TagsInfoMap {
    const tags: TagsInfoMap = {};
    for (const tag of spec.tags || []) {
      tags[tag.name] = { ...tag, operations: [] };
    }

    getTags(spec.paths);
    if (spec['x-webhooks']) {
      getTags(spec['x-webhooks'], true);
    }
    // Jarod J-endDocTag added all the console.logs obvi
    function getTags(paths: OpenAPIPaths, isWebhook?: boolean) {
      for (const pathName of Object.keys(paths)) {
        console.log("pathName:");
        console.log(pathName);
        const path = paths[pathName];
        console.log("path:");
        console.log(path);
        const operations = Object.keys(path).filter(isOperationName);
        for (const operationName of operations) {
          // Jarod-added J-endDocTag added some console.log statements to see if doc or anything works
          console.log("Operation name:");
          console.log(operationName);
          const operationInfo = path[operationName];
          let operationTags = operationInfo.tags;
          // Jarod-added J-intro this is to check if x-ntap-introducedIn is being received. it is.
          // try to add the introduced string to the operation
          console.log("operationInfo:");
          console.log(operationInfo);

          if (!operationTags || !operationTags.length) {
            // empty tag
            operationTags = [''];
          }

          for (const tagName of operationTags) {
            let tag = tags[tagName];
            if (tag === undefined) {
              tag = {
                name: tagName,
                operations: [],
              };
              tags[tagName] = tag;
            }
            if (tag['x-traitTag']) {
              continue;
            }
            tag.operations.push({
              ...operationInfo,
              pathName,
              pointer: JsonPointer.compile(['paths', pathName, operationName]),
              httpVerb: operationName,
              pathParameters: path.parameters || [],
              pathServers: path.servers,
              isWebhook: !!isWebhook,
            });
          }
        }
      }
    }
    return tags;
  }
  static getVersion(): string {  // Jarod-added J-version to assign version to the version field in API Info
    return VERSION;
  }
}
