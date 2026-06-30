interface BaseOperatorDef {
    symbol: string;
    precedence: number;
}
export interface InfixOpDef extends BaseOperatorDef {
    fixity: 'infix';
    associativity: 'left' | 'right';
    isAssociative?: true;
}
interface ExternalOpDef extends BaseOperatorDef {
    fixity: 'prefix' | 'postfix';
}
export type OperatorDef = InfixOpDef | ExternalOpDef;
/** Return the operator def for a given symbol and (optionally) fixity. */
export declare function getDefBySymbol(symbol: string, fixity: 'infix'): InfixOpDef | undefined;
export declare function getDefBySymbol(symbol: string, fixity: 'prefix' | 'postfix'): ExternalOpDef | undefined;
/** Greedy operator list for tokenization (longest-first). */
export declare const OP_SYMBOLS_DESC: string[];
/** OperatorDefs mapped by symbol. */
export declare const OP_BY_SYMBOL: Map<string, OperatorDef[]>;
export {};
