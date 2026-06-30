import type { AgCartesianAxisOptions, AgChartThemeOverrides } from 'ag-charts-types';
import { CartesianChartProxy } from '../cartesian/cartesianChartProxy';
import type { UpdateParams } from '../chartProxy';
export declare class ComboChartProxy extends CartesianChartProxy<'line' | 'bar' | 'area'> {
    getAxes(params: UpdateParams): Record<string, AgCartesianAxisOptions>;
    protected getSeries(params: UpdateParams): any;
    private getYKeys;
    protected setSeriesChartThemeDefaults(overrides: AgChartThemeOverrides): void;
}
