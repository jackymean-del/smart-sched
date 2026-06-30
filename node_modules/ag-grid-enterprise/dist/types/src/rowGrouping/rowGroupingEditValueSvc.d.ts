import type { AgColumn, IRowNode, NamedBean, RowNode, _IRowGroupingEditValueSvc } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';
export declare class RowGroupingEditValueSvc extends BeanStub implements NamedBean, _IRowGroupingEditValueSvc {
    beanName: "rowGroupingEditValueSvc";
    isGroupCellEditable(rowNode: IRowNode, column: AgColumn): boolean;
    setGroupDataValue(rowNode: RowNode, column: AgColumn, newValue: unknown, oldValue: unknown, eventSource: string | undefined, valueChanged: boolean): boolean | undefined;
}
