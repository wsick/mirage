namespace mirage {
    export enum GridUnitType {
        auto = 0,
        pixel = 1,
        star = 2,
    }

    export interface IGridLength {
        value: number;
        type: GridUnitType;
    }

    export function parseGridLength(s: string): IGridLength {
        var auto = {value: 0, type: GridUnitType.auto};
        if (s === "auto") {
            return auto;
        }
        if (s[s.length - 1] === "*") {
            if (s.length === 1)
                return {value: 1, type: GridUnitType.star};
            return {
                value: parseInt(s.substr(0, s.length - 1)),
                type: GridUnitType.star,
            };
        }
        return {
            value: parseInt(s),
            type: GridUnitType.pixel,
        };
    }
}