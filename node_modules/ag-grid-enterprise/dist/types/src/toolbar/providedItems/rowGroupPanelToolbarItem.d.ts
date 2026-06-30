import type { IToolbarItemComp, IToolbarItemParams } from 'ag-grid-community';
import { Component } from 'ag-grid-community';
export declare class RowGroupPanelToolbarItem extends Component implements IToolbarItemComp {
    constructor();
    init(_params: IToolbarItemParams): void;
    refresh(_params: IToolbarItemParams): boolean;
}
