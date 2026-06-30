import type { AgBaseHighlightStyleOptions, AgChartTheme, AgChartThemeOverrides, AgMultiSeriesHighlightOptions } from 'ag-charts-types';
import type { ChartProxy, ChartProxyParams } from './chartProxy';
export declare function createAgChartTheme(chartProxyParams: ChartProxyParams, proxy: ChartProxy, isEnterprise: boolean, chartThemeDefaults?: AgChartThemeOverrides, updatedOverrides?: AgChartThemeOverrides): AgChartTheme;
export declare function isStockTheme(themeName: string, theme: {
    themes: Record<string, unknown>;
}): boolean;
export declare function lookupCustomChartTheme(chartProxyParams: ChartProxyParams, name: string): AgChartTheme;
export declare function getSeriesHighlight(crossFiltering: boolean, isSingleSeries?: boolean): AgMultiSeriesHighlightOptions<AgBaseHighlightStyleOptions>;
