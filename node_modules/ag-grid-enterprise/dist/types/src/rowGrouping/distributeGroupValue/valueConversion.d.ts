import type { ColDef, GroupRowValueSetterDistribution } from 'ag-grid-community';
/** Resolved distribution strategy. `false` means suppressed (disabled by default for count/min/max/first/last/custom aggFuncs, or explicit false/null). */
export type DistributionStrategy = GroupRowValueSetterDistribution | false;
/** The raw aggFunc value from colDef, passed through without coercion.
 * String = named aggFunc, function = inline custom aggFunc, null/undefined = no aggFunc. */
export type AggFuncInput = string | ((...args: any[]) => any) | null | undefined;
/**
 * Resolves the distribution strategy from the aggFunc and explicit distribution option.
 * false and null always suppress distribution.
 * count/min/max/first/last are non-distributable: only 'overwrite' enables them
 * (and only via explicit per-aggFunc record entries — see resolveDistributionEntry).
 * Custom string aggFuncs and function aggFuncs are disabled by default.
 * Columns with no aggFunc (null/undefined) default to 'overwrite'.
 */
export declare const resolveStrategy: (aggFunc: AggFuncInput, distribution: GroupRowValueSetterDistribution | boolean | null | undefined) => DistributionStrategy;
/** Whether the aggFunc is non-distributable: count/min/max/first/last have no meaningful
 * distribution and are disabled by default. Only explicit 'overwrite' enables them
 * (at top level or in per-aggFunc record entries; true in per-aggFunc records also works). */
export declare const isNonDistributable: (aggFunc: AggFuncInput) => boolean;
/** Whether the aggFunc is a built-in distributable aggFunc with a known default strategy.
 * sum defaults to 'uniform', avg defaults to 'overwrite'. Custom, no-aggFunc, and
 * non-distributable aggFuncs return false and should check the options.default handler. */
export declare const isDistributableBuiltin: (aggFunc: AggFuncInput) => boolean;
/** Coerces an unknown value to a number. Returns 0 for non-convertible inputs. Preserves NaN, Infinity, and -Infinity for number inputs. */
export declare const toNumber: (raw: unknown) => number;
/** Coerces an unknown value to a BigInt. Returns 0n for non-convertible inputs. */
export declare const toBigInt: (raw: unknown) => bigint;
/**
 * Returns true if a value is meaningfully numeric — i.e. something that toNumber/toBigInt can
 * extract a real number from, as opposed to null/undefined/non-numeric strings/plain objects
 * where toNumber returns 0 as a fallback.
 */
export declare const isNumericLike: (value: unknown) => boolean;
/**
 * Auto-detects rounding precision from the column definition.
 * Returns the number of decimal places, or `undefined` if no rounding should be applied.
 */
export declare const detectPrecision: (colDef: ColDef) => number | undefined;
