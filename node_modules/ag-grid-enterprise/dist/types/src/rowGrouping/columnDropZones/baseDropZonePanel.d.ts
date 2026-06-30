import type { AgColumn, ColumnEventType, DragItem, DropTarget, GridDraggingEvent } from 'ag-grid-community';
import { DragSourceType } from 'ag-grid-community';
import type { ColumnStateUpdateParams } from '../../columnToolPanel/updates/columnStateUpdateTypes';
import type { PillDropZonePanelParams } from '../../widgets/pillDropZonePanel';
import { PillDropZonePanel } from '../../widgets/pillDropZonePanel';
import { DropZoneColumnComp } from './dropZoneColumnComp';
export type TDropZone = 'rowGroup' | 'pivot' | 'aggregation';
export declare abstract class BaseDropZonePanel extends PillDropZonePanel<DropZoneColumnComp, AgColumn> {
    private readonly dropZonePurpose;
    protected readonly updateParams?: ColumnStateUpdateParams | undefined;
    protected readonly embedded: boolean;
    constructor(horizontal: boolean, dropZonePurpose: TDropZone, updateParams?: ColumnStateUpdateParams | undefined, embedded?: boolean);
    init(params: PillDropZonePanelParams): void;
    protected getItems(dragItem: DragItem): AgColumn[];
    protected isInterestedIn(type: DragSourceType, sourceElement: Element): boolean;
    protected minimumAllowedNewInsertIndex(): number;
    private shouldToggleColumnVisibility;
    protected handleDragEnterEnd(draggingEvent: GridDraggingEvent): void;
    protected handleDragLeaveEnd(draggingEvent: GridDraggingEvent): void;
    setColumnsVisible(columns: AgColumn[] | null | undefined, visible: boolean, source: ColumnEventType): void;
    private isRowGroupPanel;
    protected createPillComponent(column: AgColumn, dropTarget: DropTarget, ghost: boolean, horizontal: boolean): DropZoneColumnComp;
}
