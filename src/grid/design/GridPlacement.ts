namespace mirage.grid.design {
    export interface IGridPlacement {
        init();
        add(isRow: boolean, start: number, span: number, size: number);
        allocate(allocFunc: () => void);
    }

    interface IGridPlacementCell {
        matrix: Segment[][];
        start: number;
        end: number;
        size: number;
    }

    export function NewGridPlacement(cm: Segment[][], rm: Segment[][]): IGridPlacement {
        var unicells: IGridPlacementCell[] = [];
        var multicells: IGridPlacementCell[] = [];

        return {
            init() {
                unicells.length = 0;
                multicells.length = 0;
            },
            add(isRow: boolean, start: number, span: number, size: number) {
                var item: IGridPlacementCell = {
                    matrix: isRow ? rm : cm,
                    start: start,
                    end: start + span - 1,
                    size: size,
                };
                if (item.start === item.end) {
                    unicells.unshift(item);
                } else {
                    multicells.push(item);
                }
            },
            allocate(allocFunc: () => void) {
                var cell: IGridPlacementCell;
                while ((cell = unicells.pop()) != null) {
                    var i = cell.end;
                    var j = cell.start;
                    cell.matrix[i][j].desired = Math.max(cell.matrix[i][j].desired, cell.size);
                    allocFunc();
                }
                while ((cell = multicells.pop()) != null) {
                    var i = cell.end;
                    var j = cell.start;
                    cell.matrix[i][j].desired = Math.max(cell.matrix[i][j].desired, cell.size);
                    allocFunc();
                }
            },
        }
    }
}