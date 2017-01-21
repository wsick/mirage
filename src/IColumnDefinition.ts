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
                return parseGridColDef(arguments[0]);
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
                    value: 1,
                    type: GridUnitType.star,
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

    function parseGridColDef(raw: string): IColumnDefinition {
        let len: IGridLength;
        let min = 0;
        let max = Number.POSITIVE_INFINITY;

        if (raw[0] === "(" && raw[raw.length - 1] === ")") {
            let tokens = raw.substr(1, raw.length - 2).split(" ");
            len = parseGridLength(tokens[0]);
            len.value = len.value || 0; // coerce 0, NaN => 0
            min = parseInt(tokens[1]) || 0; // coerce 0, NaN => 0
            max = parseInt(tokens[2]);
            if (isNaN(max)) {
                // we want to preserve 0
                // and coerce NaN => infin
                max = Number.POSITIVE_INFINITY;
            }
        } else {
            len = parseGridLength(raw);
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