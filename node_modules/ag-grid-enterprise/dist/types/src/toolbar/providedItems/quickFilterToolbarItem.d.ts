import type { IToolbarItemComp, IToolbarItemParams } from 'ag-grid-community';
import { Component } from 'ag-grid-community';
export declare class QuickFilterToolbarItem extends Component implements IToolbarItemComp {
    private eInput;
    constructor();
    init(_params: IToolbarItemParams): void;
    refresh(_params: IToolbarItemParams): boolean;
}
