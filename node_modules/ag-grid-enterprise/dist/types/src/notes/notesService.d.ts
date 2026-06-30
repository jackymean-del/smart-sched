import type { CellCtrl, GetNoteParams, INoteAccess, INotesService, NamedBean, Note, RefreshNotesParams, RowCtrl, SetNoteParams } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';
import { AgFullWidthRowNotesFeature, AgNotesFeature } from './agNotesFeature';
import type { INotePopupOwner, INotesFeatureSupport, InternalSetNoteParams } from './notesShared';
export declare class NotesService extends BeanStub implements INotesService, INotesFeatureSupport, NamedBean {
    readonly beanName: "notesSvc";
    private activePopupOwner?;
    private hoverGeneration;
    postConstruct(): void;
    hasDataSource(): boolean;
    onDataSourceChanged(): void;
    getHoverGeneration(): number;
    createNotesFeature(ctrl: CellCtrl): AgNotesFeature | undefined;
    createFullWidthNotesFeature(ctrl: RowCtrl): AgFullWidthRowNotesFeature | undefined;
    getNoteAccess(params: GetNoteParams): INoteAccess | undefined;
    getNote(params: GetNoteParams): Note | undefined;
    replaceActivePopupOwner(owner: INotePopupOwner): INotePopupOwner | undefined;
    clearActivePopupOwner(owner: INotePopupOwner): void;
    private resetActivePopupState;
    showNote(params: GetNoteParams, focusEditor?: boolean): boolean;
    setNote(params: SetNoteParams | InternalSetNoteParams): void;
    refreshNotes(params?: RefreshNotesParams): void;
    private getColumnForFullWidth;
}
