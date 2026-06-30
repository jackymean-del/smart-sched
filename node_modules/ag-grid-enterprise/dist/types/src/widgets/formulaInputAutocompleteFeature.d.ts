import { BeanStub } from 'ag-grid-community';
import type { AgFormulaInputField } from './agFormulaInputField';
export declare class FormulaInputAutocompleteFeature extends BeanStub {
    private readonly field;
    private functionAutocompleteList;
    private functionAutocompleteHidePopup?;
    private functionAutocompleteToken;
    private functionAutocompleteEntries;
    private functionAutocompleteSearch;
    constructor(field: AgFormulaInputField);
    postConstruct(): void;
    onPlainValueUpdated(): void;
    onFormulaValueUpdated(): void;
    private onContentKeyDown;
    private scheduleFunctionAutocompleteUpdate;
    private updateFunctionAutocomplete;
    private getFunctionAutocompleteEntries;
    private openFunctionAutocomplete;
    private closeFunctionAutocomplete;
    private confirmFunctionAutocomplete;
    private isContentFocused;
}
