namespace mirage.grid.design {
    export interface IGridChildShape {
        col: number;
        row: number;
        colspan: number;
        rowspan: number;

        hasAutoAuto: boolean;
        hasStarAuto: boolean;
        hasAutoStar: boolean;

        init (child: core.LayoutNode, cm: Segment[][], rm: Segment[][]);
        shouldMeasurePass (pass: MeasureOverridePass): boolean;
        calcConstraint (pass: MeasureOverridePass, gridHasAutoStar: boolean, cm: Segment[][], rm: Segment[][]): ISize;
    }

    export function NewGridChildShape(): IGridChildShape {
        let starRow = false;
        let autoRow = false;
        let starCol = false;
        let autoCol = false;

        let col = 0;
        let row = 0;
        let colspan = 1;
        let rowspan = 1;

        let dopass = MeasureOverridePass.autoAuto;

        function getConstraintInitialSize(pass: MeasureOverridePass, gridHasAutoStar: boolean): ISize {
            switch (pass) {
                case MeasureOverridePass.autoAuto:
                    return new Size(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
                case MeasureOverridePass.starAuto:
                    return new Size(
                        Number.POSITIVE_INFINITY,
                        gridHasAutoStar ? Number.POSITIVE_INFINITY : 0
                    );
                case MeasureOverridePass.starAutoAgain:
                    return new Size(Number.POSITIVE_INFINITY, 0);
                case MeasureOverridePass.autoStar:
                    return new Size(0, Number.POSITIVE_INFINITY);
                case MeasureOverridePass.nonStar:
                    return new Size(
                        autoCol ? Number.POSITIVE_INFINITY : 0,
                        autoRow ? Number.POSITIVE_INFINITY : 0
                    );
            }
            return new Size();
        }

        return {
            col: 0,
            row: 0,
            colspan: 1,
            rowspan: 1,
            hasAutoAuto: false,
            hasStarAuto: false,
            hasAutoStar: false,
            init(child: core.LayoutNode, cm: Segment[][], rm: Segment[][]) {
                col = Math.min(Grid.getColumn(child), cm.length - 1);
                if (isNaN(col))
                    col = 0;
                row = Math.min(Grid.getRow(child), rm.length - 1);
                if (isNaN(row))
                    row = 0;
                colspan = Math.min(Grid.getColumnSpan(child), cm.length - col);
                if (isNaN(colspan))
                    colspan = 1;
                rowspan = Math.min(Grid.getRowSpan(child), rm.length - row);
                if (isNaN(rowspan))
                    rowspan = 1;

                this.col = col;
                this.row = row;
                this.colspan = colspan;
                this.rowspan = rowspan;

                starRow = autoRow = starCol = autoCol = false;
                for (let i = row; i < row + rowspan; i++) {
                    starRow = starRow || (rm[i][i].type === GridUnitType.star);
                    autoRow = autoRow || (rm[i][i].type === GridUnitType.auto);
                }
                for (let i = col; i < col + colspan; i++) {
                    starCol = starCol || (cm[i][i].type === GridUnitType.star);
                    autoCol = autoCol || (cm[i][i].type === GridUnitType.auto);
                }

                this.hasAutoAuto = autoRow && autoCol && !starRow && !starCol;
                this.hasStarAuto = starRow && autoCol;
                this.hasAutoStar = autoRow && starCol;

                if (autoRow && autoCol && !starRow && !starCol) {
                    dopass = MeasureOverridePass.autoAuto;
                } else if (starRow && autoCol && !starCol) {
                    dopass = MeasureOverridePass.starAuto;
                } else if (autoRow && starCol && !starRow) {
                    dopass = MeasureOverridePass.autoStar;
                } else if (!(starRow || starCol)) {
                    dopass = MeasureOverridePass.nonStar;
                } else {
                    dopass = MeasureOverridePass.remainingStar;
                }
            },
            shouldMeasurePass(pass: MeasureOverridePass): boolean {
                return dopass === pass
                    || (pass === MeasureOverridePass.starAutoAgain && dopass === MeasureOverridePass.starAuto);
            },
            calcConstraint (pass: MeasureOverridePass, gridHasAutoStar: boolean, cm: Segment[][], rm: Segment[][]): ISize {
                let childSize = getConstraintInitialSize(pass, gridHasAutoStar);
                for (let i = col; i < col + colspan; i++) {
                    childSize.width += cm[i][i].offered;
                }
                for (let i = row; i < row + rowspan; i++) {
                    childSize.height += rm[i][i].offered;
                }
                return childSize;
            },
        };
    }
}