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
}