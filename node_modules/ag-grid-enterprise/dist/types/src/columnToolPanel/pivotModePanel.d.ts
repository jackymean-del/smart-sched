import { Component } from 'ag-grid-community';
import type { ColumnStateUpdateParams } from './updates/columnStateUpdateTypes';
export declare class PivotModePanel extends Component {
    private readonly params;
    private readonly onPivotModeValueChanged?;
    private readonly cbPivotMode;
    constructor(params: ColumnStateUpdateParams, onPivotModeValueChanged?: (() => void) | undefined);
    private getCurrentPivotMode;
    syncFromGrid(): void;
    refreshEditStrategy(): void;
    postConstruct(): void;
}
