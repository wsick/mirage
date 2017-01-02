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
}