import type { AgCartesianAxisOptions, AgCartesianChartOptions, AgWaterfallSeriesOptions } from 'ag-charts-types';
import type { UpdateParams } from '../chartProxy';
import { CartesianChartProxy } from './cartesianChartProxy';
export declare class WaterfallChartProxy extends CartesianChartProxy<'waterfall'> {
    protected isSingleSeries: boolean;
    protected getAxes(params: UpdateParams, commonChartOptions: AgCartesianChartOptions): Record<string, AgCartesianAxisOptions>;
    protected getSeries(params: UpdateParams): AgWaterfallSeriesOptions[];
}
