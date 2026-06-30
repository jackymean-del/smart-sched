import type { AgColumn, DragAndDropIcon, GridDraggingEvent } from 'ag-grid-community';
import type { ColumnStateUpdateParams } from '../../columnToolPanel/updates/columnStateUpdateTypes';
import { BaseDropZonePanel } from './baseDropZonePanel';
export declare class ValuesDropZonePanel extends BaseDropZonePanel {
    constructor(horizontal: boolean, params?: ColumnStateUpdateParams);
    postConstruct(): void;
    protected getAriaLabel(): string;
    protected getIconName(): DragAndDropIcon;
    protected isItemDroppable(column: AgColumn, draggingEvent: GridDraggingEvent): boolean;
    protected updateItems(columns: AgColumn[]): void;
    protected getExistingItems(): AgColumn[];
}
