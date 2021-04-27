import * as React from 'react';

import { Code } from './styled.elements';
import { ShelfIcon } from '../../common-elements';
import { Markdown } from '../Markdown/Markdown';
// import { StyledMarkdownBlock } from '../Markdown/styled.elements';
// import { MarkdownRenderer } from '../../services/MarkdownRenderer';

// added for ontap error resp tables

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
    let s: string = "";
    if(row[1] !== undefined) {
      console.log("row [1] " + row[1].trim());
      s += "<th> " + row[1].trim() + " </th> ";
    }
    if(row[2] !== undefined) {
      console.log("row [2] " + row[2].trim());
      s += "<td> " + row[2].trim() + " </td> ";
    }
    return s;
  }

  addResponseTable(rows: string[]): string {
    let string: string = "";
    string += "<table className='ontap-error-resp-codes'> ";
    string += "<tbody> <tr> <th> Error code </th> <td> Description </td> </tr> ";

    rows.forEach(r => {
      string += "<tr> " + this.addRow(r.split('|')) + "</tr> ";
    })

    string += "</tbody> </table> ";
    return string;
  }

  render() {
    const { title, type, empty, code, opened, className, onClick } = this.props;
    let ontapErrorCodes: boolean = false;
    let newTitle: string = title;
    let splitTable: string[] = [];
    console.log(title);

    if(title.includes("ONTAP")) {
      ontapErrorCodes = true;
      splitTable = this.splitTable(title);
      newTitle = splitTable[0];
    }

    // step 2: trigger the ntapErrorCodes when user clicks on 

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
