import type { AgColumn, BeanCollection, CellRange } from 'ag-grid-community';
export declare const getColorClassesForRef: (_ref: string, colorIndexOverride?: number | null) => {
    tokenClass: string;
    rangeClass: string;
    colorIndex: number;
};
export declare const getRangeColorIndexFromClass: (colorClass?: string | null) => number | null;
export declare const tagRangeWithFormulaColor: (range: CellRange | undefined, ref: string, colorIndex?: number | null) => void;
type FormulaRangeParams = {
    rowStartIndex: number;
    rowEndIndex: number;
    columnStart: AgColumn;
    columnEnd: AgColumn;
};
export declare const getCellRangeParams: (beans: BeanCollection, ref: string) => FormulaRangeParams | null;
/** Convert formula-row-based params to display-index-based params for the range service.
 *  Clamps to the visible portion when endpoints are filtered out. Returns null if no
 *  rows in the range are currently visible. */
export declare const toDisplayRangeParams: (beans: BeanCollection, params: FormulaRangeParams) => FormulaRangeParams | null;
export declare const getLatestRangeRef: (beans: BeanCollection) => string | null;
export declare const rangeToRef: (beans: BeanCollection, range: CellRange) => string | null;
type RefToken = {
    ref: string;
    index: number;
};
type RefTokenMatch = {
    ref: string;
    start: number;
    end: number;
    index: number;
};
export declare const getRefTokenMatchesForFormula: (beans: BeanCollection, text: string) => RefTokenMatch[];
export declare const getRefTokensFromText: (beans: BeanCollection, text: string) => RefToken[];
export {};
