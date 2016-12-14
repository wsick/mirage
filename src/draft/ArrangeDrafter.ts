/// <reference path="../core/LayoutFlags" />

namespace mirage.draft {
    import LayoutFlags = mirage.core.LayoutFlags;

    export interface IArrangeDrafter {
        flush();
        prepare(): boolean;
        draft(): boolean;
    }

    export function NewArrangeDrafter(node: core.LayoutNode): IArrangeDrafter {
        var arrangeList: core.LayoutNode[] = [];

        return {
            flush() {
                var cur: core.LayoutNode;
                while ((cur = arrangeList.shift()) != null) {
                    cur.tree.propagateFlagUp(LayoutFlags.ArrangeHint);
                }
            },
            prepare(): boolean {
                for (var walker = node.walkDeep(); walker.step();) {
                    var cur = walker.current;
                    if (!cur.inputs.visible) {
                        walker.skipBranch();
                        continue;
                    }

                    if ((cur.state.flags & LayoutFlags.ArrangeHint) === 0) {
                        walker.skipBranch();
                        continue;
                    }

                    cur.state.flags &= ~LayoutFlags.ArrangeHint;
                    if ((cur.state.flags & LayoutFlags.Arrange) > 0) {
                        arrangeList.push(cur);
                    }
                }
                return arrangeList.length > 0;
            },
            draft(): boolean {
                var cur: core.LayoutNode;
                while ((cur = arrangeList.shift()) != null) {
                    cur.doArrange();
                }
                return true;
            },
        }
    }
}