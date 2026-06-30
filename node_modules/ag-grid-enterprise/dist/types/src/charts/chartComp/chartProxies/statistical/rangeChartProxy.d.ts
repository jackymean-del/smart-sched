import type { AgRangeAreaSeriesOptions } from 'ag-charts-types';
import type { UpdateParams } from '../chartProxy';
import { StatisticalChartProxy } from './statisticalChartProxy';
export declare class RangeChartProxy extends StatisticalChartProxy<'range-bar' | 'range-area'> {
    protected getSeries(params: UpdateParams): AgRangeAreaSeriesOptions<any>[];
    protected getData(params: UpdateParams): any[];
}
