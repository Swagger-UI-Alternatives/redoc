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
  QuestionIcon,
  QuestionToolTip
} from './styled.elements';

export interface SearchBoxProps {
  search: SearchStore<string>;
  marker: MarkerService;
  getItemById: (id: string) => IMenuItem | undefined;
  onActivate: (item: IMenuItem) => void;
  className?: string;
}
export interface SearchBoxState {
  results: SearchResult[];
  term: string;
  activeItemIdx: number;
}

export class SearchBox extends React.PureComponent<SearchBoxProps, SearchBoxState> {
  // initialize the current activeItemReference which is of type MenuItem or null and we are initializing it to null
  activeItemRef: MenuItem | null = null;

  constructor(props) {
    super(props);
    this.state = {
      results: [],
      term: '',
      activeItemIdx: -1,
    };
  }
  // clears the results but not the activeItemIndex
  clearResults(term: string) {
    this.setState({
      results: [],
      term,
    });
    this.props.marker.unmark();
  }
  // clear is called when user clicks x button
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
    // if ESC is pressed
    if(event.keyCode === 27) {
      this.clear();
    }
    // if Backspace or DEL is pressed
    if(event.keyCode === 8 || event.keyCode === 46) {
      // if the last character is about to be deleted
      if(this.state.term.length === 1) {
        this.clear();
      }
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
      // ENTER
      const activeResult = this.state.results[this.state.activeItemIdx];
      // if there is an activeResult navigate to it
      if(activeResult) {
        const item = this.props.getItemById(activeResult.meta);
        if(item) {
          this.props.onActivate(item);
        }
      }
      // otherwise perform a search
      else {
        // if length < 3
        if(this.state.term.length < 3) {
          this.clearResults(this.state.term);
        }
        else {
          this.setState(
            () => this.searchCallback(this.state.term),
          );
        }
      }
    }
  };

  setResults(results: SearchResult[], term: string) {
    console.log("setResults");
    this.setState({
      results,
    });
    // ex of a term:
    // PATCH PATH[uuid]
    // this goes into the marker to be marked.
    // so let's pull all searchTerms from the brackets to be highlighted with a regular expression
    // const s = term.split(/\s+]/) // splits on spaces
    const re = /[\w\/\.\-\{\}]+/g;
    const s = term.match(re);
    // console.log(s);
    // console.log(term);
    if(s !== null) {
      let a: string = "";
      s.forEach(i => {
        if(!(i === 'PATH' || i === 'QUERY' || i === 'OBJECT' || i === 'PROPERTY')) {
          a += i + " ";
        }
      })
      this.props.marker.mark(a); //calls mark() from services/MarkerService.ts to highlight 
    }
    else {
      this.props.marker.mark(term); //calls mark() from services/MarkerService.ts to highlight
    }
  }

  @bind
  @debounce(400)
  searchCallback(searchTerm: string) {
    console.log("searchCallback - making a search");
    this.props.search.search(searchTerm).then(res => {
      console.log("after callback: res");
      console.log(res);
      this.setResults(res, searchTerm);
    });
  }

  search = (event: React.ChangeEvent<HTMLInputElement>) => {
      const q = event.target.value;

      if(this.state.activeItemIdx !== -1) {
        this.setState({
          activeItemIdx: -1,
        });
      }

      this.setState({
        term: q,
      });
  };

  render() {
    const { activeItemIdx } = this.state;
    const results = this.state.results.map(res => ({
      item: this.props.getItemById(res.meta)!,
      score: res.score,
    }));

    results.sort((a, b) => b.score - a.score);

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
        {!this.state.term && <QuestionToolTip>
          <span className="tooltiptext">
            The following keywords are supported: GET, POST, PATCH, DELETE
            TITLE, PATH, QUERY, PROPERTY, OBJECT<br /><br />
            To search using a keyword, please use the following format: KEYWORD[search term]<br /><br />
            To search using multiple keywords, please include a space between them.
          </span>
          <QuestionIcon />
        </QuestionToolTip>}
        {results.length > 0 && (
          <PerfectScrollbarWrap
            options={{
              wheelPropagation: false,
            }}
          >
            <SearchResultsBox data-role="search:results">
              {results.map((res, idx) => (
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
}
