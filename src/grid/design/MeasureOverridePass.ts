namespace mirage.grid.design {
    export enum MeasureOverridePass {
        AutoAuto, //Child in auto row, auto col
        StarAuto, //Child in star row, auto col
        AutoStar, //Child in auto row, star col
        StarAutoAgain, //star row, auto col repeated
        NonStar, //Child in auto/pixel row, auto/pixel col
        RemainingStar, //Child in ?
    }

    export function NewMeasureOverridePass(pass: MeasureOverridePass, des: IGridMeasureDesign, tree: IPanelTree) {
        return function() {
            for (var walker = tree.walk(), i = 0; walker.step(); i++) {
                des.measureChild(pass, i, walker.current);
            }
            des.finishPass();
        };
    }
}