import { IS_BROWSER } from '../utils/';
import { IMenuItem } from './MenuStore';
import { OperationModel, FieldModel } from './models';

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
          let params: string = "";
          // only operation types have the parameters/responses/etc.
          if(group.type === 'operation') {
            console.log(group.parameters);
            const p = group.parameters;
            params = this.stringParamBuilder(p);
          }
          this.add(group.name, group.description, params, group.longDescription || '', group.id); // anthony added longdescription
        }
        recurse(group.items);
      });
    };

    recurse(groups);
    this.searchWorker.done();
  }

  add(title: string, body: string, fieldModel: string, longDescription: string, meta?: T) { //anthony added longdescription
    this.searchWorker.add(title, body, fieldModel, longDescription, meta);
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
  stringParamBuilder(parameters: FieldModel[]) {
    console.log("method "+ parameters);
    let s = "";
    parameters.forEach(parameter => {
      console.log(parameter);
      if(parameter.in === "query") {
        s += parameter.name + " ";
        s += parameter.description + "\n";
      }
    });
    console.log(s);
    return s;
  }

  // static getOperationFields(
  //   parent: OperationModel,
  //   depth: number,
  // ): FieldModel[] {
  //   // our fields for an operation
  //   const fields: FieldModel[] = [];

  //   if (parent.parameters !== undefined) {
  //     const parameters = parent.parameters;
  //     fields.push(...this.getFields(parameters, parent, 'parameters', depth));
  //   }

  //   if (parent.requestBody !== undefined) {
  //     const body = parent.requestBody;
  //     const bodyFields: FieldModel[] = [];

  //     if (body.content) {
  //       const mediaTypes = body.content.mediaTypes;
  //       mediaTypes.forEach(mediaType => {
  //         const type = mediaType.name.split('/')[1];
  //         const schema = mediaType.schema;
  //         if (schema && schema.oneOf) { // One of
  //           let active = 0;
  //           schema.oneOf.forEach(s => {
  //             bodyFields.push(...this.getFields(s.fields, parent, 'body/' + type + '/' + s.title, depth).map(f => {
  //               f.containerContentModel = body.content;
  //               f.activeContentModel = mediaTypes.indexOf(mediaType);
  //               f.containerOneOf = schema;
  //               f.activeOneOf = active;
  //               return f;
  //             }));
  //             active++;
  //           });
  //         } else if (schema && schema.fields) {
  //           bodyFields.push(...this.getFields(schema.fields, parent, 'body/' + type, depth).map(f => {
  //             f.containerContentModel = body.content;
  //             f.activeContentModel = mediaTypes.indexOf(mediaType);
  //             return f;
  //           }));
  //         }
  //       });
  //       fields.push(...bodyFields);
  //     }
  //   }

  //   if (parent.responses !== undefined) {
  //     const responses = parent.responses;
  //     const responseFields: FieldModel[] = [];

  //     responses.forEach(response => {
  //       responseFields.push(...this.getFields(response.headers, parent, 'responses/' + response.code + '/headers', depth).map(r => {
  //         r.responseContainer = response;
  //         return r;
  //       }));

  //       if (response.content) {
  //         const mediaTypes = response.content.mediaTypes;
  //         mediaTypes.forEach(mediaType => {
  //           const type = mediaType.name.split('/')[1];
  //           const schema = mediaType.schema;
  //           if (schema && schema.oneOf) { // One of
  //             let active = 0;
  //             schema.oneOf.forEach(s => {
  //               responseFields.push(...this.getFields(s.fields, parent, 'responses/' + response.code + '/' + type + '/' + s.title, depth).map(f => {
  //                 f.responseContainer = response;
  //                 f.containerContentModel = response.content;
  //                 f.activeContentModel = mediaTypes.indexOf(mediaType);
  //                 f.containerOneOf = schema;
  //                 f.activeOneOf = active;
  //                 return f;
  //               }));
  //               active++;
  //             });
  //           } else if (schema && schema.fields) {
  //             responseFields.push(...this.getFields(schema.fields, parent, 'responses/' + response.code + '/' + type, depth).map(f => {
  //               f.responseContainer = response;
  //               f.containerContentModel = response.content;
  //               f.activeContentModel = mediaTypes.indexOf(mediaType);
  //               return f;
  //             }));
  //           }
  //         });
  //       }
  //     });
  //     fields.push(...responseFields);
  //   }

  //   return fields;
  // }

  // static getFields(fields, parent, section, depth): FieldModel[] {
  //   const temp: FieldModel[] = [];
  //   fields.forEach(field => {
  //     temp.push(...this.getDeepFields(field, parent, section, depth));
  //   });
  //   return temp.filter((field, index, self) => {
  //     return index === self.findIndex(f => {
  //       return f.id === field.id;
  //     });
  //   });
  // }

  // static getDeepFields(field: FieldModel, parent: ContentItemModel, section: string, depth: number): FieldModel[] {
  //   const temp: FieldModel[] = [];

  //   field.id = parent.id.includes(section) ? parent.id + '/' + safeSlugify(field.name) : parent.id + '/' + section + '/' + safeSlugify(field.name);
  //   field.parent = parent;
  //   temp.push(field);

  //   if (field.schema.fields !== undefined) {
  //     field.schema.fields.forEach(fieldInner => {
  //       temp.push(...this.getDeepFields(fieldInner, field, section, depth + 1));
  //     });
  //   }
  //   if (field.schema.items !== undefined && field.schema.items.fields !== undefined) {
  //     field.schema.items.fields.forEach(fieldInner => {
  //       temp.push(...this.getDeepFields(fieldInner, field, section, depth + 1));
  //     });
  //   }

  //   return temp;
  // }
}
