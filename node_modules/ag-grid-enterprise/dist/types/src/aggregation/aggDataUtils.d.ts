import type { ColumnModel, RowNode } from 'ag-grid-community';
/**
 * Traverses `rowNode.childrenMapped` using pivot keys to resolve the matching RowNode array.
 * Used by {@link AggregatedChildrenSvc} to resolve pivot children for `getAggregatedChildren`,
 * and by {@link AggregationStage} to collect values for pivot column aggregation.
 */
export declare const getNodesFromMappedSet: (mappedSet: any, keys: string[] | null | undefined) => RowNode[];
/** Sets aggData and fires cell-changed events if listeners are registered. */
export declare const setAggData: (rowNode: RowNode, newAggData: Record<string, any> | null, colModel: ColumnModel) => void;
/** Sets aggData on a row node and all its siblings (footer + pinned). */
export declare const setAggDataWithSiblings: (rowNode: RowNode, newAggData: Record<string, any> | null, colModel: ColumnModel) => void;
