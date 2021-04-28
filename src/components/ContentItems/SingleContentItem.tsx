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
    const sectionArray: IMenuItem[] = [menu.flatItems[0]];

    if(!active) {
      for(let i = 1; menu.flatItems[i].type === 'section'; i++ ) {
        sectionArray.push(menu.flatItems[i]);
      }
      return sectionArray;
    }
    if(active.type !== 'operation' && active.type !== 'section') {
      return [{ ...active }];
    }
    if(active.parent !== undefined) {
      return [{...(active.parent)}];
    }
    else {
      for(let i = 1; menu.flatItems[i].type === 'section'; i++ ) {
        sectionArray.push(menu.flatItems[i]);
      }
      return sectionArray;
    }
  }

  render() {
    const { menu } = this.props;
    const activeItems = this.extractActive(menu);
    return <ContentItems items={activeItems as any} />;
  }
}