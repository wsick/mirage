/// <reference path="../Thickness" />

namespace mirage.convert {
    /*
     Converters map values from a string to the data type registered to a property name
     */

    export interface IConverter {
        (value: string): any;
    }
    let converters: {[property: string]: IConverter;} = {};

    export function register(property: string, converter: IConverter) {
        converters[property] = converter;
    }

    export function getConverter(property: string): IConverter {
        return converters[property];
    }
}