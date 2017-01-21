namespace mirage {
    export interface IRowDefinition {
        height: IGridLength;
        minHeight: number;
        maxHeight: number;
        getActualHeight(): number;

        /// WARNING: This should only be used by engine
        setActualHeight(value: number);
    }

    export function NewRowDefinition(): IRowDefinition;
    export function NewRowDefinition(height: string): IRowDefinition;
    export function NewRowDefinition(heightValue: number, heightType: GridUnitType): IRowDefinition;
    export function NewRowDefinition(height: string, minHeight: number, maxHeight: number): IRowDefinition;
    export function NewRowDefinition(heightValue: number, heightType: GridUnitType, minHeight: number, maxHeight: number): IRowDefinition;
    export function NewRowDefinition(): IRowDefinition {
        var len: IGridLength;
        var min = 0;
        var max = Number.POSITIVE_INFINITY;

        switch (arguments.length) {
            case 1:
                return parseGridRowDef(arguments[0]);
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
            height: len,
            minHeight: min,
            maxHeight: max,
            getActualHeight(): number {
                return actual;
            },
            setActualHeight(value: number) {
                actual = value;
            },
        };
    }

    function parseGridRowDef(raw: string): IRowDefinition {
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
            height: len,
            minHeight: min,
            maxHeight: max,
            getActualHeight(): number {
                return actual;
            },
            setActualHeight(value: number) {
                actual = value;
            },
        };
    }
}