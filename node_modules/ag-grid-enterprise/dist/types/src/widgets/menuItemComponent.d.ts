import type { AgComponentSelectorType, AgEventTypeParams, AgGridCommon, BeanCollection, GridOptionsService, GridOptionsWithDefaults, IMenuActionParams } from 'ag-grid-community';
import type { AgMenuItemActivatedEvent, AgMenuItemCallbacks } from '../agStack/agMenuItemComponent';
import { AgMenuItemComponent } from '../agStack/agMenuItemComponent';
export interface MenuItemActivatedEvent extends AgMenuItemActivatedEvent<BeanCollection, GridOptionsWithDefaults, AgEventTypeParams, AgGridCommon<any, any>, GridOptionsService, AgComponentSelectorType, IMenuActionParams> {
}
export declare const MENU_ITEM_CALLBACKS: AgMenuItemCallbacks<BeanCollection, IMenuActionParams, AgGridCommon<any, any>>;
export declare class MenuItemComponent extends AgMenuItemComponent<BeanCollection, GridOptionsWithDefaults, AgEventTypeParams, AgGridCommon<any, any>, GridOptionsService, AgComponentSelectorType, IMenuActionParams> {
    constructor();
}
