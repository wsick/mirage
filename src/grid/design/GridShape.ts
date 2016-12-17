namespace mirage.grid.design {
    export interface IGridShape {
        hasAutoAuto: boolean;
        hasStarAuto: boolean;
        hasAutoStar: boolean;
    }

    export function NewGridShape(childShapes: IGridChildShape[]): IGridShape {
        var hasAutoAuto = false;
        var hasStarAuto = false;
        var hasAutoStar = false;

        for (var i = 0; i < childShapes.length; i++) {
            let cs = childShapes[i];
            hasAutoAuto = hasAutoAuto || (cs.autoRow && cs.autoCol && !cs.starRow && !cs.starCol);
            hasStarAuto = hasStarAuto || (cs.starRow && cs.autoCol);
            hasAutoStar = hasAutoStar || (cs.autoRow && cs.starCol);
        }

        return {
            hasAutoAuto: hasAutoAuto,
            hasStarAuto: hasStarAuto,
            hasAutoStar: hasAutoStar,
        };
    }

    export interface IGridChildShape {
        starRow: boolean;
        autoRow: boolean;
        starCol: boolean;
        autoCol: boolean;

        col: number;
        row: number;
        colspan: number;
        rowspan: number;

        init (child: core.LayoutNode, rm: Segment[][], cm: Segment[][]);
        shouldMeasurePass (gridShape: IGridShape, childSize: ISize, pass: MeasureOverridePass): boolean;
        calcConstraint (childSize: ISize, cm: Segment[][], rm: Segment[][]);
    }

    export class GridChildShape implements IGridChildShape {
        starRow: boolean;
        autoRow: boolean;
        starCol: boolean;
        autoCol: boolean;

        col: number;
        row: number;
        colspan: number;
        rowspan: number;

        init(child: core.LayoutNode, cm: Segment[][], rm: Segment[][]) {
            var col = this.col = Math.min(Grid.getColumn(child), cm.length - 1);
            if (isNaN(col))
                this.col = col = 0;
            var row = this.row = Math.min(Grid.getRow(child), rm.length - 1);
            if (isNaN(row))
                this.row = row = 0;
            var colspan = this.colspan = Math.min(Grid.getColumnSpan(child), cm.length - col);
            if (isNaN(colspan))
                this.colspan = colspan = 1;
            var rowspan = this.rowspan = Math.min(Grid.getRowSpan(child), rm.length - row);
            if (isNaN(rowspan))
                this.rowspan = rowspan = 1;

            this.starRow = this.autoRow = this.starCol = this.autoCol = false;

            for (var i = row; i < row + rowspan; i++) {
                this.starRow = this.starRow || (rm[i][i].type === GridUnitType.star);
                this.autoRow = this.autoRow || (rm[i][i].type === GridUnitType.auto);
            }
            for (var i = col; i < col + colspan; i++) {
                this.starCol = this.starCol || (cm[i][i].type === GridUnitType.star);
                this.autoCol = this.autoCol || (cm[i][i].type === GridUnitType.auto);
            }
        }

        shouldMeasurePass(gridShape: IGridShape, childSize: ISize, pass: MeasureOverridePass): boolean {
            childSize.width = childSize.height = 0;

            if (this.autoRow && this.autoCol && !this.starRow && !this.starCol) {
                if (pass !== MeasureOverridePass.AutoAuto)
                    return false;
                childSize.width = Number.POSITIVE_INFINITY;
                childSize.height = Number.POSITIVE_INFINITY;
                return true;
            }

            if (this.starRow && this.autoCol && !this.starCol) {
                if (pass !== MeasureOverridePass.StarAuto && pass !== MeasureOverridePass.StarAutoAgain)
                    return false;
                if (pass === MeasureOverridePass.AutoAuto && gridShape.hasAutoStar)
                    childSize.height = Number.POSITIVE_INFINITY;
                childSize.width = Number.POSITIVE_INFINITY;
                return true;
            }

            if (this.autoRow && this.starCol && !this.starRow) {
                if (pass !== MeasureOverridePass.AutoStar)
                    return false;
                childSize.height = Number.POSITIVE_INFINITY;
                return true;
            }

            if ((this.autoRow || this.autoCol) && !(this.starRow || this.starCol)) {
                if (pass !== MeasureOverridePass.NonStar)
                    return false;
                if (this.autoRow)
                    childSize.height = Number.POSITIVE_INFINITY;
                if (this.autoCol)
                    childSize.width = Number.POSITIVE_INFINITY;
                return true;
            }

            if (!(this.starRow || this.starCol))
                return pass === MeasureOverridePass.NonStar;

            return pass === MeasureOverridePass.RemainingStar;
        }

        calcConstraint(childSize: ISize, cm: Segment[][], rm: Segment[][]) {
            for (var i = this.row; i < this.row + this.rowspan; i++) {
                childSize.height += rm[i][i].offered;
            }
            for (var i = this.col; i < this.col + this.colspan; i++) {
                childSize.width += cm[i][i].offered;
            }
        }
    }
}