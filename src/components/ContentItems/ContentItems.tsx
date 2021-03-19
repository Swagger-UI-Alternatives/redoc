import { observer } from 'mobx-react';
import * as React from 'react';

import { ExternalDocumentation } from '../ExternalDocumentation/ExternalDocumentation';
import { AdvancedMarkdown } from '../Markdown/AdvancedMarkdown';
import { H1, H2, MiddlePanel, Row, Section, ShareLink } from '../../common-elements';
import { ContentItemModel } from '../../services/MenuBuilder';
import { GroupModel, OperationModel } from '../../services/models';
import { Operation } from '../Operation/Operation';

@observer
export class ContentItems extends React.Component<{
  items: ContentItemModel[];
}> {
  render() {
    const items = this.props.items;
    //console.log("items");
    //console.log(items);
    if (items.length === 0) {
      return null;
    }
    return items.map(item => {
      //console.log(<ContentItem key={item.id} item={item} />);
      return <ContentItem key={item.id} item={item} />;
    });
  }
}

export interface ContentItemProps {
  item: ContentItemModel;
}

@observer
export class ContentItem extends React.Component<ContentItemProps> {
  render() {
    const item = this.props.item;
    let content;
    const { type } = item;
    /*console.log("type");
   /console.log(type);*/
    switch (type) {
      case 'group':
        content = null;
        break;
      case 'field': //EXTENDED SEARCH
        return null;
      case 'tag':
      case 'section':
        content = <SectionItem {...this.props} />;
        break;
      case 'operation':
        content = <OperationItem item={item as any} />;
        break;
      default:
        content = <SectionItem {...this.props} />;
    }

    return (
      <>
        {content && (
          <Section id={item.id} underlined={item.type === 'operation'}>
            {content}
          </Section>
        )}
        {item.items && <ContentItems items={item.items} />}
      </>
    );
  }
}

const middlePanelWrap = component => <MiddlePanel compact={true}>{component}</MiddlePanel>;

@observer
export class SectionItem extends React.Component<ContentItemProps> {
  render() {
    // Jarod-added J-docTag
    // longDescription added to this list of constant variables being destructured
    const { name, description, longDescription, externalDocs, level } = this.props.item as GroupModel; //takes this information from Group.model

    const Header = level === 2 ? H2 : H1;
    return (
      <>
        <Row>
          <MiddlePanel compact={false}>
            <Header>
              <ShareLink to={this.props.item.id} />
              {name}
            </Header>
          </MiddlePanel>
        </Row>
        <AdvancedMarkdown source={description || ''} htmlWrap={middlePanelWrap} />
        {/* Jarod-added J-docTag */}
        <AdvancedMarkdown source={longDescription || ''} htmlWrap={middlePanelWrap} />
        {externalDocs && (
          <Row>
            <MiddlePanel>
              <ExternalDocumentation externalDocs={externalDocs} />
            </MiddlePanel>
          </Row>
        )}
      </>
    );
  }
}

@observer
export class OperationItem extends React.Component<{
  item: OperationModel;
}> {
  render() {
    return <Operation operation={this.props.item} />;
  }
}
