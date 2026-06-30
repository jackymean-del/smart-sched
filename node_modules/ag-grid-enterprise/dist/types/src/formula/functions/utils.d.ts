import type { BeanCollection, FormulaParam, RangeParam, ValueParam } from 'ag-grid-community';
import type { FormulaNode } from '../ast/utils';
export declare function take<T>(values: Iterable<T>, name: string, n: 1): [T];
export declare function take<T>(values: Iterable<T>, name: string, n: 2): [T, T];
export declare function take<T>(values: Iterable<T>, name: string, n: 3): [T, T, T];
export declare function iterableWithoutBlanks<T>(values: Iterable<T>): Iterable<T>;
export declare function takeBetween<T>(values: Iterable<T>, name: string, min: number, max: number): T[];
export declare const isRangeParam: (p: FormulaParam) => p is RangeParam;
export declare const isValueParam: (p: FormulaParam) => p is ValueParam;
/** Excel-like predicate for COUNTIF/SUMIF */
export declare function criteriaToPredicate(criteria: unknown): (cell: unknown) => boolean;
export declare const shiftNode: (beans: BeanCollection, node: FormulaNode, rowDelta: number, columnDelta: number, unsafe: boolean) => void;
