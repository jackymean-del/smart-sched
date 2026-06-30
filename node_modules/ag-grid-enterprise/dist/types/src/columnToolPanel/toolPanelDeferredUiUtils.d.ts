import type { BeanCollection } from 'ag-grid-community';
import type { ColumnStateUpdateParams } from './updates/columnStateUpdateTypes';
export declare function isDeferredMode(params?: ColumnStateUpdateParams): boolean;
export declare function refreshDeferredToolPanelUi(beans: BeanCollection, params?: ColumnStateUpdateParams): void;
