import type { AggregationStatusPanelParams, IStatusPanelComp } from 'ag-grid-community';
import { Component } from 'ag-grid-community';
export declare class AggregationComp extends Component implements IStatusPanelComp {
    private readonly sumAggregationComp;
    private readonly countAggregationComp;
    private readonly minAggregationComp;
    private readonly maxAggregationComp;
    private readonly avgAggregationComp;
    private params;
    constructor();
    postConstruct(): void;
    init(params: AggregationStatusPanelParams): void;
    refresh(params: AggregationStatusPanelParams): boolean;
    private setAggregationComponentValue;
    private getAllowedAggregationValueComponent;
    private getAggregationValueComponent;
    /**
     * Aggregation notes:
     * - Uses bigint aggregation when bigint values are present and all numeric values are safe integers.
     * - Non-integer or unsafe integer numbers fall back to number aggregation to avoid precision loss.
     * - Avg uses integer division when bigint aggregation is active, discarding the fractional part.
     * - String values are trimmed; finite numeric strings are aggregated as numbers, while integer strings beyond the
     *   safe integer range are parsed as bigint.
     */
    private onCellSelectionChanged;
}
