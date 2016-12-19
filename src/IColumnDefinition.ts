namespace mirage {
    export interface IColumnDefinition {
        width: IGridLength;
        minWidth: number;
        maxWidth: number;
        getActualWidth(): number;

        /// WARNING: This should only be used by engine
        setActualWidth(value: number);
    }

    export function NewColumnDefinition(): IColumnDefinition;
    export function NewColumnDefinition(width: string): IColumnDefinition;
    export function NewColumnDefinition(widthValue: number, widthType: GridUnitType): IColumnDefinition;
    export function NewColumnDefinition(width: string, minWidth: number, maxWidth: number): IColumnDefinition;
    export function NewColumnDefinition(widthValue: number, widthType: GridUnitType, minWidth: number, maxWidth: number): IColumnDefinition;
    export function NewColumnDefinition(): IColumnDefinition {
        var len: IGridLength;
        var min = 0;
        var max = Number.POSITIVE_INFINITY;

        switch (arguments.length) {
            case 1:
                len = parseGridLength(arguments[0]);
                break;
            case 2:
                len = {
                    value: arguments[0],
                    type: arguments[1],
                };
                break;
            case 3:
                len = parseGridLength(arguments[0]);
                min = arguments[1];
                max = arguments[2];
                break;
            case 4:
                len = {
                    value: arguments[0],
                    type: arguments[1],
                };
                min = arguments[2];
                max = arguments[3];
                break;
            default:
                len = {
                    value: 0,
                    type: GridUnitType.auto,
                };
                break;
        }

        var actual = NaN;
        return {
            width: len,
            minWidth: min,
            maxWidth: max,
            getActualWidth(): number {
                return actual;
            },
            setActualWidth(value: number) {
                actual = value;
            },
        };
    }
}