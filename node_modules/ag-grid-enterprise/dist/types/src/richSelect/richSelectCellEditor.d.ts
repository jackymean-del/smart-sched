import type { RichCellEditorParams } from 'ag-grid-community';
import { AgAbstractCellEditor } from 'ag-grid-community';
import { AgRichSelect } from '../widgets/agRichSelect';
export declare class RichSelectCellEditor<TData = any, TValue = any, TContext = any> extends AgAbstractCellEditor<any, TValue, TValue | TValue[]> {
    protected params: RichCellEditorParams<TData, TValue>;
    private focusAfterAttached;
    protected eEditor: AgRichSelect<TValue>;
    private pendingInitialEventKey;
    private initialEventKeyProcessed;
    /** Last raw input passed to `params.parseValue`. Initialised to `this` as an "uncached" sentinel — a DOM raw value can never equal the editor instance, so the first cache check always misses. */
    private cachedRaw;
    /** Memoised parse result for `cachedRaw`. Returned by `getValue()` when the raw input is unchanged across repeated validation/sync passes within an edit session. */
    private cachedParsed;
    constructor();
    initialiseEditor(_params: RichCellEditorParams<TData, TValue>): void;
    private onEditorPickerValueSelected;
    private getPlaceholderText;
    private isFullAsync;
    private isValuesPaged;
    private resolveAsyncMode;
    private getInitialValueList;
    private buildRichSelectParams;
    private getAsyncValuesSource;
    private getAsyncSearchValues;
    private getAsyncValuesPage;
    private resolveValuesPageInitialStartRow;
    private getSearchStringCallback;
    afterGuiAttached(): void;
    private consumeInitialEventKey;
    private processEventKey;
    focusIn(): void;
    agSetEditValue(value: TValue | null | undefined): void;
    getValue(): any;
    isPopup(): boolean;
    getValidationElement(): HTMLElement;
    getValidationErrors(): string[] | null;
}
