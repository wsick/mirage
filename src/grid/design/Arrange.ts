namespace mirage.grid.design {
    export interface IGridArrangeDesign {
        init(arrangeSize: ISize, coldefs: IColumnDefinition[], rowdefs: IRowDefinition[]);
        calcChildRect(childRect: IRect, child: core.LayoutNode);
    }

    export function NewGridArrangeDesign(cm: Segment[][], rm: Segment[][]): IGridArrangeDesign {
        return {
            init(arrangeSize: ISize, coldefs: IColumnDefinition[], rowdefs: IRowDefinition[]) {
                originalToOffered(cm);
                originalToOffered(rm);

                var consumed = new Size(helpers.calcDesiredToOffered(cm), helpers.calcDesiredToOffered(rm));

                if (consumed.width !== arrangeSize.width) {
                    helpers.expand(arrangeSize.width, cm);
                }
                if (consumed.height !== arrangeSize.height) {
                    helpers.expand(arrangeSize.height, rm);
                }

                if (!!coldefs) {
                    for (var i = 0; i < coldefs.length; i++) {
                        coldefs[i].setActualWidth(cm[i][i].offered);
                    }
                }
                if (!!rowdefs) {
                    for (var i = 0; i < rowdefs.length; i++) {
                        rowdefs[i].setActualHeight(rm[i][i].offered);
                    }
                }
            },
            calcChildRect(childRect: IRect, child: core.LayoutNode) {
                Rect.clear(childRect);

                var col = Grid.getColumn(child) || 0; //coerce NaN, undefined, null, 0 => 0
                col = Math.min(col, cm.length - 1);

                var colspan = Grid.getColumnSpan(child);
                if (colspan !== 0)
                    colspan = colspan || 1; //coerce NaN, undefined, null => 1
                colspan = Math.min(colspan, cm.length - col);

                var row = Grid.getRow(child) || 0; //coerce NaN, undefined, null, 0 => 0
                row = Math.min(row, rm.length - 1);

                var rowspan = Grid.getRowSpan(child);
                if (rowspan !== 0)
                    rowspan = rowspan || 1; //coerce NaN, undefined, null => 1
                rowspan = Math.min(rowspan, rm.length - row);

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

    function originalToOffered(matrix: Segment[][]) {
        for (var i = 0; i < matrix.length; i++) {
            for (var j = 0; j <= i; j++) {
                matrix[i][j].offered = matrix[i][j].original;
            }
        }
    }
}