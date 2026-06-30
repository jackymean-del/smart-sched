import type { AgComponentSelectorType, AgEventTypeParams, AgGridCommon, BeanCollection, GridOptionsService, GridOptionsWithDefaults } from 'ag-grid-community';
import { AgContentEditableField } from 'ag-grid-community';
type RangeInsertAction = 'insert' | 'replace' | 'none';
type TokenInsertResult = {
    previousRef?: string;
    tokenIndex?: number | null;
};
export declare class AgFormulaInputField extends AgContentEditableField<BeanCollection, GridOptionsWithDefaults, AgEventTypeParams, AgGridCommon<any, any>, GridOptionsService, AgComponentSelectorType, string> {
    private currentValue;
    private selectionCaretOffset;
    private lastTokenValueOffset;
    private lastTokenValueLength;
    private lastTokenCaretOffset;
    private lastTokenRef?;
    private rangeSyncFeature?;
    private autocompleteFeature?;
    private focusFromMouseTime;
    private suppressNextFocusCaretPlacement;
    private readonly formulaColorByRef;
    constructor();
    postConstruct(): void;
    setValue(value?: string | null, silent?: boolean): this;
    getCurrentValue(): string;
    setEditingCellRef(column: any, rowIndex: number | null | undefined): void;
    rememberCaret(): void;
    private setEditorValue;
    private renderFormula;
    private renderPlainValue;
    withSelectionChangeHandlingSuppressed(action: () => void): void;
    getColorIndexForRef(ref: string): number | null;
    getColorIndexForToken(tokenIndex?: number | null): number | null;
    hasColorForRef(ref: string): boolean;
    moveColorToRef(fromRef: string | undefined, toRef: string, fallback?: number): number | null;
    private updateFormulaColorsFromValue;
    private onContentInput;
    private onContentFocus;
    private onContentBlur;
    private onContentMouseDown;
    insertOrReplaceToken(ref: string, isNew: boolean): TokenInsertResult;
    removeTokenRef(ref: string, tokenIndex?: number | null): boolean;
    applyRangeInsert(ref: string): {
        action: RangeInsertAction;
        previousRef?: string;
        tokenIndex?: number | null;
    };
    restoreCaretAfterToken(): void;
    private replaceTokenAtMatch;
    private getValueOffsetFromCaret;
    private getTokenInsertOffsets;
    getCaretOffsetsForAutocomplete(value: string): {
        caretOffset: number;
        valueOffset: number;
    } | null;
    private getCaretOffsets;
    private updateLastTokenTracking;
    private getFormulaState;
    private dispatchValueChanged;
    private applyPlainValue;
    private applyFormulaValue;
    applyFormulaValueChange(params: {
        currentValue: string;
        nextValue: string;
        caret: number;
        updateTracking?: () => void;
    }): void;
    replaceTokenRef(previousRef: string, nextRef: string, colorIndex?: number | null, tokenIndex?: number | null): number | null;
}
export {};
