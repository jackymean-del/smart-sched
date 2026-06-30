import type { GetFormulaParams, IFormulaDataService, NamedBean, SetFormulaParams } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';
export declare class FormulaDataService extends BeanStub implements IFormulaDataService, NamedBean {
    readonly beanName: "formulaDataSvc";
    private dataSource?;
    private hasSource;
    postConstruct(): void;
    hasDataSource(): boolean;
    getFormula(params: GetFormulaParams): string | undefined;
    setFormula(params: SetFormulaParams): void;
    private setDataSource;
    private createInitParams;
    destroy(): void;
}
