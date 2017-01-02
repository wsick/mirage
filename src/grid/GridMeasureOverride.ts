namespace mirage.grid {
    export function NewGridMeasureOverride(inputs: IGridInputs, state: IGridState, tree: IPanelTree): core.IMeasureOverride {
        var des = state.design.measure;

        var overrideAutoAuto = design.NewMeasureOverridePass(design.MeasureOverridePass.autoAuto, des, tree);
        var overrideStarAuto = design.NewMeasureOverridePass(design.MeasureOverridePass.starAuto, des, tree);
        var overrideAutoStar = design.NewMeasureOverridePass(design.MeasureOverridePass.autoStar, des, tree);
        var overrideStarAuto2 = design.NewMeasureOverridePass(design.MeasureOverridePass.starAutoAgain, des, tree);
        var overrideNonStar = design.NewMeasureOverridePass(design.MeasureOverridePass.nonStar, des, tree);
        var overrideRemainingStar = design.NewMeasureOverridePass(design.MeasureOverridePass.remainingStar, des, tree);

        return function (constraint: ISize): ISize {
            des.init(inputs.columnDefinitions, inputs.rowDefinitions, tree);
            overrideAutoAuto(constraint);
            overrideStarAuto(constraint);
            overrideAutoStar(constraint);
            overrideStarAuto2(constraint);
            overrideNonStar(constraint);
            overrideRemainingStar(constraint);
            des.finish();
            return des.getDesired();
        };
    }
}