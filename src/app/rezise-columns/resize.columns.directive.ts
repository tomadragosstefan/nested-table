import { AfterViewInit, Directive, ElementRef, HostBinding, HostListener, Input, Renderer2 } from "@angular/core";

@Directive({
    selector: "[appResizeColumns]"
})
export class ResizeColumnsDirective implements AfterViewInit {
    newDiv: HTMLDivElement;
    isDragging: boolean = false;
    initialX: number = 0;
    currentTH!: HTMLElement;//Currently selected table head
    @Input('minWidth') minWidth: number = 0;

    constructor(private el: ElementRef, private renderer: Renderer2) {
        // Create a new div that we will use to resize the column
        this.newDiv = this.renderer.createElement('div');
    }

    ngAfterViewInit() {

        const trElement: HTMLElement = this.el.nativeElement.querySelector('tr');

        if (trElement) {
            // Iterate through <th> elements within the <tr>
            const thElements = trElement.querySelectorAll('th');

            thElements.forEach((th) => {
                //We first assign the size here so it won`t turn into a table with equal columns
                if (this.minWidth< th.offsetWidth)
                {
                    th.style.width = th.offsetWidth + "px";//Set column width = text lenght
                }else
                {
                    th.style.width = this.minWidth + "px"; //If table head text is smaller then minWidth, set column width = minWidth
                }

                // Create a new div that you will use to resize the column
                const newDiv = this.renderer.createElement('div');

                // Add class
                this.renderer.addClass(newDiv, 'resize-handle');//This class is to add style to the new div in the component

                /*---------------------------------------------------------------*/
                /* Events on the divs for enlarging the columns */
                /* mousedown and touchstart */

                /* For deskotp device */
                newDiv.addEventListener("mousedown", (e: MouseEvent) => {
                    e.preventDefault();
                    this.initialX = e.clientX;
                    //console.log("Dragging started mouse");
                    this.currentTH = th;
                    this.isDragging = true;
                });

                /* For mobile device */
                newDiv.addEventListener("touchstart", (e: TouchEvent) => {
                    e.preventDefault();
                    this.initialX = e.touches[0].clientX;
                    //console.log("Dragging started touch");
                    this.currentTH = th;
                    this.isDragging = true;
                });

                /*---------------------------------------------------------------*/

                // Append the new div inside the <th> element
                this.renderer.appendChild(th, newDiv);

            });

            const parentElement = this.el.nativeElement.parentElement;//Select table element
            this.renderer.addClass(parentElement, 'table-layout-fixed');//Make layout fix in table element, so you can scroll and enlarge the columns after the seize was assigned
            const tableContainer = this.el.nativeElement.parentElement.parentElement;//Select table container
            this.renderer.addClass(tableContainer, 'resizable-table');//Make table scrollable on the horizontal with posibility to enlarge
        }

    }

    /*---------------------------------------------------------------*/
    /* Events on the document for enlarging the columns */
    
    /* mousemove and touchmove */

    /* For deskotp device */
    @HostListener('document:mousemove', ['$event'])
    onMousemove(e: MouseEvent): void {
        if (this.isDragging === true) {
            const newX = e.clientX;
            const deltaX = newX - this.initialX;
            const curentWidth = this.currentTH.offsetWidth;

            const newWidth = curentWidth + deltaX;
            if (newWidth > this.minWidth) {
                this.currentTH.style.width = newWidth + "px";
                this.initialX = newX;
            }
        }
    }

    /* For mobile device */
    @HostListener('document:touchmove', ['$event'])
    onTouchmove(e: TouchEvent): void {
        if (this.isDragging === true) {
            const newX = e.touches[0].clientX
            const deltaX = newX - this.initialX;
            const curentWidth = this.currentTH.offsetWidth;

            const newWidth = curentWidth + deltaX;
            if (newWidth > this.minWidth) {
                this.currentTH.style.width = newWidth + "px";
                this.initialX = newX;
            }
        }
    }

    /* mouseup and touchend */

    /* For deskotp device */
    @HostListener('document:mouseup', ['$event'])
    onMouseup(event: MouseEvent): void {
        this.isDragging = false;
        //console.log('Mouse up outside the element');
    }

    /* For mobile device */
    @HostListener('document:touchend', ['$event'])
    onTouchend(event: TouchEvent): void {
        this.isDragging = false;
        //console.log('Touch up outside the element');
    }

}

