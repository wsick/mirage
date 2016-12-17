namespace mirage.grid.design.helpers {
    export function expand(available: number, mat: Segment[][]) {
        for (var i = 0; i < mat.length; i++) {
            var cur = mat[i][i];
            if (cur.type === GridUnitType.star)
                cur.offered = 0;
            else
                available = Math.max(available - cur.offered, 0);
        }
        assignSize(mat, 0, mat.length - 1, available, GridUnitType.star, false);

        //TODO: setActualWidth, setActualHeight if star?
    }

    export function assignSize(mat: Segment[][], start: number, end: number, size: number, unitType: GridUnitType, desiredSize: boolean): number {
        var count = 0;
        var assigned = false;
        var segmentSize = 0;
        for (var i = start; i <= end; i++) {
            let cur = mat[i][i];
            segmentSize = desiredSize ? cur.desired : cur.offered;
            if (segmentSize < cur.max)
                count += (unitType === GridUnitType.star) ? cur.stars : 1;
        }

        do {
            assigned = false;
            let contribution = size / count;
            for (var i = start; i <= end; i++) {
                let cur = mat[i][i];
                segmentSize = desiredSize ? cur.desired : cur.offered;
                if (!(cur.type === unitType && segmentSize < cur.max))
                    continue;
                let newSize = segmentSize;
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

    export function calcDesiredToOffered(matrix: Segment[][]): number {
        var total = 0;
        for (var i = 0; i < matrix.length; i++) {
            total += (matrix[i][i].offered = matrix[i][i].desired);
        }
        return total;
    }
}