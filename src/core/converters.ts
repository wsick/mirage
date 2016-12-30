/// <reference path="../convert/fromString" />

namespace mirage.core {
    function booleanDefaultTrue(value: string): boolean {
        return value !== "0"
            && value !== "false";
    }

    function float(value: string): number {
        if (!value)
            return 0;
        return parseFloat(value) || 0;
    }

    function floatDefaultNaN(value: string): number {
        if (!value)
            return NaN;
        return parseFloat(value);
    }

    function floatDefaultInfinite(value: string): number {
        if (!value)
            return Number.POSITIVE_INFINITY;
        let val = parseFloat(value);
        if (isNaN(val))
            return Number.POSITIVE_INFINITY;
        return val;
    }

    function thickness(value: string): Thickness {
        let tokens = splitCommaList(value);
        if (tokens.length === 1) {
            let uniform = parseFloat(tokens[0]);
            return new Thickness(uniform, uniform, uniform, uniform);
        } else if (tokens.length === 2) {
            let x = parseFloat(tokens[0]);
            let y = parseFloat(tokens[1]);
            return new Thickness(x, y, x, y);
        } else if (tokens.length === 4) {
            return new Thickness(
                parseFloat(tokens[0]),
                parseFloat(tokens[1]),
                parseFloat(tokens[2]),
                parseFloat(tokens[3])
            );
        } else {
            console.warn("[mirage] Invalid thickness value", value);
        }
    }

    export function enumConverter(src: any): (value: string) => any {
        return (value: string): any => {
            if (!value)
                return 0;
            return src[value] || 0;
        };
    }

    function splitCommaList(str: string): string[] {
        var tokens: string[] = [];
        for (var i = 0, arr = str.split(' ').join(',').split(','); i < arr.length; i++) {
            var cur = arr[i];
            if (cur)
                tokens.push(cur);
        }
        return tokens;
    }

    convert.registerFromString("visible", booleanDefaultTrue);
    convert.registerFromString("use-layout-rounding", booleanDefaultTrue);
    convert.registerFromString("margin", thickness);
    convert.registerFromString("width", floatDefaultNaN);
    convert.registerFromString("height", floatDefaultNaN);
    convert.registerFromString("min-width", float);
    convert.registerFromString("min-height", float);
    convert.registerFromString("max-width", floatDefaultInfinite);
    convert.registerFromString("max-height", floatDefaultInfinite);
    convert.registerFromString("horizontal-alignment", enumConverter(HorizontalAlignment));
    convert.registerFromString("vertical-alignment", enumConverter(VerticalAlignment));
}