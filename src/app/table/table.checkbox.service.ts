import { DataItemWithControls } from "./data-item-with-controls.model";


export class TableCheckboxService {

    private checkedCheckboxes = new Set<number>()// Stores the id`s of the checkboxes to reduce calculations on the anyItemSelectedFlag
    /*---------------------------------------------------------------*/
    /* Track checkbox selection functions */

    /* Track selected checkboxes */
    updateCheckBoxTracker(item: DataItemWithControls) {
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