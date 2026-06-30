import type { BeanCollection, ChangedPath, ClientSideRowModelStage, GridOptions, NamedBean, _IRowNodeFilterStage } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';
export declare class GroupFilterStage extends BeanStub implements NamedBean, _IRowNodeFilterStage {
    beanName: "groupFilterStage";
    readonly step: ClientSideRowModelStage;
    readonly refreshProps: (keyof GridOptions<any>)[];
    private filterManager?;
    wireBeans(beans: BeanCollection): void;
    execute(changedPath: ChangedPath | undefined): void;
    private filterActive;
    private treeDataFilter;
    private doingTreeDataFiltering;
}
