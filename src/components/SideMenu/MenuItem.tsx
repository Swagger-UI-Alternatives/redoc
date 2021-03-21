// import { observe } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';

import { ShelfIcon } from '../../common-elements/shelfs';
import { IMenuItem, OperationModel } from '../../services';
import { shortenHTTPVerb } from '../../utils/openapi';
import { MenuItems } from './MenuItems';
import { MenuItemLabel, MenuItemLi, MenuItemTitle, Versioning, OperationBadge } from './styled.elements'; // Jarod-added J-intro
// import { MenuItemLabel, MenuItemLi, MenuItemTitle, OperationBadge } from './styled.elements';
import { VERSION } from '../../services/MenuBuilder'; // Jarod-added J-version

import { l } from '../../services/Labels';

export interface MenuItemProps {
  item: IMenuItem;
  onActivate?: (item: IMenuItem) => void;
  withoutChildren?: boolean;
}

@observer
export class MenuItem extends React.Component<MenuItemProps> {
  ref = React.createRef<HTMLLabelElement>();

  activate = (evt: React.MouseEvent<HTMLElement>) => {
    this.props.onActivate!(this.props.item);
    evt.stopPropagation();
  };

  componentDidMount() {
    this.scrollIntoViewIfActive();
  }

  componentDidUpdate() {
    this.scrollIntoViewIfActive();
  }

  scrollIntoViewIfActive() {
    if (this.props.item.active && this.ref.current) {
      this.ref.current.scrollIntoViewIfNeeded();
    }
  }

  render() {
    const { item, withoutChildren } = this.props;
    return (
      <MenuItemLi onClick={this.activate} depth={item.depth} data-item-id={item.id}>
        {item.type === 'operation' ? (
          <OperationMenuItemContent {...this.props} item={item as OperationModel} />
        ) : (
          <MenuItemLabel depth={item.depth} active={item.active} type={item.type} ref={this.ref}>
            <MenuItemTitle title={item.name}>
              {item.name}
              {this.props.children}
            </MenuItemTitle>
            {(item.depth > 0 && item.items.length > 0 && (
              <ShelfIcon float={'right'} direction={item.expanded ? 'down' : 'right'} />
            )) ||
              null}
          </MenuItemLabel>
        )}
        {!withoutChildren && item.items && item.items.length > 0 && (
          <MenuItems
            expanded={item.expanded}
            items={item.items}
            onActivate={this.props.onActivate}
          />
        )}
      </MenuItemLi>
    );
  }
}

export interface OperationMenuItemContentProps {
  item: OperationModel;
}

@observer
export class OperationMenuItemContent extends React.Component<OperationMenuItemContentProps> {
  ref = React.createRef<HTMLLabelElement>();

  componentDidUpdate() {
    if (this.props.item.active && this.ref.current) {
      this.ref.current.scrollIntoViewIfNeeded();
    }
  }

  handleVersioning(item: OperationModel) {
    // hopefully we have the latest version at this point...
    // if this is a doc operation then do nothing.
    if(item.httpVerb === 'doc') {
      return(undefined);
    }

    // Note: I want to assign deprecated=true if deprecatedIn is assigned in Operation. 
    // Before rendering of the menuitems and the contentitems.

    // if the operation is deprecated, then
    if(item.deprecated) {
      // if deprecatedIn is not undefined, then give the version it is deprecated
      if(item.deprecatedIn !== 'DO_NOT_DISPLAY' && item.deprecatedIn !== undefined) {
        return(
          <Versioning>Deprecated in v{item.deprecatedIn}</Versioning>
        );
      }
      // if deprecated=true but version is not specified
      else {
        return(undefined);
      }
    }
    // else if introducedIn is not undefined
    else if(item.introducedIn !== 'DO_NOT_DISPLAY') {
      // if the introducedIn is equal to the latest version, then do New in
      if(item.introducedIn === VERSION) {
        return(
          <Versioning>New in v{item.introducedIn}</Versioning>
        );
      }
      // else the introducedIn prints Introduced in
      else {
        return(
          <Versioning>Introduced in v{item.introducedIn}</Versioning>
        );
      }
    }
    // otherwise
    else {
      return(undefined);
    }
  }
  // J-endDocTag J-badge this is how the OperationBadge gets sent from the local styled.elements.ts file to MenuItem to be rendered in the side menu
  render() {
    const { item } = this.props;

    return (
      <MenuItemLabel
        depth={item.depth}
        active={item.active}
        deprecated={item.deprecated}
        ref={this.ref}
      >
        {item.isWebhook ? (
          <OperationBadge type="hook">{l('webhook')}</OperationBadge>
        ) : (
          <OperationBadge type={item.httpVerb}>{shortenHTTPVerb(item.httpVerb)}</OperationBadge>
        )}
        <MenuItemTitle width="calc(100% - 38px)">
          {item.name}
          {this.props.children}
          {/* Jarod-added J-intro */}
          {this.handleVersioning(item)}
        </MenuItemTitle>
      </MenuItemLabel>
    );
  }
}
