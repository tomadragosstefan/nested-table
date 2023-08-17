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
    level: number;
    selected: boolean;
    expanded: boolean;
    id: number;
    visible:boolean;
    children?:IDataItemWithControls[]
  }