import type { AgColumn, BeanCollection, RowNode } from 'ag-grid-community';
import type { FormulaNode } from './ast/utils';
import type { FormulaService } from './formulaService';
import type { FormulaErrorId, FormulaErrorType } from './i18n';
/**
 * Per-cell cache entry.
 *
 * Holds the parsed AST (durable across value invalidation) and the last computed value. The
 * "value freshness" is a version stamp compared against `FormulaService.valueCacheVersion`: a bulk
 * invalidation bumps the service counter once (O(1)) and every entry becomes implicitly stale.
 *
 * Error state stores only the small pieces needed to rebuild a `FormulaError` via
 * `FormulaService.buildError`. We deliberately do NOT hold the original `FormulaError` instance -
 * its stack trace can be several KB per error and adds up fast on grids with many erroring
 * formulas. Reconstruction produces a correctly-typed, translation-capable error; only the
 * original stack trace is lost, which is not user-facing.
 */
export declare class CellFormula {
    readonly rowNode: RowNode;
    readonly column: AgColumn;
    formulaString: string;
    readonly fromDataSource: boolean;
    private readonly beans;
    private readonly service;
    /** Version at which `_value` / error fields were computed. -1 = never computed. */
    private _valueVersion;
    errorType: FormulaErrorType | null;
    private _value;
    astStale: boolean;
    ast: FormulaNode | null;
    errorId: FormulaErrorId | null;
    errorMessage: string;
    errorVariableValues: string[] | null;
    /**
     * Cached `dataTypeSvc.getBaseDataType(column)` result, populated on the first coercion.
     * `undefined` = not yet resolved; `null` = resolved with no type. Stable for this cell's
     * lifetime because column data-type changes trigger a full cache rebuild.
     */
    baseDataType: string | null | undefined;
    constructor(rowNode: RowNode, column: AgColumn, formulaString: string, fromDataSource: boolean, beans: BeanCollection, service: FormulaService);
    /** Cache write: store a fresh computed value (and clear previous error). */
    setComputedValue(v: unknown): void;
    /**
     * Cache write from raw fields - used by the eval loop so it can propagate a thrown
     * `CellFormula` without having to allocate a FormulaError around it.
     */
    setErrorFields(type: FormulaErrorType, errorId: FormulaErrorId | null, message: string, variableValues: string[] | null): void;
    isValueReady(): boolean;
    /** Return the error type string or the computed value. */
    getValue(): unknown;
    /** Returns the AST for the formula and recomputes if stale */
    getAst(): FormulaNode | null;
}
