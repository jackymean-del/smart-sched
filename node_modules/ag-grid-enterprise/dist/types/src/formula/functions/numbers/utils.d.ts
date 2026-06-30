export declare function dateFromDays(n: number): Date;
export declare function isDateValue(v: unknown): v is Date;
/** Convert a value to a finite number, allowing numeric strings; else throw. */
export declare function coerceFiniteNumber(fname: string, v: unknown): number;
/** Convert a value to a finite number or bigint, allowing numeric strings. */
export declare function coerceFiniteNumberOrBigInt(fname: string, v: unknown): number | bigint;
export declare function coerceBigInt(fname: string, v: number | bigint): bigint;
