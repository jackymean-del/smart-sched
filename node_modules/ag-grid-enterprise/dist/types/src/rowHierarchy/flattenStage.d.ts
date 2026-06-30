import type { ClientSideRowModelStage, GridOptions, NamedBean, RowNode, _IRowNodeFlattenStage } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';
export declare class FlattenStage extends BeanStub implements _IRowNodeFlattenStage, NamedBean {
    beanName: "flattenStage";
    readonly step: ClientSideRowModelStage;
    readonly refreshProps: (keyof GridOptions<any>)[];
    execute(): RowNode[];
    private recursivelyAddToRowsToDisplay;
    private addRowNodeToRowsToDisplay;
}
