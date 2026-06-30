import type { BeanCollection, GetNoteParams, Note, RefreshNotesParams, SetNoteParams } from 'ag-grid-community';
export declare function getNote(beans: BeanCollection, params: GetNoteParams): Note | undefined;
export declare function setNote(beans: BeanCollection, params: SetNoteParams): void;
export declare function refreshNotes(beans: BeanCollection, params?: RefreshNotesParams): void;
