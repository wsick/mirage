namespace mirage.map {
    /*
     Mappers provide a consistent interface to set properties (normal and attached) on a LayoutNode
     */
    export interface IPropertyMapper {
        (node: core.LayoutNode, value: any): void;
    }
    interface IPropertyMapperHash {
        [property: string]: IPropertyMapper;
    }
    let setters: IPropertyMapperHash = {};

    export function getMapper(property: string): IPropertyMapper {
        return setters[property];
    }

    export function registerNormal(property: string, key: string): void {
        setters[property] = (node, value) => node[key] = value;
    }

    export function registerCustom(property: string, mapper: IPropertyMapper): void {
        setters[property] = mapper;
    }
}