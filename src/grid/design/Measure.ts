namespace mirage.grid.design {
    export interface IGridMeasureDesign {
        init(constraint: ISize, coldefs: IColumnDefinition[], rowdefs: IRowDefinition[], tree: IPanelTree);
        measureChild(pass: MeasureOverridePass, index: number, child: core.LayoutNode);
        finishPass();
        finish();
        getDesired(): ISize;
    }

    export function NewGridMeasureDesign(cm: Segment[][], rm: Segment[][]): IGridMeasureDesign {
        let gridHasAutoStar = false;
        var childShapes: IGridChildShape[] = [];
        var placement = NewGridPlacement(cm, rm);

        return {
            init(constraint: ISize, coldefs: IColumnDefinition[], rowdefs: IRowDefinition[], tree: IPanelTree) {
                ensureMatrix(cm, !coldefs ? 1 : coldefs.length || 1);
                ensureMatrix(rm, !rowdefs ? 1 : rowdefs.length || 1);
                prepareCols(cm, coldefs);
                prepareRows(rm, rowdefs);

                var i = 0;
                for (var walker = tree.walk(); walker.step(); i++) {
                    var childShape: IGridChildShape;
                    if (i < childShapes.length) {
                        childShapes[i] = childShapes[i] || NewGridChildShape();
                    } else {
                        childShapes.push(childShape = NewGridChildShape());
                    }
                    childShape.init(walker.current, cm, rm);
                }
                if (i < childShapes.length)
                    childShapes.slice(i, childShapes.length - i);
                gridHasAutoStar = doesGridHaveAutoStar(childShapes);

                placement.init();

                if (tree.children.length > 0) {
                    helpers.expand(constraint.width, cm);
                    helpers.expand(constraint.height, rm);
                }

            },
            measureChild(pass: MeasureOverridePass, index: number, child: core.LayoutNode) {
                var childShape = childShapes[index];
                if (!childShape || !childShape.shouldMeasurePass(pass))
                    return;
                child.measure(childShape.calcConstraint(pass, gridHasAutoStar, cm, rm));

                var desired = child.state.desiredSize;
                if (pass !== MeasureOverridePass.starAuto)
                    placement.add(true, childShape.row, childShape.rowspan, desired.height);
                placement.add(false, childShape.col, childShape.colspan, desired.width);
            },
            finishPass() {
                placement.allocate(allocateDesiredSizeFunc(cm, rm));
            },
            finish() {
                for (var i = 0; i < cm.length; i++) {
                    for (var j = 0; j <= i; j++) {
                        cm[i][j].original = cm[i][j].offered;
                    }
                }
                for (var i = 0; i < rm.length; i++) {
                    for (var j = 0; j <= i; j++) {
                        rm[i][j].original = rm[i][j].offered;
                    }
                }
            },
            getDesired(): ISize {
                var desired = new Size();
                for (var i = 0; i < cm.length; i++) {
                    desired.width += cm[i][i].desired;
                }
                for (var i = 0; i < rm.length; i++) {
                    desired.height += rm[i][i].desired;
                }
                return desired;
            },
        }
    }

    var DEFAULT_GRID_LEN: IGridLength = {
        value: 1.0,
        type: GridUnitType.star
    };

    function ensureMatrix(matrix: Segment[][], defCount: number) {
        if (matrix.length > defCount)
            matrix.splice(defCount, matrix.length - defCount);
        for (var i = 0; i < defCount; i++) {
            if (matrix.length <= i)
                matrix.push([]);
            var mrow = matrix[i];
            if (mrow.length > (i + 1))
                mrow.splice(i, mrow.length - i - 1);
            for (var ii = 0; ii <= i; ii++) {
                if (mrow.length <= ii)
                    mrow.push(new Segment());
                else
                    Segment.init(mrow[ii]);
            }
        }
    }

    function prepareCols(cm: Segment[][], coldefs: IColumnDefinition[]) {
        if (!coldefs || coldefs.length === 0) {
            var mcell = cm[0][0];
            mcell.type = GridUnitType.star;
            mcell.stars = 1.0;
            return;
        }

        for (var i = 0; i < coldefs.length; i++) {
            var colDef = coldefs[i];
            var width = colDef.width || DEFAULT_GRID_LEN;
            colDef.setActualWidth(Number.POSITIVE_INFINITY);

            var cell = Segment.init(cm[i][i], 0.0, colDef.minWidth, colDef.maxWidth, width.type);
            if (width.type === GridUnitType.pixel) {
                cell.desired = cell.offered = cell.clamp(width.value);
                colDef.setActualWidth(cell.desired);
            } else if (width.type === GridUnitType.star) {
                cell.stars = width.value;
            } else if (width.type === GridUnitType.auto) {
                cell.desired = cell.offered = cell.clamp(0);
            }
        }
    }

    function prepareRows(rm: Segment[][], rowdefs: IRowDefinition[]) {
        if (!rowdefs || rowdefs.length === 0) {
            var mcell = rm[0][0];
            mcell.type = GridUnitType.star;
            mcell.stars = 1.0;
            return;
        }

        for (var i = 0; i < rowdefs.length; i++) {
            var rowDef = rowdefs[i];
            var height = rowDef.height || DEFAULT_GRID_LEN;
            rowDef.setActualHeight(Number.POSITIVE_INFINITY);

            var cell = Segment.init(rm[i][i], 0.0, rowDef.minHeight, rowDef.maxHeight, height.type);
            if (height.type === GridUnitType.pixel) {
                cell.desired = cell.offered = cell.clamp(height.value);
                rowDef.setActualHeight(cell.desired);
            } else if (height.type === GridUnitType.star) {
                cell.stars = height.value;
            } else if (height.type === GridUnitType.auto) {
                cell.desired = cell.offered = cell.clamp(0);
            }
        }
    }

    function allocateDesiredSizeFunc(cm: Segment[][], rm: Segment[][]): () => void {
        function hasStarInSpan(mat: Segment[][], start: number, end: number): boolean {
            var spansStar = false;
            for (var i = start; i >= end; i--) {
                spansStar = spansStar || mat[i][i].type === GridUnitType.star;
            }
            return spansStar;
        }

        function calcDesired(mat: Segment[][], start: number, end: number): number {
            var total = 0;
            for (var i = start; i >= end; i--) {
                total += mat[i][i].desired;
            }
            return total;
        }

        function allocSegments(mat: Segment[][]) {
            var count = mat.length;
            for (var start = count - 1; start >= 0; start--) {
                for (var end = start; end >= 0; end--) {
                    let hasStar = hasStarInSpan(mat, start, end);
                    let cur = mat[start][end].desired;
                    let total = calcDesired(mat, start, end);
                    let additional = cur - total;
                    if (additional > 0) {
                        if (hasStar) {
                            helpers.assignSize(mat, end, start, additional, GridUnitType.star, true);
                        } else {
                            helpers.assignSize(mat, end, start, additional, GridUnitType.pixel, true);
                            helpers.assignSize(mat, end, start, additional, GridUnitType.auto, true);
                        }
                    }
                }
            }
        }

        return function () {
            // Allocate heights then widths
            allocSegments(rm);
            allocSegments(cm);

            helpers.calcDesiredToOffered(rm);
            helpers.calcDesiredToOffered(cm);
        };
    }

    function doesGridHaveAutoStar(childShapes: IGridChildShape[]): boolean {
        for (let i = 0; i < childShapes.length; i++) {
            if (childShapes[i].hasAutoStar)
                return true;
        }
        return false;
    }
}