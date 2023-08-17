import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { debounceTime, fromEvent, map } from 'rxjs';
import { IDataItem, IDataItemWithControls } from './IDataItem.interface';
import { DataItemWithControls } from './data-item-with-controls.model'

@Component({
  selector: 'table-component',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // Change the strategy for reducing change detection cycles
})
export class TableComponent implements OnInit, AfterViewInit{
  @Input('data') data: IDataItem[] = [];
  dataWithControls: IDataItemWithControls[] = [];// The object that stores all the data from the table (and has controls added to it)
  headerCheckbox: boolean= false;// The checkbox in the header
  checkedCheckboxes = new Set<number>()// Stores the id`s of the checkboxes to reduce calculations on the anyItemSelectedFlag
  anyItemSelectedFlag: boolean = false;// Flag which determines if we display the "Delete multiple button" or the buttons on each row
  referenceArray: IDataItemWithControls[] = [];//Array that contains reference to items so we can access the parents and display and open them
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef<HTMLInputElement>;  /* HTML input used to search in table */
  searchString: string = "";//The string from the search input, needed here because we redo the search each time new data is inserted
  throttle = 800;//delay in ms until more data is brought

  constructor(private cdr: ChangeDetectorRef) {} //Used to trigger change detection manually

  ngOnInit() {
    //Push initial data
    this.addDataWithControls (this.data);
  }

 /*---------------------------------------------------------------*/
  /* Search event */  

  ngAfterViewInit() {
    if (this.searchInput) {
      const inputEvent = fromEvent(this.searchInput.nativeElement, 'input');

      inputEvent
        .pipe(
          debounceTime(1000), // Debounce time
          map((event: Event) => (event.target as HTMLInputElement).value)
        )
        .subscribe((value: string) => {
            this.searchString = value;
            this.onSearch(value, this.dataWithControls)
        });
    }
  }
  
/*---------------------------------------------------------------*/
  /* Add controls */ 
    
  addDataWithControls = (data: IDataItem[]) => {
    data.forEach((item: IDataItem) => {
      const newItemWithControls: IDataItemWithControls = new DataItemWithControls(item);
      this.dataWithControls.push(newItemWithControls);
    }
    );
  }

/*---------------------------------------------------------------*/
   /* Events */

  onSelectCheckbox(item: IDataItemWithControls){
    this.setTableBodyCheckbox(item);
    this.addRemoveItemsFromCheckBoxTracker(item);
    this.updateAnyItemSelectedFlag();
  }

  onSelectHeaderCheckbox(item: IDataItemWithControls[]) {
    this.headerCheckbox = this.setHeaderCheckbox(this.headerCheckbox);
    this.setAllTableBodyCheckboxes(item, this.headerCheckbox, this.addRemoveItemsFromCheckBoxTracker.bind(this));
    this.updateAnyItemSelectedFlag();
  }

  /* It is used when you click an arrow, and it toggles the children in the table */
  onCollapseArrowSelect(item: IDataItemWithControls){
    item.expanded = !item.expanded;//toggle expanded
  }
  
  /* It is used when searching */
  onSearch(value: string, data: IDataItemWithControls[]) {
    if (value !== "")
      this.search(value, data, this.referenceArray);
    else
      this.resetSearch(value, data, this.referenceArray);
    
    this.cdr.markForCheck();// Trigger change detection explicitly
  }

/*---------------------------------------------------------------*/
  /*  Checkbox add remove operations functions */

  setTableBodyCheckbox = (item: IDataItemWithControls)=>{
    item.selected = !item.selected;
  }

  /* This function updates the value of all the checkboxes and executes a callback for checkboxTracking */
  setAllTableBodyCheckboxes(data: IDataItemWithControls[], value: boolean, callback: (item: IDataItemWithControls) => void){
    data.forEach(item=>
      {
        item.selected = value;
        callback(item);
      });
  }

  setHeaderCheckbox(headerCheckbox: boolean){
    headerCheckbox = !headerCheckbox;
    return headerCheckbox;
  }

/*---------------------------------------------------------------*/
/* Track checkbox selection functions */

  /* Track selected checkboxes */
  addRemoveItemsFromCheckBoxTracker(item: IDataItemWithControls) {
      if (item.selected === true) {
        this.checkedCheckboxes.add(item.id);
      } else {
        this.checkedCheckboxes.delete(item.id);
      }
  }

/**
 *  Updates the 'anyItemSelectedFlag' flag based on the presence of checked checkboxes
 *  after adding or removing checkbox operations.
 */
  updateAnyItemSelectedFlag(){
    this.anyItemSelectedFlag = this.checkedCheckboxes.size > 0;  
  }
/*---------------------------------------------------------------*/
  /* Calculates the left margin based on nesting level */
  calculateLeftMarginForNesting(level: number){
    return 14 * level + 'px';
  }

/*---------------------------------------------------------------*/
  /* Track by functions for ngFor */

  trackByFunctionLevel_0(index: number, item: IDataItemWithControls): any {
    return item.id; // Use a unique identifier for each item
  }

  trackByFunctionLevel_1Plus(index: number, item: IDataItemWithControls): any {
    return item.id; // Use a unique identifier for each item
  }
  
/*---------------------------------------------------------------*/
  /*Search*/

  /* Search in the data and in the children to display only the data from the search */
  search(value: string, data: IDataItemWithControls[], referenceArray: IDataItemWithControls[]) {
    data.forEach((item) => {
      if (item.name.toLowerCase().includes(value.toLowerCase())) this.makeMatchingItemsVisible(item, referenceArray);
      else item.visible = false;// hide unmatching items

      if (item.children instanceof Array) {
        this.manageReferenceArray(item, referenceArray);
        this.search(value, item.children, referenceArray);
      }
    })
  }  

  /* If nothing is in the search input we make all items visible and close the expanded childrens */
  resetSearch(value: string, data: IDataItemWithControls[], referenceArray: IDataItemWithControls[]) {
    data.forEach((item) => {
      item.visible = true;// make item visible
      if (item.children instanceof Array) {
        item.expanded = false;//close all the parents when no matches in the string
        this.resetSearch(value, item.children, referenceArray);
      }
    })
  }  


  makeMatchingItemsVisible(item: IDataItemWithControls, referenceArray: IDataItemWithControls[]) {
    if (item.level === 0)
      item.visible = true;//Here we don`t need to display any parents
    else {
      item.visible = true;
      referenceArray.forEach(refItem => {
        if ( refItem.level <= item.level)//The level of items in the referenceArray must be lower then the matching element
        {
          refItem.visible = true;//make the items that are parents of the matching elements visible
          if (refItem.children) refItem.expanded = true;//collapse all the parents of the row with the matching string 
        }
      })
    }

  }

  manageReferenceArray(item: IDataItemWithControls, referenceArray: IDataItemWithControls[]){
    if (item.level === 0)
    {
      referenceArray.length = 0;//If we are at level 0 we empty the referenceArray
    }
    referenceArray.push(item);//For each level we push the items into the array
  }

/*---------------------------------------------------------------*/
  /* Push more data */

  pushMoreData(){
    this.addDataWithControls (this.data);
    this.onSearch(this.searchString, this.dataWithControls);//To keep the search when adding more data
  }


}
