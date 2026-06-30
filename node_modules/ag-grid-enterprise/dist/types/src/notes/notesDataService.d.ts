import type { GetNoteParams, INotesDataService, NamedBean, SetNoteParams } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';
export declare class NotesDataService extends BeanStub implements INotesDataService, NamedBean {
    readonly beanName: "notesDataSvc";
    private dataSource?;
    postConstruct(): void;
    hasDataSource(): boolean;
    supportsFullWidthRows(): boolean;
    getNote(params: GetNoteParams): import("ag-grid-community").Note<any> | undefined;
    setNote(params: SetNoteParams): void;
    private setDataSource;
    private createInitParams;
    private isFullWidthDataSource;
    destroy(): void;
}
