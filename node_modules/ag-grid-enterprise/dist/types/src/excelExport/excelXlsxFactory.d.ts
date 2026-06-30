import type { AgColumn, ExcelCustomMetadata, ExcelFactoryMode, ExcelHeaderFooterImage, ExcelImage, ExcelStyle, ExcelWorksheet, RowHeightCallbackParams } from 'ag-grid-community';
import type { ExcelCalculatedImage, ExcelComment, ExcelDataTable, ExcelHeaderFooterCalculatedImage, ExcelHeaderFooterPosition, ImageIdMap } from './assets/excelInterfaces';
import type { ExcelGridSerializingParams } from './excelSerializingSession';
/** Maps images to sheet */
export declare const XLSX_IMAGES: Map<string, {
    sheetId: number;
    image: (ExcelCalculatedImage | ExcelHeaderFooterCalculatedImage)[];
}[]>;
/** Maps sheets to images */
export declare const XLSX_WORKSHEET_IMAGES: Map<number, ExcelCalculatedImage[]>;
/** Maps sheets to header/footer images */
export declare const XLSX_WORKSHEET_HEADER_FOOTER_IMAGES: Map<number, ExcelHeaderFooterCalculatedImage[]>;
/** Maps all workbook images to a global Id */
export declare const XLSX_WORKBOOK_IMAGE_IDS: ImageIdMap;
/** Maps all sheet images to unique Ids */
export declare const XLSX_WORKSHEET_IMAGE_IDS: Map<number, ImageIdMap>;
/** Maps all sheet tables to unique Ids */
export declare const XLSX_WORKSHEET_DATA_TABLES: Map<number, ExcelDataTable>;
/** Maps sheets to Excel notes/comments */
export declare const XLSX_WORKSHEET_COMMENTS: Map<number, ExcelComment[]>;
export declare function getXlsxFactoryMode(): ExcelFactoryMode;
export declare function setXlsxFactoryMode(factoryMode: ExcelFactoryMode): void;
export declare function createXlsxExcel(styles: ExcelStyle[], worksheet: ExcelWorksheet, config: ExcelGridSerializingParams): string;
export declare function addXlsxHeaderFooterImageToMap(image: ExcelHeaderFooterImage, position: ExcelHeaderFooterPosition): void;
export declare function addXlsxBodyImageToMap(image: ExcelImage, rowIndex: number, col: AgColumn, columnsToExport?: AgColumn[], rowHeight?: number | ((params: RowHeightCallbackParams) => number)): void;
export declare function getXlsxStringPosition(str: string): number;
export declare function resetXlsxFactory(): void;
export declare function createXlsxWorkbook(currentSheet: number): string;
export declare function createXlsxStylesheet(defaultFontSize: number): string;
export declare function createXlsxSharedStrings(): string;
export declare function createXlsxCore(author: string): string;
export declare function createXlsxCustomProperties(metadata: ExcelCustomMetadata): string;
export declare function createXlsxContentTypes(sheetLen: number, hasCustomProperties?: boolean): string;
export declare function createXlsxRels(hasCustomProperties?: boolean): string;
export declare function createXlsxTheme(): string;
export declare function createXlsxTable(dataTable: ExcelDataTable, index?: number): string;
export declare function createXlsxWorkbookRels(sheetLen: number): string;
export declare function createXlsxDrawing(sheetIndex: number): string;
export declare function createXlsxComments(sheetIndex: number, author: string, suppressPrependAuthorToNotes?: boolean): string;
export declare function createXlsxDrawingRel(sheetIndex: number): string;
export declare function createXlsxVmlDrawing(sheetIndex: number): string;
export declare function createXlsxNoteVmlDrawing(sheetIndex: number): string;
export declare function createXlsxVmlDrawingRel(sheetIndex: number): string;
export declare function createXlsxRelationships({ drawingIndex, noteVmlDrawingIndex, headerFooterVmlDrawingIndex, commentsIndex, tableName, }?: {
    drawingIndex?: number;
    noteVmlDrawingIndex?: number;
    headerFooterVmlDrawingIndex?: number;
    commentsIndex?: number;
    tableName?: string;
}): string;
export declare const syncXlsxOrderWithSheetData: (data: string[]) => void;
export declare class Workbook {
    getStringPosition(str: string): number;
    addBodyImageToMap(image: ExcelImage, rowIndex: number, col: AgColumn, columnsToExport?: AgColumn[], rowHeight?: number | ((params: RowHeightCallbackParams) => number)): void;
    addHeaderFooterImageToMap(image: ExcelHeaderFooterImage, position: ExcelHeaderFooterPosition): void;
    addWorksheet(styles: ExcelStyle[], worksheet: ExcelWorksheet, config: ExcelGridSerializingParams): string;
    syncOrderWithSheetData(data: string[]): void;
    reset(): void;
    setFactoryMode(factoryMode: ExcelFactoryMode): void;
    getFactoryMode(): ExcelFactoryMode;
    getSheetNames(): string[];
}
