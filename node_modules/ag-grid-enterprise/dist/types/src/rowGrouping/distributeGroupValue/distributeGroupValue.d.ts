import type { GroupRowValueSetterDistributionOptions, GroupRowValueSetterOptions, GroupRowValueSetterParams } from 'ag-grid-community';
import type { AggFuncInput } from './valueConversion';
/**
 * Built-in `groupRowValueSetter` that distributes a group-level value edit
 * down to descendant rows, respecting the column's aggregation function.
 *
 * Assign directly for default behaviour (uniform for sum, overwrite for avg/no-aggFunc):
 * ```ts
 * colDef.groupRowValueSetter = distributeGroupValue;
 * ```
 *
 * With options (precision rounding, per-aggFunc record):
 * ```ts
 * colDef.groupRowValueSetter = (params) =>
 *     distributeGroupValue(params, { distribution: 'percentage', precision: 2 });
 * ```
 *
 * @returns `true` if at least one child value was changed, `false` otherwise.
 */
export declare const distributeGroupValue: (params: GroupRowValueSetterParams, options?: GroupRowValueSetterOptions) => boolean;
/** Resolved distribution entry: options for distributors, a custom handler, or `false` (suppressed). */
type ResolvedEntry = GroupRowValueSetterDistributionOptions | ((...args: any[]) => any) | false | undefined;
/**
 * Resolves the distribution entry from user options, handling per-aggFunc records and default fallbacks.
 *
 * Resolution order for per-aggFunc records:
 *   1. Explicit entry for the column's aggFunc → resolveEntry
 *   2. `options.default` handler (for unlisted aggFuncs)
 *   3. Inherit from parent options (uses built-in defaults via resolveStrategy)
 *
 * Non-distributable aggFuncs (count/min/max/first/last) are disabled unless
 * explicitly enabled with 'overwrite' (top-level or per-aggFunc record).
 */
export declare function resolveDistributionEntry(options: GroupRowValueSetterOptions | undefined, aggFunc: AggFuncInput): ResolvedEntry;
export {};
