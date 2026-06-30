import type { GroupRowValueSetterDistributionOptions, GroupRowValueSetterParams } from 'ag-grid-community';
import type { AggFuncInput } from './valueConversion';
/** Distributes a BigInt value to children using integer-safe arithmetic. */
export declare class DistributorBigInt {
    private readonly params;
    private readonly children;
    private readonly column;
    private readonly count;
    private readonly bigCount;
    private readonly target;
    private readonly oldTarget;
    private readonly newValue;
    private readonly strategy;
    private readonly getVal;
    private readonly setVal;
    constructor(params: GroupRowValueSetterParams, opts: GroupRowValueSetterDistributionOptions | undefined, aggFunc: AggFuncInput);
    run(): boolean;
    /** Reads a child's current value as a bigint. */
    private readOne;
    /** Writes a value to a single child. */
    private writeOne;
    /** Writes the same value to every child. */
    private writeAll;
    /** Writes uniform values directly without array allocation. */
    private writeUniformDirect;
    /** Writes increment values directly without array allocation. */
    private writeIncrementDirect;
    /** Computes percentage distribution and writes values. */
    private writePercentage;
}
