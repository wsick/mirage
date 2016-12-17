namespace mirage.grid {
    export function NewGridMeasureOverride(inputs: IGridInputs, state: IGridState, tree: IPanelTree): core.IMeasureOverride {
        var des = state.design.measure;

        var overrideAutoAuto = design.NewMeasureOverridePass(design.MeasureOverridePass.AutoAuto, des, tree);
        var overrideStarAuto = design.NewMeasureOverridePass(design.MeasureOverridePass.StarAuto, des, tree);
        var overrideAutoStar = design.NewMeasureOverridePass(design.MeasureOverridePass.AutoStar, des, tree);
        var overrideStarAuto2 = design.NewMeasureOverridePass(design.MeasureOverridePass.StarAutoAgain, des, tree);
        var overrideNonStar = design.NewMeasureOverridePass(design.MeasureOverridePass.NonStar, des, tree);
        var overrideRemainingStar = design.NewMeasureOverridePass(design.MeasureOverridePass.RemainingStar, des, tree);

        return function (constraint: ISize): ISize {
            des.init(constraint, inputs.columnDefinitions, inputs.rowDefinitions, tree);
            overrideAutoAuto();
            overrideStarAuto();
            overrideAutoStar();
            overrideStarAuto2();
            overrideNonStar();
            overrideRemainingStar();
            des.finish();
            return des.getDesired();
        };
    }
}