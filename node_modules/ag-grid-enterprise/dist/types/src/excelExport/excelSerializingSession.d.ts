import type { AgColumn, Column, ColumnGroup, ExcelRow, ExcelStyle, ExcelWorksheetConfigParams, GridSerializingParams, IFormulaService, INotesService, RowAccumulator, RowNode, RowSpanningAccumulator } from 'ag-grid-community';
import { BaseGridSerializingSession } from 'ag-grid-community';
import type { Workbook } from './excelXlsxFactory';
export interface StyleLinkerInterface {
    rowType: 'HEADER_GROUPING' | 'HEADER' | 'BODY';
    rowIndex: number;
    value: string;
    column?: Column;
    columnGroup?: ColumnGroup;
    node?: RowNode;
}
export interface ExcelGridSerializingParams extends ExcelWorksheetConfigParams, GridSerializingParams {
    formulaSvc?: IFormulaService;
    baseExcelStyles: ExcelStyle[];
    styleLinker: (params: StyleLinkerInterface) => string[];
    frozenRowCount?: number;
    frozenColumnCount?: number;
    workbook: Workbook;
    headerRowCount?: number;
    notesSvc?: INotesService;
    pivotModeActive?: boolean;
}
export declare class ExcelSerializingSession extends BaseGridSerializingSession<ExcelRow[]> {
    private readonly config;
    private readonly stylesByIds;
    private readonly formulaSvc?;
    private readonly notesSvc?;
    private mixedStyles;
    private mixedStyleCounter;
    private readonly excelStyles;
    private readonly workbook;
    private readonly rows;
    private cols;
    private columnsToExport;
    private frozenRowCount;
    private skipFrozenRows;
    private frozenColumnCount;
    private skipFrozenColumns;
    constructor(config: ExcelGridSerializingParams);
    addCustomContent(customContent: ExcelRow[]): void;
    onNewHeaderGroupingRow(): RowSpanningAccumulator;
    onNewHeaderRow(): RowAccumulator;
    onNewBodyRow(node?: RowNode): RowAccumulator;
    prepare(columnsToExport: AgColumn[]): void;
    parse(): string;
    private createWorksheet;
    private addRowOutlineIfNecessary;
    private isAnyParentCollapsed;
    private convertColumnToExcel;
    private onNewHeaderColumn;
    private onNewBodyColumn;
    private onNewRow;
    private addWorksheetToWorkbook;
    private mapSharedStrings;
    private getDataTypeForValue;
    private getTypeFromStyle;
    private addImage;
    private createCell;
    private createMergedCell;
    private resolveBodyCellNote;
    private getCellNoteExportParams;
    private getCellValue;
    private addXlfnPrefix;
    private getStyleId;
    private addNewMixedStyle;
    private isFormula;
    private isNumerical;
    private getStyleById;
}
