import { IS_BROWSER } from '../utils/';
import { IMenuItem } from './MenuStore';
import { OperationModel } from './models';

import Worker from './SearchWorker.worker';


// SearchStore stores the information to be searched

let operationId; 
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
    //console.log(groups);
    
    groups.forEach(group => {
      
      if (group.type === 'operation') {
        operationId = group.id;
        // @ts-ignore
        this.add(group.name, group.description, group.longDescription || '', group.id);
      }
      else if (group.type === 'field') {
        this.add(group.name, group.description || '', group.longDescription || '', operationId);
      }
      else if(group.type !== 'group'){
        //this.add(group.name, group.description || '', group.longDescription!, group.id);
        this.add(group.name, group.description || '', group.longDescription || '', group.id as any);

      }
      

    });

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
    console.log("making a search");
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
}
