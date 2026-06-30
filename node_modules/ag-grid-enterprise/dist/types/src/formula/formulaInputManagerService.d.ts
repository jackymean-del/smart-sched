import type { IFormulaInputManagerService, NamedBean } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';
import type { RangeSelectionExtension } from '../rangeSelection/rangeSelectionExtensions';
export declare class FormulaInputManagerService extends BeanStub implements IFormulaInputManagerService, NamedBean, RangeSelectionExtension {
    readonly beanName: "formulaInputManager";
    private activeEditor;
    private activeEditorDeactivate;
    postConstruct(): void;
    registerActiveEditor(editorId: number, onDeactivate: () => void): boolean;
    unregisterActiveEditor(editorId: number, onDeactivate: () => void): void;
    isActiveEditor(editorId: number): boolean;
    shouldSuppressRangeSelection(eventTarget: EventTarget | null): boolean;
    private registerRangeSelectionExtension;
}
