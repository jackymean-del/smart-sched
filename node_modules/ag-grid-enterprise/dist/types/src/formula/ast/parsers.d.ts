import type { BeanCollection } from 'ag-grid-community';
import type { FormulaNode } from './utils';
/**
 * Parse a full formula string that starts with "=" into an AST.
 *
 * @param formula The full formula, e.g. "=SUM(A1, 2+3)".
 * @param unsafe If `true` it will not validate if the row/column exists when parsing the formula.
 * @returns The root FormulaNode of the parsed expression.
 * @throws FormulaParseError if the "=" is missing or the body is invalid.
 *
 * @example
 * parseFormula(beans, '=1+2') // => operation("+", [1,2])
 */
export declare const parseFormula: (beans: BeanCollection, formula: string, unsafe?: boolean) => FormulaNode;
