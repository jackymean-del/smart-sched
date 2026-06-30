import type { IRowNode, RowNode, _IGroupEditService, _RowsDrop } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';
export declare class GroupEditService extends BeanStub implements _IGroupEditService {
    beanName: "groupEditSvc";
    private pendingEditRefresh;
    private dropGroupTarget;
    private dropGroupTimer;
    private dropGroupThrottled;
    private draggingGroups;
    postConstruct(): void;
    destroy(): void;
    /** Checks if the drop operation described by `rowsDrop` is a grouping edit */
    isGroupingDrop(rowsDrop: _RowsDrop): boolean;
    private initDraggingGroups;
    /** Checks if the drop operation described by `rowsDrop` can set a new parent */
    canSetParent(rowsDrop: _RowsDrop): boolean;
    canDropRow(rowNode: IRowNode, rowsDrop: _RowsDrop): boolean;
    fixRowsDrop(rowsDrop: _RowsDrop, canSetParent: boolean, fromNudge: boolean, yDelta: number): void;
    clearNewSameParent(rowsDrop: _RowsDrop, canSetParent: boolean): void;
    private updateDropTarget;
    private canDropInTarget;
    private startDropGroupDelay;
    resetDragGroup(): void;
    stopDragging(final: boolean): void;
    private shouldDropTargetBeParent;
    /** Performs the grouping edit described by `rowsDrop` */
    dropGroupEdit(rowsDrop: _RowsDrop): boolean;
    private canStartGroup;
    /** Flushes any pending group edits for batch processing */
    private flushGroupEdits;
    /** Refreshes the grouping for the provided rows */
    private csrmRefresh;
    private newGroupValues;
    private setRowGroup;
    private onCsrmCellChange;
    csrmFirstLeaf(parent: IRowNode | null): RowNode | null;
    private firstAliveChildLeaf;
    private findFirstLeafForParent;
}
