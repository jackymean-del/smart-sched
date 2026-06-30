import type { CellCtrl, CellPosition, CellRange, RowPosition } from 'ag-grid-community';
import { Component } from 'ag-grid-community';
export declare enum SelectionHandleType {
    FILL = 0,
    RANGE = 1
}
export declare abstract class AbstractSelectionHandle extends Component {
    protected cellCtrl: CellCtrl;
    protected cellRange: CellRange;
    protected rangeStartRow: RowPosition;
    protected rangeEndRow: RowPosition;
    protected changedCalculatedValues: boolean;
    private lastCellHovered;
    private dragging;
    protected abstract type: SelectionHandleType;
    protected abstract shouldSkipCell(cell: CellPosition): boolean;
    protected shouldDestroyOnEndDragging: boolean;
    postConstruct(): void;
    protected abstract onDrag(e: MouseEvent | Touch): void;
    protected abstract onDragEnd(e: MouseEvent | Touch): void;
    protected abstract onDragCancel(): void;
    protected getLastCellHovered(): CellPosition | null | undefined;
    private getDraggingCssClass;
    protected updateValuesOnMove(e: MouseEvent | Touch): void;
    private clearDragProperties;
    getType(): SelectionHandleType;
    refresh(cellCtrl: CellCtrl, cellRange?: CellRange): void;
    protected clearValues(): void;
    destroy(): void;
    private updateLocalRangeIfNeeded;
}
