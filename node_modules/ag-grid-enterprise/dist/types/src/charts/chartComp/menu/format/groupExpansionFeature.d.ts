import { BeanStub } from 'ag-grid-community';
import type { GroupComponent } from '../../../../widgets/gridEnterpriseWidgetTypes';
export declare class GroupExpansionFeature extends BeanStub {
    private readonly groupContainer;
    private id;
    private readonly groupComponents;
    private expandedGroupComponent?;
    constructor(groupContainer: HTMLElement);
    addGroupComponent(groupComponent: GroupComponent): void;
    destroy(): void;
}
