import * as lodash from "lodash";
import { DataItemWithControls } from "./data-item-with-controls.model";

export class TableSearchService {

    private parentItemsRefs: Set<DataItemWithControls> = new Set();//Array that contains reference to items so we can access the parents and display and open them

    /* Search in the data and in the children to display only the data from the search */
    search(value: string, data: DataItemWithControls[]) {
        const dataCopy = lodash.cloneDeep(data);
        this.searchRecursive(value, dataCopy);
        return dataCopy;
    }

    private searchRecursive(value: string, data: DataItemWithControls[]) {
        data.forEach((item) => {
            if (item.name.toLowerCase().includes(value.toLowerCase())) this.makeMatchingItemVisible(item);
            else item.visible = false;// hide unmatching items

            if (item.children instanceof Array) {
                this.manageParentItemsRefs(item);
                this.searchRecursive(value, item.children);
            }
        })
    }

    /* If nothing is in the search input we make all items visible and close the expanded childrens */
    resetSearch(value: string, data: DataItemWithControls[]) {
        const dataCopy = lodash.cloneDeep(data);
        this.resetSearchRecursive(value, dataCopy);
        return dataCopy;
    }

    private resetSearchRecursive(value: string, data: DataItemWithControls[]) {
        data.forEach((item) => {
            item.visible = true;// make item visible
            if (item.children instanceof Array) {
                item.expanded = false;//close all the parents when no matches in the string
                this.resetSearchRecursive(value, item.children);
            }
        })
    }

    makeMatchingItemVisible(item: DataItemWithControls) {
        item.visible = true;//At level 0 we don`t need to display any parents
        if (item.level > 0) {
            item.visible = true;
            this.makeParentsVisibleAndExpanded(item);
        }
        item.expanded = false;//to close this row when doing the search again withour a reset
    }

    makeParentsVisibleAndExpanded(item: DataItemWithControls) {
        for (const parentRefIt of this.parentItemsRefs) {
            if (item.level >= parentRefIt.level) {
                parentRefIt.visible = true;//Make parent items visible for the matching element
                if (parentRefIt.children) {
                    parentRefIt.expanded = true;//Expand parents of the matching row
                }
                this.parentItemsRefs.delete(parentRefIt); // Remove the current item from the Set
            }
        }
    }

    /* Function used to store the parents, so you can expand them when finding a match */
    manageParentItemsRefs(item: DataItemWithControls) {
        if (item.level === 0) {
            this.parentItemsRefs.clear();//If we are at level 0 we empty the parentItemsRefs
        }
        this.parentItemsRefs.add(item);//For each level we push the items into the array
    }
}