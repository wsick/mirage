namespace mirage {
    export interface IRowDefinition {
        height: IGridLength;
        minHeight: number;
        maxHeight: number;
        getActualHeight(): number;

        /// WARNING: This should only be used by engine
        setActualHeight(value: number);
    }

    export function NewRowDefinitions(defs: string): IRowDefinition[] {
        var rowdefs: IRowDefinition[] = [];
        for (var i = 0, tokens = defs.split(" "); i < tokens.length; i++) {
            let token = tokens[i];
            if (token === " ")
                continue;
            rowdefs.push(NewRowDefinition(token));
        }
        return rowdefs;
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