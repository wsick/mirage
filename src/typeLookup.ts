namespace mirage {
    interface ITypeCreatorHash {
        [type: string]: ITypeNodeCreator;
    }
    var typeCreators: ITypeCreatorHash = {};

    export function createNodeByType(type: string): core.LayoutNode {
        var creator = typeCreators[type];
        if (!creator)
            return new core.LayoutNode();
        return new creator();
    }

    export interface ITypeNodeCreator {
        new (): core.LayoutNode;
    }
    export function registerNodeType(type: string, creator: ITypeNodeCreator) {
        if (typeCreators[type]) {
            console.warn("[mirage] Overriding type registration for " + type);
        }
        typeCreators[type] = creator;
    }
}