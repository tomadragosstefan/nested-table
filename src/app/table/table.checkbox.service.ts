import { IDataItemWithControls } from "./IDataItem.interface";
import { DataItemWithControls } from "./data-item-with-controls.model";


export class TableCheckboxService {

    private checkedCheckboxes = new Set<number>()// Stores the id`s of the checkboxes to reduce calculations on the anyItemSelectedFlag

    /*---------------------------------------------------------------*/
    /*  Checkbox add remove operations functions */

    toggleTableBodyCheckbox = (item: IDataItemWithControls) => {
        item.selected = !item.selected;
    }

    /* This function updates the value of all the checkboxes and executes a callback for checkboxTracking */
    setAllTableBodyCheckboxes(value: boolean, dataWithControls: DataItemWithControls[], callback: (item: IDataItemWithControls) => void) {
        dataWithControls.forEach(item => {
            item.selected = value;
            callback(item);
        });
    }

    /* This method reverses the headerCheckbox value */
    toggleHeaderCheckbox(headerCheckboxValue: boolean) {
        return !headerCheckboxValue;
    }

    /* Cancel header checkbox if one item is deselected */
    cancelHeaderCheckboxIfUnchecked(item: IDataItemWithControls, headerCheckbox: boolean) {
        if (item.selected === false) {
            headerCheckbox = false;
        }
        return headerCheckbox;
    }
    
    /*---------------------------------------------------------------*/
    /* Track checkbox selection functions */

    /* Track selected checkboxes */
    updateCheckBoxTracker(item: IDataItemWithControls) {
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
    updateAnyItemSelectedFlag() {
        return this.checkedCheckboxes.size > 0;
    }

}