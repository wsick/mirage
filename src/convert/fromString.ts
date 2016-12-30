/// <reference path="../Thickness" />

namespace mirage.convert {
    export interface IConverter {
        (value: string): any;
    }
    interface IConverterHash {
        [property: string]: IConverter;
    }
    let converters: IConverterHash = {};

    export function fromString(property: string, value: string): any {
        let converter = converters[property];
        if (!converter)
            return value;
        return converter(value);
    }

    export function registerFromString(property: string, converter: IConverter) {
        converters[property] = converter;
    }

    export function getFromStringConverter(property: string): IConverter {
        return converters[property];
    }
}