import type { NamedBean, _IRowGroupPanelBuilder } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';
import { PivotDropZonePanel } from './pivotDropZonePanel';
import { RowGroupDropZonePanel } from './rowGroupDropZonePanel';
export declare class RowGroupPanelBuilder extends BeanStub implements NamedBean, _IRowGroupPanelBuilder {
    beanName: "rowGroupPanelBuilder";
    createRowGroupDropZone(horizontal: boolean, embedded?: boolean): RowGroupDropZonePanel;
    createPivotDropZone(horizontal: boolean, embedded?: boolean): PivotDropZonePanel;
}
