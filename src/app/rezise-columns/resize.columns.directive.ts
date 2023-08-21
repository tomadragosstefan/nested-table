import { AfterViewInit, Directive, ElementRef, HostBinding, HostListener, Input, Renderer2 } from "@angular/core";

@Directive({
    selector: "[appResizeColumns]"
})
export class ResizeColumnsDirective implements AfterViewInit {
    isDragging: boolean = false;//This is true while dragging
    initialX: number = 0;//Initiated when dragging started
    currentTH!: HTMLElement;//Currently selected table head
    @Input('minWidth') minWidth: number = 0;//minWidth that comes from outside

    constructor(private el: ElementRef, private renderer: Renderer2) {}

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

                this.renderer.addClass(newDiv, 'resize-handle');//This class is to add style to the new div in the component

                /*---------------------------------------------------------------*/
                /* Events on the divs for enlarging the columns */
                /* mousedown and touchstart */

                /* For deskotp device */
                newDiv.addEventListener("mousedown", (e: MouseEvent) => {
                    mouseDownTouchStart(e);
                });

                /* For mobile device */
                newDiv.addEventListener("touchstart", (e: TouchEvent) => {
                    mouseDownTouchStart(e);
                });

                const mouseDownTouchStart = (e: MouseEvent | TouchEvent)=>{
                    if(e instanceof MouseEvent) e.preventDefault();
                    this.initialX = (e instanceof MouseEvent)?e.clientX:e.touches[0].clientX;
                    this.currentTH = th;
                    this.isDragging = true;
                }

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
    @HostListener('document:mousemove', ['$event'])
    @HostListener('document:touchmove', ['$event'])
    onResize(e: MouseEvent | TouchEvent): void {
        if (this.isDragging) {
            const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
            const deltaX = clientX - this.initialX;
            const currentWidth = this.currentTH.offsetWidth;
    
            const newWidth = currentWidth + deltaX;
            if (newWidth > this.minWidth) {
                this.currentTH.style.width = newWidth + 'px';
                this.initialX = clientX;
            }
        }
    }
    
    /* mouseup and touchend */
    @HostListener('document:mouseup', ['$event'])
    @HostListener('document:touchend', ['$event'])
    onFinishResize(): void {
        this.isDragging = false;
    }

}

