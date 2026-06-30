import type { BeanCollection, ChangedPath, ClientSideRowModelStage, GridOptions, NamedBean, _IRowNodePivotStage } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';
export declare class PivotStage extends BeanStub implements NamedBean, _IRowNodePivotStage {
    beanName: "pivotStage";
    readonly step: ClientSideRowModelStage;
    readonly refreshProps: (keyof GridOptions)[];
    private pivotResultCols;
    private pivotColDefSvc;
    wireBeans(beans: BeanCollection): void;
    private uniqueValues;
    private aggregationColumnsHashLastTime;
    private aggregationFuncsHashLastTime;
    private pivotOrderLastTime;
    private groupColumnsHashLastTime;
    private lastTimeFailed;
    private maxUniqueValues;
    /** Returns `true` if the changedPath should be deactivated (e.g. pivot columns changed). */
    execute(changedPath: ChangedPath | undefined, changedProps: Set<keyof GridOptions> | undefined): boolean;
    private executePivotOff;
    private executePivotOn;
    private setUniqueValues;
    private currentUniqueCount;
    private bucketUpRowNodes;
    private bucketRowNode;
    private bucketChildren;
}
