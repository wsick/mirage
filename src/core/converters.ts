/// <reference path="../convert/converters" />

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

    convert.register("visible", booleanDefaultTrue);
    convert.register("use-layout-rounding", booleanDefaultTrue);
    convert.register("margin", thickness);
    convert.register("width", floatDefaultNaN);
    convert.register("height", floatDefaultNaN);
    convert.register("min-width", float);
    convert.register("min-height", float);
    convert.register("max-width", floatDefaultInfinite);
    convert.register("max-height", floatDefaultInfinite);
    convert.register("horizontal-alignment", enumConverter(HorizontalAlignment));
    convert.register("vertical-alignment", enumConverter(VerticalAlignment));
}