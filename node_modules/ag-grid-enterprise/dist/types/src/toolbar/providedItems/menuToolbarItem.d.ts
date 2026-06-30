import type { IToolbarItemComp, IToolbarItemParams } from 'ag-grid-community';
import { Component } from 'ag-grid-community';
export declare class MenuToolbarItem extends Component implements IToolbarItemComp {
    readonly agToolbarButton: "agToolbarButton";
    private readonly eIcon;
    private readonly eLabel;
    private readonly eChevron;
    private params;
    constructor();
    init(params: IToolbarItemParams): void;
    refresh(params: IToolbarItemParams): boolean;
    private getAccessibleName;
    private applyParams;
    private showMenu;
}
