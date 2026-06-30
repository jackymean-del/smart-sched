import type { BeanCollection, IconName } from 'ag-grid-community';
interface CreateToolbarInputParams {
    label: string;
    iconName: IconName;
    initialValue?: string;
}
export declare function createToolbarInput(beans: BeanCollection, { label, iconName, initialValue }: CreateToolbarInputParams): {
    eIconWrapper: HTMLElement | undefined;
    eInput: HTMLInputElement;
};
interface CreateToolbarIconButtonParams {
    iconName: IconName;
    label: string;
    cls?: string;
    disabled?: boolean;
}
export declare function createToolbarIconButton(beans: BeanCollection, { iconName, label, cls, disabled }: CreateToolbarIconButtonParams): HTMLButtonElement;
interface RenderToolbarButtonContentsParams {
    eIcon: HTMLElement;
    eLabel: HTMLElement;
    eGui: HTMLElement;
    icon?: IconName;
    label?: string;
    hoverText?: string;
}
export declare function renderToolbarButtonContents(beans: BeanCollection, { eIcon, eLabel, eGui, icon, label, hoverText }: RenderToolbarButtonContentsParams): void;
export declare function getRowGroupPanelBuilder(beans: BeanCollection, itemName: string): import("ag-grid-community")._IRowGroupPanelBuilder | undefined;
export {};
