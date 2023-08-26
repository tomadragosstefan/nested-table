import { IDataItem, IDataItemWithControls } from "./IDataItem.interface";

export class DataItemWithControls implements IDataItemWithControls {
    static lastId: number = 0; //When creating object of type IDataItemWithControls we increment this id and add the id to that object
    name: string = "";
    type: string = "";
    email: string = "";
    phoneNo: string = "";
    companyName: string = "";
    address: string = "";
    level: number = -1;
    selected: boolean = false;
    expanded: boolean = false;
    id: number = -1;
    visible:boolean = false;
    children?: DataItemWithControls[] = undefined;
    
    constructor(data: IDataItem, level: number=-1){// level will first be 0
        this.name = data.name;
        this.type = data.type;
        this.email = data.email;
        this.phoneNo = data.phoneNo;
        this.companyName = data.companyName;
        this.address = data.address;
        /* Added properties for controlls */
        this.level = ++level;
        this.selected = false;
        this.expanded = false;
        this.id = ++DataItemWithControls.lastId;//First id will be 1
        this.visible = true;

        // Initialize children if provided in the data
        if (data.children && data.children.length > 0) {
            this.children = data.children.map(childData => new DataItemWithControls(childData, this.level));
        }
    }

/*---------------------------------------------------------------*/
    /* Add controls */
    static add = (data: IDataItem[], dataWithControls: DataItemWithControls[]) => {
        data.forEach((item: IDataItem) => {
            const newItemWithControls: DataItemWithControls = new DataItemWithControls(item);
            dataWithControls.push(newItemWithControls);
        }
        );
    }

}