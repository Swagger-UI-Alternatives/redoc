import { IS_BROWSER } from '../utils/';
import { IMenuItem } from './MenuStore';
import { OperationModel, FieldModel, RequestBodyModel, ResponseModel } from './models';

import Worker from './SearchWorker.worker';


// SearchStore stores the information to be searched
function getWorker() {
  let worker: new () => Worker;
  if (IS_BROWSER) {
    try {
      // tslint:disable-next-line
      worker = require('workerize-loader?inline&fallback=false!./SearchWorker.worker');
    } catch (e) {
      worker = require('./SearchWorker.worker').default;
    }
  } else {
    worker = require('./SearchWorker.worker').default;
  }
  return new worker();
}

export class SearchStore<T> {
  searchWorker = getWorker();

  indexItems(groups: Array<IMenuItem | OperationModel>) {
    // print out some useful stuff
    console.log("groups");
    console.log(groups);
    const recurse = items => {
      items.forEach(group => {
        if(group.type !== 'group') {
          // only operation types have the parameters/responses/etc.
          let endpoint = '';
          if(group.type === 'operation') {
            endpoint = group.httpVerb;
            this.addParams(group.parameters, group.httpVerb, group.id);
            this.addRequestBody(group.requestBody, group.httpVerb, group.id);
            this.addResponses(group.responses, group.httpVerb, group.id);
          }
          this.add(group.name, group.description || '', group.longDescription || '', '', '', '', '', endpoint, group.id); // anthony added longdescription
        }
        recurse(group.items);
      });
    };
    recurse(groups);
    // once all the documents have been added to the index,
    // calls builder.build() in SearchWorker.worker. to build the index, creating an instance of lunr.Index
    this.searchWorker.done();
  }

  add(title: string, body: string, longDescription: string, path: string, query: string, object: string, property: string, endpoint: string, meta?: T) { //anthony added longdescription
    this.searchWorker.add(title, body, longDescription, path, query, object, property, endpoint, meta);
  }

  dispose() {
    (this.searchWorker as any).terminate();
    (this.searchWorker as any).dispose();
  }

  search(q: string) {
    return this.searchWorker.search<T>(q);
  }

  async toJS() {
    return this.searchWorker.toJS();
  }

  load(state: any) {
    this.searchWorker.load(state);
  }

  fromExternalJS(path?: string, exportName?: string) {
    if (path && exportName) {
      this.searchWorker.fromExternalJS(path, exportName)
    }
  }

  // function that adds all the parameters to a string to be searched for
  addParams(parameters: FieldModel[], endpoint: string, id: string) {
    parameters.forEach(parameter => {
      if(parameter.in === "path") {
        this.add('', '', '', parameter.name, '', '', '', endpoint, id as any);
      }
      if(parameter.in === "query") {
        this.add('', '', '', '', parameter.name, '', '', endpoint, id as any);
      }
    });
  }

  addRequestBody(requestBody: RequestBodyModel, endpoint: string, id: string) {
    if(requestBody as RequestBodyModel && requestBody.content) {
      const mediaTypes = requestBody.content.mediaTypes;
      mediaTypes.forEach(mediaType => {
        const schema = mediaType.schema;
        if(schema && schema.oneOf) {
          schema.oneOf.forEach(s => {
            this.getFields(s.fields as FieldModel[], endpoint, id, true);
          })
        }
        else if(schema && schema.fields) {
          this.getFields(schema.fields as FieldModel[], endpoint, id, true);
        }
      })
    }
  }

  addResponses(responses: ResponseModel[], endpoint: string, id: string) {
    responses.forEach(response => {
      if(response.content) {
        const mediaTypes = response.content.mediaTypes;
        mediaTypes.forEach(mediaType => {
          const schema = mediaType.schema;
          if(schema && schema.oneOf) {
            schema.oneOf.forEach(s => {
              this.getFields(s.fields as FieldModel[], endpoint, id, false);
            })
          }
          else if(schema && schema.fields) {
            this.getFields(schema.fields as FieldModel[], endpoint, id, false);
          }
        })
      }
    })
  }

  getFields(fields: FieldModel[], endpoint: string, id: string, isReq: boolean) {
    fields.forEach(field => {
      this.getDeepFields(field, endpoint, id, isReq);
    })
  }

  getDeepFields(field: FieldModel, endpoint: string, id: string, isReq: boolean) {
    // if a field has a schema with other fields
    if(field.schema.fields !== undefined) {
      field.schema.fields.forEach(f => {
        this.getDeepFields(f, endpoint, id, isReq);
      })
      this.add('', '', '', '', '', field.name, '', endpoint, id as any);
      return;
    }
    // if a field's schema doesn't have fields but the field's schema does have items in it
    if(field.schema.items !== undefined && field.schema.items.fields !== undefined) {
      field.schema.items.fields.forEach(f => {
        this.getDeepFields(f, endpoint, id, isReq);
      });
      this.add('', '', '', '', '', field.name, '', endpoint, id as any);
      return;
    }
    // this is where we would like to add properties
    if(field.name !== undefined) {
      this.add('', '', '', '', '', '', field.name, endpoint, id as any);
    }
  }

  /*
  static getFields(fields, parent, section, depth): FieldModel[] {
    const temp: FieldModel[] = [];
    fields.forEach(field => {
      temp.push(...this.getDeepFields(field, parent, section, depth));
    });
    return temp.filter((field, index, self) => {
      return index === self.findIndex(f => {
        return f.id === field.id;
      });
    });
  }

  static getDeepFields(field: FieldModel, parent: ContentItemModel, section: string, depth: number): FieldModel[] {
    const temp: FieldModel[] = [];

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
      temp.push(...this.getDeepFields(field, parent, section, depth));
    });
    return temp.filter((field, index, self) => {
      return index === self.findIndex(f => {
        return f.id === field.id;
      });
    });
  }

  static getDeepFields(field: FieldModel, parent: ContentItemModel, section: string, depth: number): FieldModel[] {
    const temp: FieldModel[] = [];

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
  }
  */
}
