import type { ChangedPath, ClientSideRowModelStage, GridOptions, NamedBean, _ChangedRowNodes, _IRowNodeSortStage } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';
export declare class GroupSortStage extends BeanStub implements NamedBean, _IRowNodeSortStage {
    beanName: "groupSortStage";
    readonly step: ClientSideRowModelStage;
    readonly refreshProps: (keyof GridOptions<any>)[];
    execute(changedPath: ChangedPath | undefined, changedRowNodes: _ChangedRowNodes | undefined): void;
}
