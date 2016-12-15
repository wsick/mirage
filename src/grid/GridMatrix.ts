namespace mirage.grid {
    export interface IGridMatrix {
        prepare(colDefs: IColumnDefinition[], rowDefs: IRowDefinition[]);

        restoreMeasure();
        calcActuals(arrangeSize: ISize, colDefs: IColumnDefinition[], rowDefs: IRowDefinition[]);
        calcChildRect(childRect: Rect, col: number, colspan: number, row: number, rowspan: number);
    }

    function originalToOffered(matrix: Segment[][]) {
        for (var i = 0; i < matrix.length; i++) {
            for (var j = 0; j <= i; j++) {
                matrix[i][j].offered = matrix[i][j].original;
            }
        }
    }

    function calcDesiredToOffered(matrix: Segment[][]): number {
        var total = 0;
        for (var i = 0; i < matrix.length; i++) {
            total += (matrix[i][i].offered = matrix[i][i].desired);
        }
        return total;
    }

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

    function expand(available: number, mat: Segment[][]) {
        for (var i = 0; i < mat.length; i++) {
            var cur = mat[i][i];
            if (cur.type === GridUnitType.star)
                cur.offered = 0;
            else
                available = Math.max(available - cur.offered, 0);
        }
        assignSize(mat, 0, mat.length - 1, available, GridUnitType.star, false);
    }

    function assignSize (mat: Segment[][], start: number, end: number, size: number, unitType: GridUnitType, desiredSize: boolean): number {
        var count = 0;
        var assigned = false;
        var segmentSize = 0;
        for (var i = start; i <= end; i++) {
            var cur = mat[i][i];
            segmentSize = desiredSize ? cur.desired : cur.offered;
            if (segmentSize < cur.max)
                count += (unitType === GridUnitType.star) ? cur.stars : 1;
        }

        do {
            assigned = false;
            var contribution = size / count;
            for (i = start; i <= end; i++) {
                cur = mat[i][i];
                segmentSize = desiredSize ? cur.desired : cur.offered;
                if (!(cur.type === unitType && segmentSize < cur.max))
                    continue;
                var newSize = segmentSize;
                newSize += contribution * (unitType === GridUnitType.star ? cur.stars : 1);
                newSize = Math.min(newSize, cur.max);
                assigned = assigned || (newSize > segmentSize);
                size -= newSize - segmentSize;
                if (desiredSize)
                    cur.desired = newSize;
                else
                    cur.offered = newSize;
            }
        } while (assigned);
        return size;
    }

    export function NewGridMatrix(): IGridMatrix {
        var cm = [];
        var rm = [];
        return {
            prepare(colDefs: IColumnDefinition[], rowDefs: IRowDefinition[]) {
                ensureMatrix(cm, colDefs.length || 1);
                ensureMatrix(rm, rowDefs.length || 1);
                //TODO:
            },

            restoreMeasure() {
                originalToOffered(cm);
                originalToOffered(rm);
            },
            calcActuals(arrangeSize: ISize, colDefs: IColumnDefinition[], rowDefs: IRowDefinition[]) {
                var consumed = new Size(calcDesiredToOffered(cm), calcDesiredToOffered(rm));

                if (consumed.width !== arrangeSize.width) {
                    expand(arrangeSize.width, cm);
                }
                if (consumed.height !== arrangeSize.height) {
                    expand(arrangeSize.height, rm);
                }

                for (var i = 0; i < colDefs.length; i++) {
                    colDefs[i].setActualWidth(cm[i][i].offered);
                }
                for (var i = 0; i < rowDefs.length; i++) {
                    rowDefs[i].setActualHeight(rm[i][i].offered);
                }
            },
            calcChildRect(childRect: Rect, col: number, colspan: number, row: number, rowspan: number) {
                Rect.clear(childRect);

                for (var i = 0; i < col; i++) {
                    childRect.x += cm[i][i].offered;
                }
                for (var i = col; i < col + colspan; i++) {
                    childRect.width += cm[i][i].offered;
                }

                for (var i = 0; i < row; i++) {
                    childRect.y += rm[i][i].offered;
                }
                for (var i = row; i < row + rowspan; i++) {
                    childRect.height += rm[i][i].offered;
                }
            },
        };
    }
}