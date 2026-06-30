import type { AgAreaSeriesOptions, AgCartesianAxisOptions, AgCartesianChartOptions, AgCartesianSeriesOptions, AgChartThemeOverrides, AgLineSeriesOptions } from 'ag-charts-types';
import type { UpdateParams } from '../chartProxy';
import { ChartProxy } from '../chartProxy';
export declare abstract class CartesianChartProxy<TSeries extends 'area' | 'bar' | 'histogram' | 'line' | 'scatter' | 'bubble' | 'waterfall' | 'box-plot' | 'range-area' | 'range-bar'> extends ChartProxy<AgCartesianChartOptions, TSeries> {
    protected crossFilteringAllPoints: Set<string>;
    protected crossFilteringSelectedPoints: string[];
    protected isSingleSeries: boolean;
    protected abstract getAxes(params: UpdateParams, commonChartOptions: AgCartesianChartOptions): Record<string, AgCartesianAxisOptions>;
    protected abstract getSeries(params: UpdateParams): AgCartesianSeriesOptions[];
    protected getUpdateOptions(params: UpdateParams, commonChartOptions: AgCartesianChartOptions): AgCartesianChartOptions;
    protected getData(params: UpdateParams, axes: Record<string, AgCartesianAxisOptions>): any[];
    private getDataTransformedData;
    protected getXAxisType(params: UpdateParams): "number" | "category" | "time" | "grouped-category";
    private isXAxisOfType;
    private transformTimeData;
    crossFilteringReset(): void;
    protected crossFilteringPointSelected(point: string): boolean;
    protected crossFilteringDeselectedPoints(): boolean;
    protected extractLineAreaCrossFilterSeries(series: (AgLineSeriesOptions | AgAreaSeriesOptions)[], params: UpdateParams): (AgAreaSeriesOptions<any, unknown> | AgLineSeriesOptions<any, unknown>)[];
    private getCrossFilterData;
    private crossFilteringAddSelectedPoint;
    protected isHorizontal(commonChartOptions: AgCartesianChartOptions): boolean;
    protected getSeriesChartThemeDefaults(): AgChartThemeOverrides[TSeries];
}
