import { observer } from 'mobx-react';
import * as React from 'react';
import { IMenuItem, MenuStore } from '../../services';
import { ContentItems } from './ContentItems';
import { ACTIVE_T } from '../../services/MenuBuilder';

@observer
export class SingleContentItem extends React.Component<{
  menu: MenuStore;
}> {
  extractActive(menu: MenuStore): IMenuItem[] {
    const active = menu.flatItems[menu.activeItemIdx];
    //const activeParent = menu.flatItems[menu.activeItemIdx];
    console.log(active);
    //console.log(ACTIVE_T[active.id]);
    
    if (!active) {
      console.log("NOT ACTIVE");
      return [menu.flatItems[0]];
    }
    if (active.type !== 'operation') {
      console.log("NOT OP");
      ACTIVE_T.set(active.name, true);
      return [{ ...active }];
    }
    console.log("OP");
    if(active.parent !== undefined){
      if(!active.parent.active){

        
          ACTIVE_T.set(active.parent.name, true);
          console.log("after " + ACTIVE_T.get(active.parent.name));
          return [{...(active.parent)}];
        

      }
    }
    return [];
  }

  render() {
    const { menu } = this.props;
    const activeItems = this.extractActive(menu);
    // if(activeItems.length === 0){
    //   return null;
    // }
    return <ContentItems items={activeItems as any} />;
  }
}