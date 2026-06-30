import type { AgColumn, DragAndDropIcon, FocusableContainer, GridDraggingEvent } from 'ag-grid-community';
import type { ColumnStateUpdateParams } from '../../columnToolPanel/updates/columnStateUpdateTypes';
import { BaseDropZonePanel } from './baseDropZonePanel';
export declare class PivotDropZonePanel extends BaseDropZonePanel implements FocusableContainer {
    constructor(horizontal: boolean, params?: ColumnStateUpdateParams, embedded?: boolean);
    postConstruct(): void;
    protected getAriaLabel(): string;
    refresh(): void;
    private checkVisibility;
    protected isItemDroppable(column: AgColumn, draggingEvent: GridDraggingEvent): boolean;
    protected updateItems(columns: AgColumn[]): void;
    protected getIconName(): DragAndDropIcon;
    protected getExistingItems(): AgColumn[];
    getFocusableContainerName(): 'pivotToolbar';
}
