import type { IToolbarItemComp, IToolbarItemParams } from 'ag-grid-community';
import { Component } from 'ag-grid-community';
export declare class ButtonToolbarItem extends Component implements IToolbarItemComp {
    readonly agToolbarButton: "agToolbarButton";
    private readonly eIcon;
    private readonly eLabel;
    private params;
    constructor();
    init(params: IToolbarItemParams): void;
    refresh(params: IToolbarItemParams): boolean;
    private applyParams;
    private invokeAction;
}
