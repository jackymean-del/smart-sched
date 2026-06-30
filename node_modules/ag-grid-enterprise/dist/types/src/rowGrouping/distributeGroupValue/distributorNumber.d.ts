import type { GroupRowValueSetterDistributionOptions, GroupRowValueSetterParams } from 'ag-grid-community';
import type { AggFuncInput } from './valueConversion';
/** Distributes a numeric value to children using the chosen strategy. */
export declare class DistributorNumber {
    private readonly params;
    private readonly children;
    private readonly column;
    private readonly count;
    private readonly target;
    private readonly oldTarget;
    private readonly precision;
    private readonly newValue;
    private readonly strategy;
    private readonly getVal;
    private readonly setVal;
    private readonly isAvg;
    constructor(params: GroupRowValueSetterParams, opts: GroupRowValueSetterDistributionOptions | undefined, aggFunc: AggFuncInput);
    run(): boolean;
    private readOne;
    /**
     * Reads a child's value and leaf count in a single call.
     * For group children, reads the raw avg agg object { value, count } if available,
     * falling back to allLeafChildren.length. For leaf children, count is always 1.
     */
    private readValueAndCount;
    private writeOne;
    private writeAll;
    private distributeUniform;
    private distributeIncrement;
    /**
     * Scales each child's value proportionally so they sum to the target.
     * Each child keeps its relative share: newValue[i] = oldValue[i] × (target / oldTotal).
     * With precision rounding, uses scaled integers and spreads the remainder across the first N children.
     */
    private distributePercentage;
    /**
     * Percentage distribution for avg aggregation.
     *
     * Avg group children may themselves be groups with different leaf counts,
     * so we can't scale avg values directly — a group averaging 2 leaves contributes
     * twice as much to the parent avg as a group averaging 1 leaf.
     *
     * Instead, we convert each child's avg to its sum contribution (avg × leafCount),
     * scale those sums proportionally, then convert back to avg for writing.
     *
     * The target is also converted: constructor stores target = newAvg × childGroupCount,
     * but we need effectiveTarget = newAvg × totalLeafCount for sum-space scaling.
     */
    private distributePercentageAvg;
}
