import { IS_BROWSER } from '../utils/';
import { IMenuItem } from './MenuStore';
import { OperationModel } from './models';

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
    // console.log("groups");
    // console.log(groups);
    const recurse = items => {
      items.forEach(group => {
        if(group.type !== 'group') {
          // let params: string = "";
          // only operation types have the parameters/responses/etc.
          // if(group.type === 'operation') {
          //   console.log("operation "+ group.httpVerb +" group.parameters");
          //   console.log(group.parameters);
          //   const p = group.parameters;
          //   params = this.stringParamBuilder(p);
          // }
          this.add(group.name, group.description, group.longDescription || '', group.id); // anthony added longdescription
        }
        recurse(group.items);
      });
    };

    recurse(groups);
    this.searchWorker.done();
  }

  add(title: string, body: string, longDescription: string, meta?: T) { //anthony added longdescription
    this.searchWorker.add(title, body, longDescription, meta);
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
  // stringParamBuilder(parameters: FieldModel[]) {
  //   console.log("in method stringParamBuilder");
  //   let s = "";
  //   parameters.forEach(parameter => {
  //     console.log(parameter);
  //     console.log(parameter.in);
  //     console.log("style");
  //     console.log(parameter.style);
  //     if(parameter.in === "query") {
  //       s += parameter.name + " ";
  //       s += parameter.description + "\n";
  //     }
  //   });
  //   console.log(s);
  //   return s;
  // }
}
