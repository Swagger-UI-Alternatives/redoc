import { action, observable, makeObservable } from 'mobx';
import { querySelector } from '../utils/dom';
import { SpecStore } from './models';

import { history as historyInst, HistoryService } from './HistoryService';
import { ScrollService } from './ScrollService';

import { flattenByProp, SECURITY_SCHEMES_SECTION_PREFIX } from '../utils';
import { GROUP_DEPTH } from './MenuBuilder';

export type MenuItemGroupType = 'group' | 'tag' | 'section';

export type MenuItemType = MenuItemGroupType | 'operation';
/** Generic interface for MenuItems */
export interface IMenuItem {
  id: string;
  absoluteIdx?: number;
  name: string;
  description?: string;
  longDescription?: string;
  introducedIn?: string;  // version-control
  deprecatedIn?: string;  // version-control
  depth: number;
  active: boolean;
  expanded: boolean;
  items: IMenuItem[];
  parent?: IMenuItem;
  deprecated?: boolean;
  type: MenuItemType;

  deactivate(): void;
  activate(): void;

  collapse(): void;
  expand(): void;
}

export const SECTION_ATTR = 'data-section-id';

/**
 * Stores all side-menu related information
 */
export class MenuStore {
  /**
   * Statically try update scroll position
   * Used before hydrating from server-side rendered html to scroll page faster
   */
  static updateOnHistory(id: string = historyInst.currentId, scroll: ScrollService) {
    if (!id) {
      return;
    }
    scroll.scrollIntoViewBySelector(`[${SECTION_ATTR}="${id}"]`);
  }

  /**
   * active item absolute index (when flattened). -1 means nothing is selected
   */
  @observable
  activeItemIdx: number = -1;

  /**
   * whether sidebar with menu is opened or not
   */
  @observable
  sideBarOpened: boolean = false;

  items: IMenuItem[];
  flatItems: IMenuItem[];
  isFirstItem: boolean = true;
  isLastItem: boolean = false;
  isTag: boolean = false;
  /**
   * cached flattened menu items to support absolute indexing
   */
  private _unsubscribe: () => void;
  private _hashUnsubscribe: () => void;

  /**
   *
   * @param spec [SpecStore](#SpecStore) which contains page content structure
   * @param scroll scroll service instance used by this menu
   */
  constructor(spec: SpecStore, public scroll: ScrollService, public history: HistoryService) {
    makeObservable(this);

    this.items = spec.contentItems;

    this.flatItems = flattenByProp(this.items || [], 'items');
    this.flatItems.forEach((item, idx) => (item.absoluteIdx = idx));

    this.subscribe();
  }

  subscribe() {
    this._unsubscribe = this.scroll.subscribe(this.updateOnScroll);
    this._hashUnsubscribe = this.history.subscribe(this.updateOnHistory);
  }

  @action
  toggleSidebar() {
    this.sideBarOpened = this.sideBarOpened ? false : true;
  }

  @action
  closeSidebar() {
    this.sideBarOpened = false;
  }

  /**
   * update active items on scroll
   * @param isScrolledDown whether last scroll was downside
   */
  updateOnScroll = (isScrolledDown: boolean): void => {
    const step = isScrolledDown ? 1 : -1;
    let itemIdx = this.activeItemIdx;
    while (true) {
      if (itemIdx === -1 && !isScrolledDown) {
        break;
      }

      if (itemIdx >= this.flatItems.length - 1 && isScrolledDown) {
        break;
      }

      if (isScrolledDown) {
        // gets current element
        const el = this.getElementAtOrFirstChild(itemIdx + 1);
        // if there is an element below that then break
        // i.e. we want to stay at the current index
        if (this.scroll.isElementBellow(el)) {
          break;
        }
        // else we move on from this big if else-if and see if our current item is at a boundary
        else if (this.isFirstItem === true) {
          itemIdx++;
          this.isFirstItem = false;
          break;
        }
        else if (this.isTag === true) {
          itemIdx++;
          this.isTag = false;
          break;
        }
      }
      else if (!isScrolledDown) {
        const el = this.getElementAt(itemIdx);
        if (this.scroll.isElementAbove(el)) {
          break;
        }
        // case when we scroll up and should activate the second to last item
        else if (this.isLastItem === true) {
          itemIdx--;
          this.isLastItem = false;
          break;
        }
      }

      // if this is a section going into another section
      if (itemIdx >= 0 && this.flatItems[itemIdx] !== undefined && this.flatItems[itemIdx].type === 'section') {
        // if this is the section right before a tag, stay on it
        if (this.flatItems[itemIdx + 1].type !== 'section') {
          this.isLastItem = true;
          break;
        }
        // this is not the last section so change sections
        else {
          this.isLastItem = false;
        }
      }

      // stops tag from going into tag/section above
      if (this.flatItems[itemIdx].parent === undefined && this.flatItems[itemIdx].type === 'tag') {
        this.isTag = true;
        break;
      }

      // operations in a tag
      if (itemIdx >= 0 && this.flatItems[itemIdx].parent !== undefined) {
        const parentItem: IMenuItem | undefined = this.flatItems[itemIdx].parent;
        const parentIndex = parentItem?.absoluteIdx;
        // last item in tag
        if (parentItem !== undefined && parentIndex !== undefined && itemIdx >= (parentIndex + parentItem.items.length)) {
          this.isLastItem = true;
          break;
        }
        // first item in tag
        else if (parentIndex !== undefined && itemIdx === (parentIndex)) {
          this.isFirstItem = true;
          break;
        }
        // neither
        else {
          this.isLastItem = false;
          this.isFirstItem = false;
        }
      }

      itemIdx += step;
    }

    this.activate(this.flatItems[itemIdx], true, true);
  };

