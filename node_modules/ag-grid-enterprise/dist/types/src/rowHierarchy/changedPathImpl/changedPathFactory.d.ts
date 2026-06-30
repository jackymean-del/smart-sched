import type { ChangedPath, IChangedPathFactory, NamedBean, RefreshModelParams } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';
/**
 * Enterprise factory for creating `ChangedPath` instances used during incremental aggregation
 * and change detection. Registered as bean `changedPathFactory`.
 *
 * Community code accesses this via `beans.changedPathFactory?` — when enterprise modules are not
 * loaded, the factory is absent and callers fall back to full (non-incremental) processing.
 */
export declare class ChangedPathFactory extends BeanStub implements NamedBean, IChangedPathFactory {
    beanName: "changedPathFactory";
    /** {@inheritDoc IChangedPathFactory.newPath} */
    newPath(trackCells: boolean): ChangedPath;
    /** {@inheritDoc IChangedPathFactory.ensureRowsPath} */
    ensureRowsPath(params: RefreshModelParams): ChangedPath | undefined;
}
