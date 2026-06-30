import type { AgColumn, BeanCollection, ColumnEventType, IAggFunc, IColumnStateUpdateStrategy } from 'ag-grid-community';
import type { ColumnModelItem } from './columnModelItem';
import type { ColumnStateUpdateParams } from './updates/columnStateUpdateTypes';
export declare function selectAllChildren(beans: BeanCollection, colTree: ColumnModelItem[], selectAllChecked: boolean, eventType: ColumnEventType, params: ColumnStateUpdateParams): void;
export declare function setAllColumns(beans: BeanCollection, cols: AgColumn[], selectAllChecked: boolean, eventType: ColumnEventType, params: ColumnStateUpdateParams): void;
export declare function updateColumns(beans: BeanCollection, params: {
    columns: AgColumn[];
    visibleState?: {
        [key: string]: boolean;
    };
    pivotState?: {
        [key: string]: {
            pivot?: boolean;
            rowGroup?: boolean;
            aggFunc?: string | IAggFunc | null;
        };
    };
    eventType: ColumnEventType;
} & ColumnStateUpdateParams): void;
export declare function createPivotStateForToolPanel(column: AgColumn, updateStrategy: IColumnStateUpdateStrategy, deferApply: boolean): {
    pivot?: boolean;
    rowGroup?: boolean;
    aggFunc?: string | IAggFunc | null;
};
