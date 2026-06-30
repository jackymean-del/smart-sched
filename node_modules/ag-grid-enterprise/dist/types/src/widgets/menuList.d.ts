import type { AgComponentSelectorType, AgEventTypeParams, AgGridCommon, BeanCollection, GridOptionsService, GridOptionsWithDefaults, IMenuActionParams, WithoutGridCommon } from 'ag-grid-community';
import { AgMenuList } from '../agStack/agMenuList';
export declare class MenuList extends AgMenuList<BeanCollection, GridOptionsWithDefaults, AgEventTypeParams, AgGridCommon<any, any>, GridOptionsService, AgComponentSelectorType, IMenuActionParams> {
    constructor(level?: number, menuActionParams?: WithoutGridCommon<IMenuActionParams>);
}
