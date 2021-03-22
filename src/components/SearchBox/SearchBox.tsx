import * as React from 'react';

import { IMenuItem } from '../../services/MenuStore';
import { SearchStore } from '../../services/SearchStore';
import { MenuItem } from '../SideMenu/MenuItem';

import { MarkerService } from '../../services/MarkerService';
import { SearchResult } from '../../services/SearchWorker.worker';
// this package contains built-in typescript declarations
// https://www.npmjs.com/package/decko
// @bind: make the value of *this* constant within a method
// @debounce: throttle calls to a method
import { bind, debounce } from 'decko';
import { PerfectScrollbarWrap } from '../../common-elements/perfect-scrollbar';
// these are all in the same directory
import {
  ClearIcon,
  SearchIcon,
  SearchInput,
  SearchResultsBox,
  SearchWrap,
} from './styled.elements';

// when writing React components with TypeScript, you have 2 options for typing its props:
// use aliases or interfaces
// an interface is for where you want to enforce *structural contracts* (i.e. what you want passed in or what you want returned back)
// interface for DEFINING the SearchBox PROPS
export interface SearchBoxProps {
  // creates a generic SearchStore class, probably because there will be some operations that can only be done on a string
  // and we need to make sure those operations are available in the generic class.
  search: SearchStore<string>;
  marker: MarkerService;
  // make a function here with the parameter id which is a string
  // and you return either a IMenuItem or undefined
  getItemById: (id: string) => IMenuItem | undefined;
  // make a function that activates an item of type IMenuItem and returns void
  onActivate: (item: IMenuItem) => void;
  // className variable is an optional parameter that is of type string
  className?: string;
}
// this interface DEFINES the STATE of the component
export interface SearchBoxState {
  // results is an array of SearchResult objects
  results: SearchResult[];
  // the term string
  term: string;
  // activeItemIdx is the index of the results
  activeItemIdx: number;
}
export interface Aggregate {
  item: IMenuItem;
  score: number;
}
// SearchBox contains the props from SearchBoxProps and a SearchBoxState
// React.PureComponent is similar to React.Component. The difference between them is that React.Component doesn’t implement shouldComponentUpdate(), but React.PureComponent implements it with a shallow prop and state comparison.
// If your React component’s render() function renders the same result given the same props and state, you can use React.PureComponent for a performance boost in some cases.
// TS - Generic classes have a generic type parameter list in angle brackets (<>) following the name of the class.
// Must be generic class because SearchStore generic class takes in a generic type.
export class SearchBox extends React.PureComponent<SearchBoxProps, SearchBoxState> {
  // initialize the current activeItemReference which is a MenuItem or null and we are initializing it to null
  activeItemRef: MenuItem | null = null;
  // I guess you need a constructor because you need to initialize the props and set the state
  // since they are coming from outside the SearchBox class and have not yet been initialized.
  constructor(props) {
    super(props);
    this.state = {
      results: [],
      term: '',
      activeItemIdx: -1,
    };
  }
  // clears the results  but not the activeItemIndex (or term?)
  // and unmarks which is interesting!
  clearResults(term: string) {
    this.setState({
      results: [],
      term,
    });
    this.props.marker.unmark();
  }
  // clear
  clear = () => {
    this.setState({
      results: [],
      term: '',
      activeItemIdx: -1,
    });
    this.props.marker.unmark();
  };
  // this handles the keyboard functionality 
  handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if(event.keyCode === 27) {
      // ESC
      this.clear();
    }
    if(event.keyCode === 40) {
      // Arrow down
      this.setState({
        activeItemIdx: Math.min(this.state.activeItemIdx + 1, this.state.results.length - 1),
      });
      event.preventDefault();
    }
    if(event.keyCode === 38) {
      // Arrow up
      this.setState({
        activeItemIdx: Math.max(0, this.state.activeItemIdx - 1),
      });
      event.preventDefault();
    }
    if(event.keyCode === 13) {
      // enter
      const activeResult = this.state.results[this.state.activeItemIdx];
      if (activeResult) {
        const item = this.props.getItemById(activeResult.meta);
        if (item) {
          this.props.onActivate(item);
        }
      }
    }
  };
  // 
  setResults(results: SearchResult[], term: string) {
    console.log("setResults");
    this.setState({
      results,
    });
    this.props.marker.mark(term); //calls mark() from services/MarkerService.ts to highlight 
  }

  @bind
  @debounce(400)
  searchCallback(searchTerm: string) {
    console.log("searchCallback");
    // time to go into SearchStore
    this.props.search.search(searchTerm).then(res => {
      this.setResults(res, searchTerm);
    });
  }

  search = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("search");
    const q = event.target.value;
    // console.log(typeof(q));
    // it takes at least 3 characters to actually search for something
    if (q.length < 3) {
      this.clearResults(q);
      return;
    }

    this.setState(
      {
        term: q,
      },
      () => this.searchCallback(this.state.term),
    );
  };

  render() {
    const { activeItemIdx } = this.state;
    const results = this.state.results.map(res => ({
      item: this.props.getItemById(res.meta)!,
      score: res.score,
    }));

    //start anthony
    let currId = '';
    let index = 0,count=0;
    const aggResults: Aggregate[] = []; 
    results.sort(this.compare);
    
    results.forEach(curr => {
      if(curr !== undefined) {
    
        if(currId === ''){
          currId = curr.item.id;
          aggResults.push(curr); //push first onto results
          count++;
        }
        else if(curr.item.id === currId){
          aggResults[index].score += curr.score;
          count++;
        }
        else {
          aggResults[index].score = aggResults[index].score/count;
          currId = curr.item.id;
          aggResults.push(curr);
          index++;
          count=1;
        }
      }
    });
    //  console.log(aggResults);
    aggResults.sort((a, b) => b.score - a.score);

    // results.sort((a, b) => b.score - a.score);

    return (
      <SearchWrap role="search">
        {this.state.term && <ClearIcon onClick={this.clear}>×</ClearIcon>}
        <SearchIcon />
        <SearchInput
          value={this.state.term}
          onKeyDown={this.handleKeyDown}
          placeholder="Search..."
          aria-label="Search"
          type="text"
          onChange={this.search}
        />
        {aggResults.length > 0 && (
          <PerfectScrollbarWrap
            options={{
              wheelPropagation: false,
            }}
          >
            <SearchResultsBox data-role="search:results">
              {aggResults.map((res, idx) => (
                <MenuItem
                  item={Object.create(res.item, {
                    active: {
                      value: idx === activeItemIdx,
                    },
                  })}
                  onActivate={this.props.onActivate}
                  withoutChildren={true}
                  key={res.item.id}
                  data-role="search:result"
                />
              ))}
            </SearchResultsBox>
          </PerfectScrollbarWrap>
        )}
      </SearchWrap>
    );
  }
  compare( a, b ) {
    if ( a.item.id < b.item.id ){
      return -1;
    }
    if ( a.item.id > b.item.id ){
      return 1;
    }
    return 0;
  }
}
