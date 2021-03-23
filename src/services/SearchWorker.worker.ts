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
  object: string;
  property: string;
  endpoint: string;
  id: string;
}

export interface SearchResult<T = string> {
  meta: T;
  score: number;
}

let store: any[] = [];

lunr.tokenizer.separator = /\s+/;

const regex = /(POST|GET|PATCH|DELETE)|(TITLE|PATH|QUERY|REQ|RESP)\[(.+?)\]/g;
//let regexp2: RegExp = /\[\w+\]+/g;

let builder: lunr.Builder;

let resolveIndex: (v: lunr.Index) => void;

let index: Promise<lunr.Index>;

let myStopWordFilter = lunr.generateStopWordFilter([
  'a',
  'able',
  'about',
  'across',
  'after',
  'all',
  'almost',
  'also',
  'am',
  'among',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'because',
  'been',
  'but',
  'by',
  'can',
  'cannot',
  'could',
  'dear',
  'did',
  'do',
  'does',
  'either',
  'else',
  'ever',
  'every',
  'for',
  'from',
  'got',
  'had',
  'has',
  'have',
  'he',
  'her',
  'hers',
  'him',
  'his',
  'how',
  'however',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'just',
  'least',
  'let',
  'like',
  'likely',
  'may',
  'me',
  'might',
  'most',
  'must',
  'my',
  'neither',
  'no',
  'nor',
  'not',
  'of',
  'off',
  'often',
  'on',
  'only',
  'or',
  'other',
  'our',
  'own',
  'rather',
  'said',
  'say',
  'says',
  'she',
  'should',
  'since',
  'so',
  'some',
  'than',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'tis',
  'to',
  'too',
  'twas',
  'us',
  'wants',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'whom',
  'why',
  'will',
  'with',
  'would',
  'yet',
  'you',
  'your'
]);
//lunr.stopWordFilter 
// initialize a new builder
function initEmpty() {
  builder = new lunr.Builder();
  builder.field('title', { boost: 10 });
  builder.field('description');
  builder.field('longDescription'); //anthony added longdescription
  builder.field('path');
  builder.field('query');
  builder.field('object');
  builder.field('property');
  builder.field('endpoint');
  builder.ref('ref');
  
  
  builder.pipeline.add(lunr.trimmer, lunr.stopWordFilter, lunr.stemmer);
  builder.pipeline.after(lunr.stopWordFilter, myStopWordFilter)
  builder.pipeline.remove(lunr.stopWordFilter)

  // index is our lunr.Index. It is wrapped in a Promise object because it is an asynchronous function and we wanna wait for
  // the search to complete before continuing execution. i.e. trying to access the SearchResults
  index = new Promise(resolve => {
    resolveIndex = resolve;
  });
}

initEmpty();

const expandTerm = term => '*' + lunr.stemmer(new lunr.Token(term, {})) + '*';

