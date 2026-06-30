import type { BeanCollection, ChangedPath, ClientSideRowModelStage, GridOptions, NamedBean, _IRowNodeFilterAggregateStage } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';
export declare class FilterAggregatesStage extends BeanStub implements NamedBean, _IRowNodeFilterAggregateStage {
    beanName: "filterAggStage";
    readonly step: ClientSideRowModelStage;
    readonly refreshProps: (keyof GridOptions<any>)[];
    private filterManager?;
    wireBeans(beans: BeanCollection): void;
    execute(changedPath: ChangedPath | undefined): void;
    /** for tree data, we include all children, groups and leafs */
    private readonly setAllChildrenCountTreeData;
    private readonly setAllChildrenCountGridGrouping;
}
