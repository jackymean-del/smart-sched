import type { AgComponentSelectorType, AgEventTypeParams, AgGridCommon, BeanCollection, FocusableContainer, GridOptionsService, GridOptionsWithDefaults } from 'ag-grid-community';
import type { AgDialogCallbacks, AgDialogOptions } from '../agStack/agDialog';
import { AgDialog } from '../agStack/agDialog';
import type { PanelPostProcessPopupParams } from './panel';
interface DialogOptions extends AgDialogOptions<BeanCollection, GridOptionsWithDefaults, AgEventTypeParams, PanelPostProcessPopupParams> {
}
export declare const DIALOG_CALLBACKS: AgDialogCallbacks<BeanCollection, Dialog>;
export declare class Dialog extends AgDialog<BeanCollection, GridOptionsWithDefaults, AgEventTypeParams, AgGridCommon<any, any>, GridOptionsService, AgComponentSelectorType, DialogOptions> implements FocusableContainer {
    constructor(config: DialogOptions);
    getFocusableContainerName(): 'dialog';
}
export {};
