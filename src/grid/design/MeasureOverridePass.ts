namespace mirage.grid.design {
    export enum MeasureOverridePass {
        autoAuto, //Child in auto row, auto col
        starAuto, //Child in star row, auto col
        autoStar, //Child in auto row, star col
        starAutoAgain, //star row, auto col repeated
        nonStar, //Child in auto/pixel row, auto/pixel col
        remainingStar, //Child in ?
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