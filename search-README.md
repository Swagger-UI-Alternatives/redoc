# How to search within Redoc API visualizer:
### Overview:
* The search process works as a filtering method, parsing the user’s input into the necessary fields they provide. Here are the steps to properly search for an item within the API documentation using our Redoc implementation.

#### To search for a specific tag/endpoint:
* The user can type: GET POST PATCH DELETE DOC along with a single, optional, specific endpoint they are looking for to retrieve this specific tag and endpoint.

#### To search for a PATH, QUERY, OBJECT, PROPERTY:

* These components are located below the longDescriptions of each endpoint’s section
    * The PATH fields are under the “Path Parameters” section in the documentation
    * The QUERY fields are under the “Query Parameters” section in the documentation
    * OBJECT and PROPERTY are targeted fields under the “Request Body Schema” section
        * The OBJECT terms is followed by an arrow (“>”), with more information in schemas
        * The PROPERTY terms do not have this arrow

### If there are no filters, perform a default search:
* If you want to search for a tag, model, endpoint, or search in a description or long description, type your search input with spaces in between each word.
    * Ex: search "SSL/HTTPS" located in the long description of POST /cloud/targets
    * Results in a POST /cloud/targets
    * Ex: search “cloud target” located in many endpoints, tags, doc tags, and models
* Note: However, you cannot search for the descriptions of objects/properties
* If you want to search specifically for an endpoint like GET POST PATCH DELETE DOC (no tags or models included), you must begin the search with a ‘/’ (to differentiate a search on an endpoint vs a description or long description):
    * Correct: /cloud
    * Incorrect: cloud/
    * You can add one or more description or long description terms to search for:
        * Correct: /cloud SSL/HTTPS
        * Results in a POST /cloud/targets at the top of the search result and any endpoint that contains /cloud in its name.
    * Another ex:
        * Correct: /cloud SSL/HTTPS FlexGroup
        * Incorrect: /cloud /storage
        * Second endpoint is ignored

### Main search functionality:
```
verbFilter = {GET, POST, PATCH, DELETE, DOC}
KEYWORD = {PATH, QUERY, PROPERTY, OBJECT}
```
#### The rules of the search are as follows:
* You can search for none to all verb filters in any combination
    * Ex: GET POST
    * Ex: GET POST PATCH DELETE DOC
* You can search for a single endpoint
    * Ex: /cloud/targets/
* You can specifically search for one unique KEYWORD with one searchItem
    * Ex: PATH[aggregate.uuid]
    * Results in all endpoints with PATH with aggregate.uuid
* You can search with a KEYWORD with multiple searchItems
    * Ex: PATH[aggregate.uuid name]
    * Good example that results in all endpoints with aggregate.uuid and/or name as a PATH parameter with the highest ranked items being those that contain both aggregate.uuid and name at the top.
    * Top Result: GET /storage/aggregates/{aggregate.uuid}/plexes/{name}
* You can search for as many KEYWORDS and searchItems as you want
    * Ex: PATH[aggregate.uuid] QUERY[fields]
    * Ex: PATH[aggregate.uuid] QUERY[metric.status]
#### Putting them all together:
* Any verbFilters specified in the search are required in the search results
* If there is an endpoint specified in the search, it is required in the search results
* Endpoints are not required to have ‘/’ in front of them -- that was only required to differentiate searching a title from a description or long description
    * GET /network QUERY[fields]
    * GET /storage/aggregates/{aggregate.uuid}/plexes/{name}
    * /storage/aggregates PATH[aggregate.uuid] QUERY[fields]
        * Highest ranked are those with both KEYWORDs and the lowest ranked are those with only /storage/aggregates.
    * All three of the following searches are equivalent:
        * GET /storage/aggregates PATH[aggregate.uuid] QUERY[fields]
        * QUERY[fields] PATH[aggregate.uuid] /storage/aggregates GET
        * PATH[aggregate.uuid] QUERY[fields] GET /storage/aggregates
* This functionality is the same in combination with the PROPERTY and OBJECT KEYWORDs
