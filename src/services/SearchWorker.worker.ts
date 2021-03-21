import * as lunr from 'lunr';

try {
  // tslint:disable-next-line
  require('core-js/es/promise'); // bundle into worker
} catch (_) {
  // nope
}

/* just for better typings

JS already has a typeof operator you can use in an expression context.
TS adds a typeof operator you can use in a type context to refer to the type
of a variable or property.

*/
// these are all functions in the file that are being used in SearchStore
export default class Worker {
  add: typeof add = add;
  done = done;
  search: typeof search = search;
  toJS = toJS;
  load = load;
  dispose = dispose;
  fromExternalJS = fromExternalJS;
}

export interface SearchDocument {
  title: string;
  description: string;
  longDescription: string; //anthony added longdescription
  path: string;
  query: string;
  prop: string;
  id: string;
}

export interface SearchResult<T = string> {
  meta: T;
  score: number;
}

let store: any[] = [];

lunr.tokenizer.separator = /\s+/;

let builder: lunr.Builder;

let resolveIndex: (v: lunr.Index) => void;

let index: Promise<lunr.Index>;

// initialize a new builder
function initEmpty() {
  builder = new lunr.Builder();
  builder.field('title', { boost: 10 });
  builder.field('description');
  builder.field('longDescription'); //anthony added longdescription
  builder.field('path');
  builder.field('query');
  builder.field('req');
  builder.field('resp');
  builder.ref('ref');

  builder.pipeline.add(lunr.trimmer, lunr.stopWordFilter, lunr.stemmer);

  // index is our lunr.Index. It is wrapped in a Promise object because it is an asynchronous function and we wanna wait for
  // the search to complete before continuing execution. i.e. trying to access the SearchResults
  index = new Promise(resolve => {
    resolveIndex = resolve;
  });
}

initEmpty();

// const expandTerm = term => '*' + lunr.stemmer(new lunr.Token(term, {})) + '*';
// const expandTerm = term => '*' + new lunr.Token(term, {}) + '*';


export function add<T>(title: string, description: string, longDescription: string, path: string, query: string, req: string, resp: string, meta?: T) { //anthony added longdescription 
  const ref = store.push(meta) - 1;
  const item = { title: title.toLowerCase(), description: description.toLowerCase(), longDescription: longDescription.toLowerCase(), path: path.toLowerCase(), query: query.toLowerCase(), req: req.toLowerCase(), resp: resp.toLowerCase(), ref }; //anthony added longdescription
  console.log("adding item in SearchWorker.worker");
  console.log(item); //anthony

  builder.add(item);
}

export async function done() {
  resolveIndex(builder.build());
}
// serialize lunr index for faster client-side loading. Good for large, static websites
export async function toJS() {
  return {
    store,
    index: (await index).toJSON(),
  };
}

export async function fromExternalJS(path: string, exportName: string) {
  try {
    importScripts(path);
    if (!self[exportName]) {
      throw new Error('Broken index file format');
    }

    load(self[exportName]);
  }
  catch (e) {
    console.error('Failed to load search index: ' + e.message);
  }
}
// load the serialized index. much faster than building it from scratch
export async function load(state: any) {
  store = state.store;
  resolveIndex(lunr.Index.load(state.index));
}

export async function dispose() {
  store = [];
  initEmpty();
}

export async function search<Meta = string>(
  q: string,
  limit = 0,
): Promise<Array<SearchResult<Meta>>> {
  if (q.trim().length === 0) {
    return [];
  } // a query object is given to the Index.query() function which should be used to express the query to be run against the index
  let searchResults = (await index).query(queryObject => {
    // q.trim()
    //   .toLowerCase()
    //   .split(/\s+/) // splits spaces
    //   .forEach(term => {
    //     console.log("term");
    //     console.log(term);
    //     if (term.length === 1) return;
    //     const exp = expandTerm(term);
    //     console.log("exp");
    //     console.log(exp);
    //     queryObject.term(exp, {});

        queryObject.term(lunr.stemmer(new lunr.Token(q, {})), {
          fields: ['resp'],
          boost: 10,
          wildcard: lunr.Query.wildcard.TRAILING
        });
      // });
  });

  if (limit > 0) {
    searchResults = searchResults.slice(0, limit);
  }
  //console.log(searchResults); //anthony
  return searchResults.map(res => ({ meta: store[res.ref], score: res.score }));
}


