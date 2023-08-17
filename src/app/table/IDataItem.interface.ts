export interface IDataItem {
    name: string,
    type: string,
    email: string,
    phoneNo: string,
    companyName: string,
    address: string,
    children?: IDataItem[];
  }
  
 export interface IDataItemWithControls extends IDataItem{
    level: number;// the level in the data, usefull to determine how much indentation you show in the table
    selected: boolean;// this is linked to the checkox in front of the table, only level 0 has this
    expanded: boolean;// this is to show if a parent is expanded or not
    id: number;// the unique id
    visible:boolean;// if it is visible
    children?:IDataItemWithControls[]//recursive children
  }