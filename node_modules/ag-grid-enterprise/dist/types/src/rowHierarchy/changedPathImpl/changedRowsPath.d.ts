import type { ChangedRowsPath, IRowNode, RowNode } from 'ag-grid-community';
/**
 * Set-based ChangedPath — no column tracking.
 * All columns are considered changed for every node in the path.
 *
 * Total space: O(R), where R = number of tracked rows (including ancestors).
 */
export declare class ChangedRowsPathImpl implements ChangedRowsPath {
    readonly kind: "rows";
    /**
     * All tracked rows, lazily sorted by depth-first when `getSortedRows` is called.
     * Space: O(R) where R = number of tracked rows (including ancestors).
     */
    private rows;
    /**
     * True when `rows` needs resorting, set after new tracked rows are added.
     * Space: O(1).
     */
    private unsorted;
    /**
     * Hash set that keeps track of which rows are in `rows` for O(1) lookup.
     * Space: O(R) where R = number of tracked rows (including ancestors).
     */
    private readonly rowSet;
    /** {@inheritDoc ChangedRowsPath.addRow} Time: O(D), D = depth. */
    addRow(rowNode: IRowNode | null | undefined): void;
    /** {@inheritDoc ChangedRowsPath.addCell} */
    addCell(rowNode: IRowNode | null | undefined, _colId: string | null | undefined): void;
    /** {@inheritDoc ChangedRowsPath.hasRow} Time: O(1). */
    hasRow(rowNode: IRowNode): boolean;
    /** {@inheritDoc ChangedRowsPath.getSortedRows} Time: O(1) cached, O(R) if sort was invalidated. */
    getSortedRows(): RowNode[];
}
