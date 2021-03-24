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
          if(group.type === 'operation') {
            this.addParams(group.parameters, group.httpVerb, group.name, group.id);
            this.addRequestBody(group.requestBody, group.httpVerb, group.name, group.id);
            this.addResponses(group.responses, group.httpVerb, group.name, group.id);
            this.add(group.name, group.description || '', group.longDescription || '', '', '', '', '', group.httpVerb, group.name, group.id); // anthony added longdescription
          }
          else {
            this.add(group.name, group.description || '', group.longDescription || '', '', '', '', '', '', '', group.id); // anthony added longdescription
          }
        }
        recurse(group.items);
      });
    };
    recurse(groups);
    // once all the documents have been added to the index,
    // calls builder.build() in SearchWorker.worker. to build the index, creating an instance of lunr.Index
    this.searchWorker.done();
  }

  add(title: string, body: string, longDescription: string, path: string, query: string, object: string, property: string, verb: string, endpoint: string, meta?: T) { //anthony added longdescription
    this.searchWorker.add(title, body, longDescription, path, query, object, property, verb, endpoint, meta);
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
  addParams(parameters: FieldModel[], verb: string, endpoint: string, id: string) {
    parameters.forEach(parameter => {
      if(parameter.in === "path") {
        this.add('', '', '', parameter.name, '', '', '', verb, endpoint, id as any);
      }
      if(parameter.in === "query") {
        this.add('', '', '', '', parameter.name, '', '', verb, endpoint, id as any);
      }
    });
  }

  addRequestBody(requestBody: RequestBodyModel, verb: string, endpoint: string, id: string) {
    if(requestBody as RequestBodyModel && requestBody.content) {
      const mediaTypes = requestBody.content.mediaTypes;
      mediaTypes.forEach(mediaType => {
        const schema = mediaType.schema;
        if(schema && schema.oneOf) {
          schema.oneOf.forEach(s => {
            this.getFields(s.fields as FieldModel[], verb, endpoint, id);
          })
        }
        else if(schema && schema.fields) {
          this.getFields(schema.fields as FieldModel[], verb, endpoint, id);
        }
      })
    }
  }

  addResponses(responses: ResponseModel[], verb: string, endpoint: string, id: string) {
    responses.forEach(response => {
      if(response.content) {
        const mediaTypes = response.content.mediaTypes;
        mediaTypes.forEach(mediaType => {
          const schema = mediaType.schema;
          if(schema && schema.oneOf) {
            schema.oneOf.forEach(s => {
              this.getFields(s.fields as FieldModel[], verb, endpoint, id);
            })
          }
          else if(schema && schema.fields) {
            this.getFields(schema.fields as FieldModel[], verb, endpoint, id);
          }
        })
      }
    })
  }

  getFields(fields: FieldModel[], verb: string, endpoint: string, id: string) {
    fields.forEach(field => {
      this.getDeepFields(field, verb, endpoint, id);
    })
  }

  getDeepFields(field: FieldModel, verb: string, endpoint: string, id: string) {
    // if a field has a schema with other fields
    if(field.schema.fields !== undefined) {
      field.schema.fields.forEach(f => {
        this.getDeepFields(f, verb, endpoint, id);
      })
      this.add('', '', '', '', '', field.name, '', verb, endpoint, id as any);
      return;
    }
    // if a field's schema doesn't have fields but the field's schema does have items in it
    if(field.schema.items !== undefined && field.schema.items.fields !== undefined) {
      field.schema.items.fields.forEach(f => {
        this.getDeepFields(f, verb, endpoint, id);
      });
      this.add('', '', '', '', '', field.name, '', verb, endpoint, id as any);
      return;
    }
    // this is where we would like to add properties
    if(field.name !== undefined) {
      this.add('', '', '', '', '', '', field.name, verb, endpoint, id as any);
    }
  }
}