export function add<T>(title: string, description: string, longDescription: string, path: string, query: string, object: string, property: string, endpoint: string, meta?: T) { //anthony added longdescription 
  const ref = store.push(meta) - 1;
  const item = { title: title.toLowerCase(), description: description.toLowerCase(), longDescription: longDescription.toLowerCase(), path: path.toLowerCase(), query: query.toLowerCase(), object: object.toLowerCase(), property: property.toLowerCase(), endpoint: endpoint.toLowerCase(), ref }; //anthony added longdescription
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
// regexr
// const regex = /(TITLE|PATH|QUERY|REQ|RESP)\[(\w+)\]*/g;

//const regex = /(TITLE|PATH|QUERY|OBJECT|PROPERTY)\[(.+?)\]/g;
// ex: PATH[uuid], PATH[uuid] QUERY[sizing_method]

export async function search<Meta = string>(
  q: string,
  limit = 0,
): Promise<Array<SearchResult<Meta>>> {
  if (q.trim().length === 0) {
    return [];
  } // a query object is given to the Index.query() function which should be used to express the query to be run against the index
  let searchResults = (await index).query(queryObject => {
    q.trim();

    const arrInput: Array<RegExpMatchArray> = [];
    let i: any;
    while((i = regex.exec(q)) !== null) {
      arrInput.push(i);
    }
    console.log("while loop results");
    console.log(arrInput);

    const fieldsArray: string[] = [];
    const searchItems: string[] = [];

    arrInput.forEach(searchTerm => {
      if(searchTerm[1] !== undefined) {
        searchTerm[1].trim().toLowerCase().split(/\s+/).forEach(item => {
          fieldsArray.push('endpoint');
          searchItems.push(item);
        })
      }
      if(searchTerm[2] !== undefined) {
        fieldsArray.push(searchTerm[2].toLowerCase());
      }
        //split searchTerm items into separate tokens and pass into searchItems array individually
        if(searchTerm[3] !== undefined) {
        searchTerm[3].trim().toLowerCase().split(/\s+/).forEach(item => {
          searchItems.push(item);
        });
      }
        
    }); 

    console.log("fields then search");
    console.log(fieldsArray);
    console.log(searchItems);
    console.log("fields length");
    console.log(fieldsArray.length);

    if(searchItems.length === 0) {
      if(q.length === 1) return;
      q.toLowerCase()
        .split(/\s+/) // splits on spaces
        .forEach(term => {
          if (term.length === 1) return;
          const exp = expandTerm(term);
          queryObject.term(exp, {
            fields: ['title','description','longDescription']
          });
      })
    }
    else {
      
    }
    // for each term that we find 
    let count = 0;
    searchItems.forEach(term => {
      if(term.length === 1) return;
      const exp = expandTerm(term);
      // if there are no filters, perform a default search on the titles, descriptions, and long descriptions
      queryObject.term(exp, {fields: [fieldsArray[count]] });
      count++;
    })
  });

  if (limit > 0) {
    searchResults = searchResults.slice(0, limit);
  }
  return searchResults.map(res => ({ meta: store[res.ref], score: res.score }));
}


/*
export async function search<Meta = string>(
  q: string,
  limit = 0,
): Promise<Array<SearchResult<Meta>>> {
  if (q.trim().length === 0) {
    return [];
  } // a query object is given to the Index.query() function which should be used to express the query to be run against the index
  let searchResults = (await index).query(queryObject => {
     q.trim();
       //.toLowerCase()
       //.split(/\s+/) // splits spaces
      // .forEach(term => {
       //  console.log("term");
       //   console.log(term);
       //  if (term.length === 1) return;
        // const exp = expandTerm(term);
        // queryObject.term(exp, {});
      // });
    const arrInput: Array<RegExpMatchArray> = [];
    let searchParameters: any;
    while((searchParameters = regex.exec(q)) !== null) {
      arrInput.push(searchParameters);
    }
    //console.log(searchParameters);
    console.log(arrInput);
    let fieldsArray: string[] = [];
    let searchItems: string[] = [];
    arrInput.forEach(searchTerm => {
      if(searchTerm[1] !== undefined) {
        searchTerm[1].trim().toLowerCase().split(/\s+/).forEach(item => {
          fieldsArray.push('endpoint');
          searchItems.push(item);
        })
      }
      if(searchTerm[2] !== undefined) {
        fieldsArray.push(searchTerm[2].toLowerCase());
      }
        //split searchTerm items into separate tokens and pass into searchItems array individually
        if(searchTerm[3] !== undefined) {
        searchTerm[3].trim().toLowerCase().split(/\s+/).forEach(item => {
          searchItems.push(item);
        });
      }
        
    });
    console.log("fields then search");
    console.log(fieldsArray);
    console.log(searchItems);
    //if no fields specified only search description
    //if(fieldsArray.length === 0){
     // console.log("fieldsArray length " + fieldsArray.length);
     // fieldsArray.push('description');
    //}
    let count = 0;
    searchItems.forEach(term => {
      if (term.length === 1) return;
      const exp = expandTerm(term);
      queryObject.term(exp, {fields: [fieldsArray[count]]});
      count++;
    }); 
        /* //queryObject.term(lunr.stemmer(new lunr.Token(q, {})), {
          queryObject.term(searchItems, {
          fields: fieldsArray,
          boost: 10,
          wildcard: lunr.Query.wildcard.TRAILING,
        });*/
      // });
  //});