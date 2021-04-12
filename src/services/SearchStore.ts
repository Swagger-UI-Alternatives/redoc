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

interface ReturnObj {
  objects: string[];
  properties: string[];
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
            const params: string[][] = this.addParams(group.parameters);
            const req: string[][][] = this.addRequestBody(group.requestBody);
            const resp: string[][][] = this.addResponses(group.responses);
            const objects = req[0].concat(resp[0]);
            const properties = req[1].concat(resp[1]);
            this.add(group.name, group.description || '', group.longDescription || '', 
              params[0], params[1], objects, properties, group.httpVerb, group.name, group.id);
          }
          // group.name = models
          // objects and properties
          // everything else ''
          // the tag id
          else {
            this.add(group.name, group.description || '', group.longDescription || '', 
              [''], [''], [['']], [['']], '', '', group.id);
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

  add(title: string, body: string, longDescription: string, path: string[], query: string[], object: string[][], property: string[][], verb: string, endpoint: string, meta?: T) { //anthony added longdescription
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

  // function that returns the paths and queries of an operation as an object
  addParams(parameters: FieldModel[]): string[][] {
    const paths: string[] = [];
    const queries: string[] = [];
    parameters.forEach(parameter => {
      if(parameter.in === "path") {
        paths.push(parameter.name);
      }
      if(parameter.in === "query") {
        queries.push(parameter.name);
      }
    });
    return [paths, queries];
  }

  addRequestBody(requestBody: RequestBodyModel): string[][][] {
    const objects: string[][] = [];
    const properties: string[][] = [];
    if(requestBody as RequestBodyModel && requestBody.content) {
      const mediaTypes = requestBody.content.mediaTypes;
      mediaTypes.forEach(mediaType => {
        const schema = mediaType.schema;
        if(schema && schema.oneOf) {
          schema.oneOf.forEach(s => {
            const temp = this.getFields(s.fields as FieldModel[]);
            if(temp[0] !== undefined) {
              objects.push(temp[0]);
            }
            if(temp[1] !== undefined) {
              properties.push(temp[1]);
            }
          })
        }
        else if(schema && schema.fields) {
          const temp = this.getFields(schema.fields as FieldModel[]);
          if(temp[0] !== undefined) {
            objects.push(temp[0]);
          }
          if(temp[1] !== undefined) {
            properties.push(temp[1]);
          }
        }
      })
    }
    return [objects, properties];
  }

  addResponses(responses: ResponseModel[]): string[][][] {
    const objects: string[][] = [];
    const properties: string[][] = [];
    responses.forEach(response => {
      if(response.content) {
        const mediaTypes = response.content.mediaTypes;
        mediaTypes.forEach(mediaType => {
          const schema = mediaType.schema;
          if(schema && schema.oneOf) {
            schema.oneOf.forEach(s => {
              const temp = this.getFields(s.fields as FieldModel[]);
              if(temp[0] !== undefined) {
                objects.push(temp[0]);
              }
              if(temp[1] !== undefined) {
                properties.push(temp[1]);
              }
            })
          }
          else if(schema && schema.fields) {
            const temp = this.getFields(schema.fields as FieldModel[]);
            if(temp[0] !== undefined) {
              objects.push(temp[0]);
            }
            if(temp[1] !== undefined) {
              properties.push(temp[1]);
            }
          }
        })
      }
    })
    return [objects, properties];
  }

  getFields(fields: FieldModel[]): string[][] {
    let objects: string[] = [];
    let properties: string[] = [];
    let temp: ReturnObj = { objects: objects, properties: properties }
    fields.forEach(field => {
      temp = this.getDeepFields(field, temp);
      if(temp.objects !== undefined) {
        objects = objects.concat(temp.objects);
      }
      if(temp.properties !== undefined) {
        properties = properties.concat(temp.properties);
      }
    })
    return [objects, properties];
  }

  getDeepFields(field: FieldModel, temp: ReturnObj): ReturnObj | any {
    // if a field has a schema with other fields
    if(field.schema.fields !== undefined) {
      field.schema.fields.forEach(f => {
        temp = this.getDeepFields(f, temp);
      })
      // adds the field's name to the array of objects
      if(field.name !== undefined) {
        temp.objects.push(field.name);
      }
      return temp;
    }
    // if a field's schema doesn't have fields but the field's schema does have items in it
    if(field.schema.items !== undefined && field.schema.items.fields !== undefined) {
      field.schema.items.fields.forEach(f => {
        temp = this.getDeepFields(f, temp);
      });
      // adds the field's name to the array of objects
      if(field.name !== undefined) {
        temp.objects.push(field.name);
      }
      return temp;
    }
    // this is where we would like to add properties
    if(field.name !== undefined) {
      temp.properties.push(field.name);
      return temp;
    }
  }
}
