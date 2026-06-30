import type { ChangedCellsPath, IRowNode, RowNode } from 'ag-grid-community';
/**
 * Tracks changed rows and which columns changed on each, using bitmasks for fast lookups.
 *
 * Used by the CSRM pipeline to skip unchanged rows/columns during aggregation.
 * Rows added via `addRow` are marked as all-columns-changed.
 * Rows added via `addCell` track specific columns.
 *
 * A single Map stores both row and column mappings — RowNode keys hold the row's bitmask
 * index (or -1 for all-columns), string keys hold the column slot number. Object and string
 * keys never collide in a Map. Changed columns are stored as bitmask arrays of 32-bit integers,
 * one array per group of 32 columns.
 *
 * Total space: O(R × ⌈C/32⌉ + C), where R = tracked rows (including ancestors), C = tracked columns.
 */
export declare class ChangedCellsPathImpl implements ChangedCellsPath {
    readonly kind: "cells";
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
     * Maps RowNode to row slot (or -1 for all-columns) and colId string to column slot.
     * Used also to check if a row is tracked (has a slot) in O(1).
     * RowNode keys never collide with string keys in a Map.
     * Space: O(R + C) where R = number of tracked rows (including ancestors), C = number of tracked columns.
     */
    private readonly slots;
    /**
     * Bitmask array for the first 32 columns. Always present.
     * Space: O(R) where R = number of tracked rows (including ancestors).
     */
    private readonly bits;
    /**
     * Extra bitmask arrays for columns 32+. `null` when C ≤ 32; `extraBits[0]` covers columns 32–63, etc.
     * Space: O(R × max(0, ⌈C/32⌉ − 1)) where R = number of tracked rows (including ancestors), C = number of tracked columns.
     */
    private extraBits;
    /**
     * Number of distinct column IDs added via `addCell`, used to assign column slots.
     * Does not include columns tracked via `addRow` (all-columns). Time: O(1).
     * Space: O(1).
     */
    private colCount;
    /** {@inheritDoc ChangedCellsPath.addRow} Time: O(D), D = depth. */
    addRow(rowNode: IRowNode | null | undefined): void;
    /** {@inheritDoc ChangedCellsPath.addCell} Time: O(D × ⌈C/32⌉), D = depth, C = tracked columns. */
    addCell(rowNode: IRowNode | null | undefined, colId: string | null | undefined): void;
    /** {@inheritDoc ChangedCellsPath.hasRow} Time: O(1). */
    hasRow(rowNode: IRowNode): boolean;
    /** {@inheritDoc ChangedCellsPath.getSortedRows} Time: O(1) cached, O(R) if sort was invalidated. */
    getSortedRows(): RowNode[];
    /** {@inheritDoc ChangedCellsPath.getSlot} Read-only — does not allocate slots. Time: O(1). */
    getSlot(key: IRowNode | string): number;
    /** {@inheritDoc ChangedCellsPath.hasCellBySlot} Time: O(1). */
    hasCellBySlot(rowSlot: number, colSlot: number): boolean;
    /** Registers a new row and all its unregistered ancestors. Returns the row's bitmask index.
     * Time: O(D × ⌈C/32⌉) where D = depth, C = number of tracked columns. In practice O(D) because
     * C < 32 is the common case (single bitmask word per row, no extraBits loop).
     * Space: O(D × ⌈C/32⌉).
     */
    private ensureRow;
    /**
     * Assigns a new column slot. Appends a bitmask array when crossing a 32-column boundary.
     * Time: O(1) amortised, O(R) when crossing a 32-column boundary, where R = number of tracked rows (including ancestors) due to array extension and copying.
     * Space: O(R) when crossing a 32-column boundary.
     */
    private ensureCol;
}
