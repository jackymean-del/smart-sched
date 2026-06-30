import type { AgColumn, NamedBean, RowNode, _IAggregatedChildrenSvc } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';
/**
 * Pure query service that returns the children contributing to aggregation for a group RowNode.
 * Does not perform aggregation — just resolves which children participate based on hierarchy,
 * pivot keys, and gos filtering settings.
 */
export declare class AggregatedChildrenSvc extends BeanStub implements NamedBean, _IAggregatedChildrenSvc {
    beanName: "aggChildrenSvc";
    getAggregatedChildren(rowNode: RowNode | null | undefined, col: AgColumn | null | undefined, recursive?: boolean): RowNode[];
}
