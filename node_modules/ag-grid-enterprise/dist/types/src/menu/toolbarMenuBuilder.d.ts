import type { DefaultMenuItem, MenuItemDef, NamedBean } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';
interface ShowToolbarMenuParams {
    anchorElement: HTMLElement;
    menuItems: (DefaultMenuItem | MenuItemDef<any, any>)[];
    ariaLabel: string;
    onClose?: () => void;
}
export declare class ToolbarMenuBuilder extends BeanStub implements NamedBean {
    beanName: "toolbarMenuBuilder";
    showMenu(params: ShowToolbarMenuParams): void;
}
export {};
