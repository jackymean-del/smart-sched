import type { IToolbarItemComp, IToolbarItemParams } from 'ag-grid-community';
import { Component } from 'ag-grid-community';
export declare class FindToolbarItem extends Component implements IToolbarItemComp {
    private eInput;
    private eMatchCount;
    private ePrevButton;
    private eNextButton;
    constructor();
    init(_params: IToolbarItemParams): void;
    refresh(_params: IToolbarItemParams): boolean;
    private onFindChanged;
    private syncMatchState;
    private updateMatchDisplay;
}
