import type { AgComponentSelectorType, AgEventTypeParams, AgGridCommon, BeanCollection, ComponentSelector, GridOptionsService, GridOptionsWithDefaults } from 'ag-grid-community';
import type { AgColorPickerParams } from '../../agStack/agColorPicker';
import { AgColorPicker } from '../../agStack/agColorPicker';
export interface ColorPickerParams extends Omit<AgColorPickerParams<AgComponentSelectorType>, 'dialogCallbacks'> {
}
export declare class ColorPicker extends AgColorPicker<BeanCollection, GridOptionsWithDefaults, AgEventTypeParams, AgGridCommon<any, any>, GridOptionsService, AgComponentSelectorType> {
    constructor(config?: ColorPickerParams);
}
export declare const ColorPickerSelector: ComponentSelector;
