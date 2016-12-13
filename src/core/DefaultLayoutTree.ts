namespace mirage.core {
    export function DefaultLayoutTree(node: LayoutNode): ILayoutTree {
        return {
            isLayoutContainer: false,
            parent: null,
            applyTemplate(): boolean {
                return true;
            },
            propagateFlagUp(flag: LayoutFlags) {
                for (var cur: LayoutNode = this.parent; !!cur && (cur.state.flags & flag) <= 0; cur = cur.tree.parent) {
                    cur.state.flags |= flag;
                }
            },
            walk(reverse?: boolean): ILayoutTreeWalker {
                return {
                    current: undefined,
                    step(): boolean {
                        return false;
                    },
                }
            },
        };
    }
}