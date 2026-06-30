import type { ZipFile } from './zipContainer';
interface ZipFileHeader {
    localFileHeader: Uint8Array;
    centralDirectoryHeader: Uint8Array;
}
export interface ProcessedZipFile extends ZipFileHeader {
    content: Uint8Array;
    isCompressed: boolean;
}
export interface PreprocessedZipFile {
    rawContent: Uint8Array;
    rawSize: number;
    deflatedContent?: Uint8Array;
    deflatedSize?: number;
    isCompressed: boolean;
}
export declare const getHeaders: (currentFile: ZipFile, isCompressed: boolean, offset: number, rawSize: number, rawContent: string | Uint8Array, deflatedSize: number | undefined) => ZipFileHeader;
export declare const preprocessFileForZip: (currentFile: ZipFile) => Promise<PreprocessedZipFile>;
export declare const getHeaderAndContent: (currentFile: ZipFile, offset: number) => ProcessedZipFile;
export declare const buildCentralDirectoryEnd: (tLen: number, cLen: number, lLen: number) => Uint8Array;
export {};
