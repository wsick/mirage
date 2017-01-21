namespace mirage {
    export function NewRowDefinitions(defs: string): IRowDefinition[] {
        let rowdefs: IRowDefinition[] = [];
        for (let walker = walkDefinitions(defs); walker.walk();) {
            rowdefs.push(NewRowDefinition(walker.current));
        }
        return rowdefs;
    }

    export function NewColumnDefinitions(defs: string): IColumnDefinition[] {
        let coldefs: IColumnDefinition[] = [];
        for (let walker = walkDefinitions(defs); walker.walk();) {
            coldefs.push(NewColumnDefinition(walker.current));
        }
        return coldefs;
    }

    interface IDefinitionWalker {
        current: string;
        walk(): boolean;
    }
    function walkDefinitions(defs: string): IDefinitionWalker {
        let index = 0;
        var d = {
            current: "",
            walk(): boolean {
                if (defs[index] === "(") {
                    let next = defs.indexOf(")", index);
                    d.current = (next > -1)
                        ? defs.substr(index, next - index + 1)
                        : defs.substr(index);
                } else {
                    let next = defs.indexOf(" ", index);
                    d.current = (next > -1)
                        ? defs.substr(index, next - index)
                        : defs.substr(index);
                }
                index += d.current.length + 1;
                return d.current && d.current != " ";
            },
        };
        return d;
    }
}
