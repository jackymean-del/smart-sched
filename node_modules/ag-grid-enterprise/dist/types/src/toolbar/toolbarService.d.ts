import type { IToolbarComp, IToolbarItem, IToolbarService, NamedBean } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';
export declare class ToolbarService extends BeanStub implements NamedBean, IToolbarService {
    beanName: "toolbar";
    private comp?;
    setToolbar(toolbar: IToolbarComp): void;
    clearToolbar(toolbar: IToolbarComp): void;
    getToolbarItemInstance<T = IToolbarItem>(key: string): T | undefined;
}
