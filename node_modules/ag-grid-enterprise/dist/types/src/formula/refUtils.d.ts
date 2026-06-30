export declare const isFormulaIdentChar: (char: string | undefined) => boolean;
export declare const isFormulaIdentStart: (char: string | undefined) => boolean;
export declare const isValidFunctionName: (name: string) => boolean;
type ParsedA1Ref = {
    startCol: string;
    startRow: string;
    startColAbsolute: boolean;
    startRowAbsolute: boolean;
    endCol?: string;
    endRow?: string;
    endColAbsolute?: boolean;
    endRowAbsolute?: boolean;
};
export declare const isStandaloneRefToken: (text: string, matchIndex: number, ref: string) => boolean;
export declare const parseA1Ref: (ref: string, options?: {
    allowTrailingColon?: boolean;
}) => ParsedA1Ref | null;
type RefTokenMatch = {
    ref: string;
    start: number;
    end: number;
    index: number;
};
export declare const getRefTokenMatches: (text: string) => RefTokenMatch[];
export {};
