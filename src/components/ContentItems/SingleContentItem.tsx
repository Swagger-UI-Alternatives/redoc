import { observer } from 'mobx-react';
import * as React from 'react';
import { IMenuItem, MenuStore } from '../../services';
import { ContentItems } from './ContentItems';

@observer
export class SingleContentItem extends React.Component<{
  menu: MenuStore;
}> {
  extractActive(menu: MenuStore): IMenuItem[] {
    const active = menu.flatItems[menu.activeItemIdx];
    console.log(active);
    
    if (!active) {
      console.log("NOT ACTIVE");
      return [menu.flatItems[0]];
    }
    if (active.type !== 'operation') {
      console.log("NOT OP");
      return [{ ...active }];
    }
    console.log("OP");
    if(active.parent !== undefined){

      return [{...(active.parent)}];

    }
    return [];
  }

  render() {
    const { menu } = this.props;
    const activeItems = this.extractActive(menu);
    return <ContentItems items={activeItems as any} />;
  }
}