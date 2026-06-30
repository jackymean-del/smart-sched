import { Component } from 'ag-grid-community';
import type { GroupComponent } from '../../../../widgets/gridEnterpriseWidgetTypes';
import type { ChartSeriesType } from '../../utils/seriesTypeMapper';
import type { ChartMenuContext } from '../chartMenuContext';
export interface FormatPanelOptions extends ChartMenuContext {
    isExpandedOnInit: boolean;
    seriesType: ChartSeriesType;
    registerGroupComponent: (groupComponent: GroupComponent) => void;
}
export declare class FormatPanel extends Component {
    private readonly chartMenuContext;
    private chartPanelFeature;
    private groupExpansionFeature;
    constructor(chartMenuContext: ChartMenuContext);
    postConstruct(): void;
    private createPanels;
    private getFormatPanelDef;
    private isGroupPanelShownInSeries;
}
