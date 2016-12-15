namespace mirage.grid {
    export function NewGridMeasureOverride(inputs: IGridInputs, state: IGridState, tree: IPanelTree): core.IMeasureOverride {
        return function (constraint: ISize): ISize {
            state.matrix.prepare(inputs.columnDefinitions, inputs.rowDefinitions);
        };
    }
}