  /**
   * update active items on hash change
   * @param id current hash
   */
  updateOnHistory = (id: string = this.history.currentId) => {
    if (!id) {
      return;
    }
    let item: IMenuItem | undefined;

    item = this.flatItems.find(i => i.id === id);
    if (item) {
      this.activateAndScroll(item, false);
    } else {
      if (id.startsWith(SECURITY_SCHEMES_SECTION_PREFIX)) {
        item = this.flatItems.find(i => SECURITY_SCHEMES_SECTION_PREFIX.startsWith(i.id));
        this.activate(item);
      }
      this.scroll.scrollIntoViewBySelector(`[${SECTION_ATTR}="${id}"]`);
    }
  };

  /**
   * get section/operation DOM Node related to the item or null if it doesn't exist
   * @param idx item absolute index
   */
  getElementAt(idx: number): Element | null {
    const item = this.flatItems[idx];
    return (item && querySelector(`[${SECTION_ATTR}="${item.id}"]`)) || null;
  }

  /**
   * get section/operation DOM Node related to the item or if it is group item, returns first item of the group
   * @param idx item absolute index
   */
  getElementAtOrFirstChild(idx: number): Element | null {
    let item = this.flatItems[idx];
    if (item && item.type === 'group') {
      item = item.items[0];
    }
    return (item && querySelector(`[${SECTION_ATTR}="${item.id}"]`)) || null;
  }

  /**
   * current active item
   */
  get activeItem(): IMenuItem {
    return this.flatItems[this.activeItemIdx] || undefined;
  }

  getItemById = (id: string) => {
    return this.flatItems.find(item => item.id === id);
  };

  /**
   * activate menu item
   * @param item item to activate
   * @param updateLocation [true] whether to update location
   * @param rewriteHistory [false] whether to rewrite browser history (do not create new entry)
   */
  @action
  activate(
    item: IMenuItem | undefined,
    updateLocation: boolean = true,
    rewriteHistory: boolean = false,
  ) {
    if ((this.activeItem && this.activeItem.id) === (item && item.id)) {
      return;
    }

    if (item && item.type === 'group') {
      return;
    }

    this.deactivate(this.activeItem);
    if (!item) {
      this.history.replace('', rewriteHistory);
      return;
    }

    // do not allow activating group items
    // TODO: control over options
    if (item.depth <= GROUP_DEPTH) {
      return;
    }

    this.activeItemIdx = item.absoluteIdx!;
    if (updateLocation) {
      this.history.replace(item.id, rewriteHistory);
    }

    item.activate();
    item.expand();
  }

  /**
   * makes item and all the parents not active
   * @param item item to deactivate
   */
  deactivate(item: IMenuItem | undefined) {
    if (item === undefined) {
      return;
    }
    item.deactivate();
    while (item !== undefined) {
      item.collapse();
      item = item.parent;
    }
  }

  /**
   * activate menu item and scroll to it
   * @see MenuStore.activate
   */
  @action.bound
  activateAndScroll(
    item: IMenuItem | undefined,
    updateLocation?: boolean,
    rewriteHistory?: boolean,
  ) {
    // item here can be a copy from search results so find corresponding item from menu
    const menuItem = (item && this.getItemById(item.id)) || item;
    this.activate(menuItem, updateLocation, rewriteHistory);
    this.scrollToActive();
    if (!menuItem || !menuItem.items.length) {
      this.closeSidebar();
    }
  }

  /**
   * scrolls to active section
   */
  scrollToActive(): void {
    this.scroll.scrollIntoView(this.getElementAt(this.activeItemIdx));
  }

  dispose() {
    this._unsubscribe();
    this._hashUnsubscribe();
  }
}
