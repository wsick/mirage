/// <reference path="../convert/converters" />

namespace mirage.map {
    /*
     Setters provide a consistent interface to set properties (normal and attached) on a LayoutNode
     Mappers will map a string onto a node using a property's registered converter and setter
     */
    export interface IPropertySetter {
        (node: core.LayoutNode, value: any): void;
    }
    export interface IPropertyMapper {
        (node: core.LayoutNode, value: string): void;
    }
    let setters: {[property: string]: IPropertySetter;} = {};
    let mappers: {[property: string]: IPropertyMapper;} = {};


    export function getSetter(property: string): IPropertySetter {
        let setter = setters[property];
        if (!setter && property.indexOf(".") > -1) {
            setter = (node, value) => node.setAttached(property, value);
        }
        return setter;
    }

    export function getMapper(property: string): IPropertyMapper {
        let mapper = mappers[property];
        if (!mapper && property.indexOf(".") > -1) {
            mapper = (node, value) => node.setAttached(property, value);
        }
        return mapper;
    }

    export function registerNormal(property: string, key: string): void {
        setters[property] = (node, value) => node[key] = value;
        let converter = convert.getConverter(property);
        mappers[property] = (node, value) => node[key] = converter(value);
    }

    export function registerCustom(property: string, setter: IPropertySetter): void {
        setters[property] = setter;
        let converter = convert.getConverter(property);
        mappers[property] = (node, value) => setter(node, converter(value));
    }
}