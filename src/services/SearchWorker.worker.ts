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
  verb: string;
  endpoint: string;
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

const myStopWordFilter = lunr.generateStopWordFilter([
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
  builder.field('verb');
  builder.field('endpoint');
  builder.ref('ref');
  
  // builder.pipeline.add(lunr.trimmer, lunr.stopWordFilter, lunr.stemmer);
  builder.pipeline.add(lunr.stopWordFilter, lunr.stemmer);

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

export function add<T>(title: string, description: string, longDescription: string, path: string[], query: string[], object: string[][], property: string[][], verb: string, endpoint: string, meta?: T) { //anthony added longdescription 
  const ref = store.push(meta) - 1;
  const obj = new Set(lunr.utils.asString(object).split(','));
  const prop = new Set(lunr.utils.asString(property).split(','));
  const item = { title: title.toLowerCase(), description: description.toLowerCase(), longDescription: longDescription.toLowerCase(), path: lunr.utils.asString(path), query: lunr.utils.asString(query), object: lunr.utils.asString(Array.from(obj)), property: lunr.utils.asString(Array.from(prop)), verb: verb.toLowerCase(), endpoint: endpoint.toLowerCase(), ref }; //anthony added longdescription
  // console.log("adding item in SearchWorker.worker");
  // console.log(item); //anthony
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

const regex = /(GET|POST|PATCH|DELETE)|([a-z\/\.\-\{\}]+)|(PATH|QUERY|PROPERTY|OBJECT)\[(.+?)\]/g;

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
    // console.log("while loop results");
    // console.log(arrInput);

    const verbFilter: string[] = [];
    const endpointFilter: string[] = [];
    const fieldsArray: string[] = [];
    const searchItems: Array<string[]> = [];

    const verbLookup = {
      get: true,
      post: true,
      patch: true,
      delete: true,
      doc: true,
    }

    function prohibitedCheck(verb: string) {
      switch(verb) {
        case 'get': // if the user inputted 'get' then it's 
          verbLookup.get = false; // not prohibited because that's what the user searched for
          break;
        case 'post':
          verbLookup.post = false;
          break;
        case 'patch':
          verbLookup.patch = false;
          break;
        case 'delete':
          verbLookup.delete = false;
          break;
        case 'doc':
          verbLookup.doc = false;
      }
    }
    // function that is called if at least one verb has been inputted (verbFilter.length > 0)
    // lists the verbs that are prohibited and they are filtered out
    function prohibitedVerbs() {
      const arr: string[] = []; // if there's at least one httpVerb in the user input
      if(verbLookup.get) {  // and if we haven't seen 'get' in the user input, then add it to the verbs we want to filter out
        // then 'get' is added to the prohibited array list
        arr.push(expandTerm('get'));
      }
      if(verbLookup.post) {
        arr.push(expandTerm('post'));
      }
      if(verbLookup.patch) {
        arr.push(expandTerm('patch'));
      }
      if(verbLookup.delete) {
        arr.push(expandTerm('delete'));
      }
      if(verbLookup.doc) {
        arr.push(expandTerm('doc'));
      }
      arr.push('');
      return arr;
    }

    arrInput.forEach(searchTerm => {
      if(searchTerm[1] !== undefined) {
        searchTerm[1].trim().toLowerCase().split(/\s+/).forEach(item => {
          prohibitedCheck(item);
          verbFilter.push(item);
        })
      }
      if(searchTerm[2] !== undefined) {
        endpointFilter.push(expandTerm(searchTerm[2]));
      }
      // keywords
      if(searchTerm[3] !== undefined) {
        fieldsArray.push(searchTerm[3].toLowerCase());
      }
      // split searchTerm items into separate tokens and pass into searchItems array individually
      if(searchTerm[4] !== undefined) {
        const arr: string[] = [];
        searchTerm[4].trim().toLowerCase().split(/\s+/).forEach(item => {
          arr.push(expandTerm(item));
        });
        searchItems.push(arr);
      }
    }); 

    // console.log("endpoints, fields, then search");
    // console.log(verbFilter);
    // console.log(fieldsArray);
    // console.log(searchItems);
    // console.log("verbLookup");
    // console.log(verbLookup);

    // if there are no filters, perform a default search on the titles, descriptions, and long descriptions
    // i.e. if there is no httpVerb before then this is performed
    // default search
    if(fieldsArray.length === 0 && verbFilter.length === 0) {
      // console.log("case 1");
      if(q.length === 1) return;
      q.toLowerCase()
        .split(/\s+/) // splits on spaces
        .forEach(term => {
          if(term.length === 1) return;
          const exp = expandTerm(term);
          queryObject.term(exp, {
            fields: ['title','description','longDescription']
          });
      })
    }
    // if there are no fields being searched (i.e. KEYWORD[searchTerm]) but there is at least one verb filter (GET, POST, PATCH, DELETE)
    else if(fieldsArray.length === 0 && endpointFilter.length === 0 && verbFilter.length > 0) {
      // console.log("case 2");
      // first get the verbs from the function that retrieves the verbs assigned prohibited (value = true)
        // if there's at least one httpVerb in the user input
        // and if we haven't seen 'get' in the user input, then add it to the verbs we want to filter out
        // then 'get' is added to the prohibited array list
      // match prohibitedVerbs list of strings against
      // filters out things we know we don't want in the results
      queryObject.term(prohibitedVerbs(), {
        fields: ['verb'], 
        presence: lunr.Query.presence.PROHIBITED  
      });
      // now we're getting every endpoint
      // we use title here to get any endpoint
      // /anything
      queryObject.term(['/'], {
        fields: ['title'],  
        wildcard: lunr.Query.wildcard.TRAILING  
      });
    }
    /* NOW FOR THE PART WHEN WE BUILD OUR QUERY OBJECT WITH OTHER PIECES */
    // if there is at least one verbFilter
    else {
      if(verbFilter.length > 0) {
        queryObject.term(prohibitedVerbs(), {
          fields: ['verb'],
          presence: lunr.Query.presence.PROHIBITED
        });
      }
      // if there is at least one endpointFilter
      // NOTE **i think we should only support 1 endpointFilter at the most**
      if(endpointFilter.length === 1) {
        endpointFilter.forEach(ep => {
          queryObject.term(ep, {
            fields: ['endpoint'],
            presence: lunr.Query.presence.REQUIRED
          })
        });
      }
      // after the verbFilter/endpointFilter(s) happen (or not)
      // if there is at least one KEYWORD[searchTerm(s)]
      if(fieldsArray.length > 0 && searchItems.length > 0) {
        // console.log("case 3");
        let count: number = 0;
        // if there is only 1 fieldsArray we can specify that the presence is required
        if(fieldsArray.length === 1 && searchItems[count].length === 1) {
          // console.log("case 3.1: only one fieldsArray and searchItems[count] filter");
          queryObject.term(searchItems[count], {
            fields: [fieldsArray[count]],
            presence: lunr.Query.presence.REQUIRED
          })
        }
        // otherwise, there are multiple fieldsArrays (i.e. PATH[blah] QUERY[blah]) then this executes
        else {
          // console.log("case 3.2: multiple fieldArrays");
          // for each fields KEYWORD
          fieldsArray.forEach(field => {
            // add the searchItems and match against whatever fields
            queryObject.term(searchItems[count], {
              fields: [field]
            })
            count++;
          })
        }
      }
    }
  });

  if (limit > 0) {
    searchResults = searchResults.slice(0, limit);
  }
  console.log("searchResults");
  console.log(searchResults);
  const res = searchResults.map(res => ({ meta: store[res.ref], score: res.score }));
  console.log("res");
  console.log(res);
  return res;
}
