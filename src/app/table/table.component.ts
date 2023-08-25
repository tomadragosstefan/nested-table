import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription, debounceTime, fromEvent, map } from 'rxjs';
import { IDataItem, IDataItemWithControls } from './IDataItem.interface';
import { DataItemWithControls } from './data-item-with-controls.model'

@Component({
  selector: 'table-component',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // Change the strategy for reducing change detection cycles
})
export class TableComponent implements OnInit, AfterViewInit, OnDestroy{
  @Input('data') data: IDataItem[] = [];
  dataWithControls: IDataItemWithControls[] = [];// The object that stores all the data from the table (and has controls added to it)
  headerCheckbox: boolean= false;// The checkbox in the header
  checkedCheckboxes = new Set<number>()// Stores the id`s of the checkboxes to reduce calculations on the anyItemSelectedFlag
  anyItemSelectedFlag: boolean = false;// Flag which determines if we display the "Delete multiple button" or the buttons on each row
  parentItemsRefs: Set <IDataItemWithControls> = new Set();//Array that contains reference to items so we can access the parents and display and open them
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef<HTMLInputElement>;  /* HTML input used to search in table */
  searchString: string = "";//The string from the search input, needed here because we redo the search each time new data is inserted
  searchSubscription: Subscription | null = null;
  throttle = 800;//delay in ms until more data is brought on infinite-scroll

  constructor(private cdr: ChangeDetectorRef) {} //Used to trigger change detection manually

  ngOnInit() {
    //Push initial data
    this.addDataWithControls (this.data);
  }

 /*---------------------------------------------------------------*/
  /* Search event */  

  ngAfterViewInit() {
    const inputEvent = fromEvent(this.searchInput.nativeElement, 'input');

    this.searchSubscription = inputEvent
      .pipe(
        debounceTime(1000), // Debounce time
        map((event: Event) => (event.target as HTMLInputElement).value)
      )
      .subscribe((value: string) => {
          this.searchString = value;
          this.onSearch(value, this.dataWithControls);
      });
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
    this.toggleTableBodyCheckbox(item);
    this.addRemoveItemsFromCheckBoxTracker(item);
    this.updateAnyItemSelectedFlag();
    this.cancelHeaderCheckboxIfUnchecked(item);   
  }


  onSelectHeaderCheckbox() {
    this.toggleHeaderCheckbox();
    this.setAllTableBodyCheckboxes( this.headerCheckbox, this.addRemoveItemsFromCheckBoxTracker.bind(this));
    this.updateAnyItemSelectedFlag();
  }

  /* It is used when you click an arrow, and it toggles the children in the table */
  onCollapseArrowSelect(item: IDataItemWithControls){
    item.expanded = !item.expanded;//toggle expanded
  }
  
  /* It is used when searching */
  onSearch(value: string, data: IDataItemWithControls[]) {
    if (value !== "")
      this.search(value, data);
    else
      this.resetSearch(value, data);
    
    this.cdr.markForCheck();// Trigger change detection explicitly
  }

/*---------------------------------------------------------------*/
  /*  Checkbox add remove operations functions */

  toggleTableBodyCheckbox = (item: IDataItemWithControls)=>{
    item.selected = !item.selected;
  }

  /* This function updates the value of all the checkboxes and executes a callback for checkboxTracking */
  setAllTableBodyCheckboxes( value: boolean, callback: (item: IDataItemWithControls) => void){
    this.dataWithControls.forEach(item=>
      {
        item.selected = value;
        callback(item);
      });
  }

  toggleHeaderCheckbox(){
    this.headerCheckbox = !this.headerCheckbox;
  }

  cancelHeaderCheckboxIfUnchecked(item: IDataItemWithControls){
    if (item.selected === false)
    {
      this.headerCheckbox = false;//cancel header checkbox if one item is deselected
    }
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
  search(value: string, data: IDataItemWithControls[]) {
    data.forEach((item) => {
      if (item.name.toLowerCase().includes(value.toLowerCase())) this.makeMatchingItemsVisible(item);
      else item.visible = false;// hide unmatching items

      if (item.children instanceof Array) {
        this.manageParentItemsRefs(item);
        this.search(value, item.children);
      }
    })
  }  

  /* If nothing is in the search input we make all items visible and close the expanded childrens */
  resetSearch(value: string, data: IDataItemWithControls[]) {
    data.forEach((item) => {
      item.visible = true;// make item visible
      if (item.children instanceof Array) {
        item.expanded = false;//close all the parents when no matches in the string
        this.resetSearch(value, item.children);
      }
    })
  }  


  makeMatchingItemsVisible(item: IDataItemWithControls) {
    if (item.level === 0)
      item.visible = true;//Here we don`t need to display any parents
    else {
      item.visible = true;
      this.makeParentsVisibleAndExpanded(item); 
    }
  }

  makeParentsVisibleAndExpanded(item: IDataItemWithControls){
    const unusedParentItems: Set<IDataItemWithControls> = new Set();//We use this to store the refs that where not used in the search, so if later we go to a lower level we don`t revisit the previous nodes
    this.parentItemsRefs.forEach(refItem => {
      if ( refItem.level <= item.level)//The level of items in the parentItemsRefs must be lower then the matching element
      {
        refItem.visible = true;//Make parent items visible for the matching element
        if (refItem.children) refItem.expanded = true;//Expand parents of the matching row
      } else unusedParentItems.add(refItem);
    })
    this.parentItemsRefs.clear();//Clear previous references
    this.parentItemsRefs = unusedParentItems;//Keep unused references
  }

  /* Function used to store the parents, so you can ecpand them when finding a match */
  manageParentItemsRefs(item: IDataItemWithControls){
    if (item.level === 0)
    {
      this.parentItemsRefs.clear();//If we are at level 0 we empty the parentItemsRefs
    }
    this.parentItemsRefs.add(item);//For each level we push the items into the array
  }

/*---------------------------------------------------------------*/
  /* Push more data */

  pushData(){
    this.addDataWithControls (this.data);
    this.onSearch(this.searchString, this.dataWithControls);//To keep the search when adding more data
    this.headerCheckbox = false;//cancel header checkbox if push more data
  }


  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

}
