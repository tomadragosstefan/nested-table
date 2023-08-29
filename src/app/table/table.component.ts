import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription, debounceTime, fromEvent, map } from 'rxjs';
import { IDataItem } from './IDataItem.interface';
import { DataItemWithControls } from './data-item-with-controls.model'
import { TableCheckboxTrackerService } from './table-checkbox-tracker.service';
import { TableSearchService } from './table.search.service';

@Component({
  selector: 'table-component',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // Change the strategy for reducing change detection cycles
  providers: [TableCheckboxTrackerService, TableSearchService]
})
export class TableComponent implements OnInit, AfterViewInit, OnDestroy{
  @Input('data') data: IDataItem[] = [];
  dataWithControls: DataItemWithControls[] = [];// The object that stores all the data from the table (and has controls added to it)
  headerCheckbox: boolean= false;// The checkbox in the header
  anyItemSelectedFlag: boolean = false;// Flag which determines if we display the "Delete multiple button" or the buttons on each row
  parentItemsRefs: Set <DataItemWithControls> = new Set();//Array that contains reference to items so we can access the parents and display and open them
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef<HTMLInputElement>;  /* HTML input used to search in table */
  searchString: string = "";//The string from the search input, needed here because we redo the search each time new data is inserted
  searchSubscription: Subscription | null = null;
  throttle = 800;//delay in ms until more data is brought on infinite-scroll

  constructor(private cdr: ChangeDetectorRef, private checkboxTrackerService: TableCheckboxTrackerService, private searchService : TableSearchService) {} //Used to trigger change detection manually

  ngOnInit() {
    //Push initial data
    DataItemWithControls.add(this.data,this.dataWithControls);
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
          this.onSearch(this.searchString);
      });
  }
  
/*---------------------------------------------------------------*/
   /* Events */

  onSelectCheckbox(item: DataItemWithControls){
    item.selected = !item.selected;//toggle current checkbox
    this.checkboxTrackerService.updateCheckBoxTracker(item);
    this.anyItemSelectedFlag = this.checkboxTrackerService.updateAnyItemSelectedFlag();
    if (item.selected === false) this.headerCheckbox = false; //Cancel header checkbox if one item is deselected 
  }

  onSelectHeaderCheckbox() {
    this.headerCheckbox = !this.headerCheckbox;//toggle header checkbox
    this.dataWithControls.forEach(item => {
      item.selected = this.headerCheckbox;
      this.checkboxTrackerService.updateCheckBoxTracker(item);
    });
    this.anyItemSelectedFlag = this.checkboxTrackerService.updateAnyItemSelectedFlag();
  }

  /* It is used when you click an arrow, and it toggles the children in the table */
  onCollapseArrowSelect(item: DataItemWithControls){
    item.expanded = !item.expanded;//toggle expanded
  }
  
  /* It is used when searching */
  onSearch(value: string) {
    if (value !== "")
      this.dataWithControls = this.searchService.search(value, this.dataWithControls);
    else
      this.dataWithControls = this.searchService.resetSearch(value, this.dataWithControls);
    this.cdr.markForCheck();// Trigger change detection explicitly
  }
/*---------------------------------------------------------------*/
  /* Calculates the left margin based on nesting level */
  calculateLeftMarginForNesting(level: number){
    return 14 * level + 'px';
  }

/*---------------------------------------------------------------*/
  /* Track by functions for ngFor */

  trackByFunctionDataItems(index: number, item: DataItemWithControls): number {
    return item.id; // Use a unique identifier for each item
  }
/*---------------------------------------------------------------*/
  /* Push more data */

  pushData(){
    DataItemWithControls.add(this.data, this.dataWithControls);
    this.onSearch(this.searchString);//To keep the search when adding more data
    this.headerCheckbox = false;//cancel header checkbox if push more data
  }


  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

}
