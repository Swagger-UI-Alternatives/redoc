import * as React from 'react';

import { Code } from './styled.elements';
import { ShelfIcon } from '../../common-elements';
import { Markdown } from '../Markdown/Markdown';

export interface ResponseTitleProps {
  code: string;
  title: string;
  type: string;
  empty?: boolean;
  opened?: boolean;
  className?: string;
  onClick?: () => void;
}

export class ResponseTitle extends React.PureComponent<ResponseTitleProps> {

  splitTable(title: string): string[] {
    return title.split('\n');
  }

  addRow(row: string[]): string {
    let r: string = "";
    if(row[1] !== undefined) {
      r += "<th> " + row[1].trim() + " </th> ";
    }
    if(row[2] !== undefined) {
      r += "<td> " + row[2].trim() + " </td> ";
    }
    return r;
  }

  addResponseTable(rows: string[]): string {
    let htmlTable: string = "";
    htmlTable += "<table className='ontap-error-resp-codes'> ";
    htmlTable += "<tbody> <tr> <th> Error code </th> <td> Description </td> </tr> ";

    rows.forEach(r => {
      htmlTable += "<tr> " + this.addRow(r.split('|')) + "</tr> ";
    })

    htmlTable += "</tbody> </table> ";
    return htmlTable;
  }

  render() {
    const { title, type, empty, code, opened, className, onClick } = this.props;
    let ontapErrorCodes: boolean = false;
    let newTitle: string = title;
    let splitTable: string[] = [];
    if(title.includes("ONTAP")) {
      ontapErrorCodes = true;
      splitTable = this.splitTable(title);
      newTitle = splitTable[0];
    }

    return (
      <button
        className={className}
        onClick={(!empty && onClick) || undefined}
        aria-expanded={opened}
        disabled={empty}
      >
        {!empty && (
          <ShelfIcon
            size={'1.5em'}
            color={type}
            direction={opened ? 'down' : 'right'}
            float={'left'}
          />
        )}
        <Code>{code} </Code>
        <Markdown compact={true} inline={true} source={newTitle} />
        {ontapErrorCodes && (
          <Markdown source={this.addResponseTable(splitTable.slice(3))} />
        )}
      </button>
    );
  }
}
