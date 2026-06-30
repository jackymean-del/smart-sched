import type { FormulaFunctionParams } from 'ag-grid-community';
export declare const EQUALS: ({ values }: FormulaFunctionParams) => boolean;
export declare const NOT_EQUALS: ({ values }: FormulaFunctionParams) => boolean;
export declare const GT: ({ values }: FormulaFunctionParams) => boolean;
export declare const GTE: ({ values }: FormulaFunctionParams) => boolean;
export declare const LT: ({ values }: FormulaFunctionParams) => boolean;
export declare const LTE: ({ values }: FormulaFunctionParams) => boolean;
export declare const IF: ({ values }: FormulaFunctionParams) => unknown;
/**
 * Treated as logic as excel allows any values to be compared, not just numbers
 */
export declare const MIN: ({ values }: FormulaFunctionParams) => any;
/**
 * Treated as logic as excel allows any values to be compared, not just numbers
 */
export declare const MAX: ({ values }: FormulaFunctionParams) => any;
