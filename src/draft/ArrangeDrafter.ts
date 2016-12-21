/// <reference path="../core/LayoutFlags" />

namespace mirage.draft {
    import LayoutFlags = mirage.core.LayoutFlags;

    export interface IArrangeDrafter {
        flush();
        prepare(): boolean;
        draft(): boolean;
    }

    export function NewArrangeDrafter(node: core.LayoutNode, rootSize: ISize): IArrangeDrafter {
        var arrangeList: core.LayoutNode[] = [];

        return {
            flush() {
                var cur: core.LayoutNode;
                while ((cur = arrangeList.shift()) != null) {
                    cur.tree.propagateFlagUp(LayoutFlags.arrangeHint);
                }
            },
            prepare(): boolean {
                // `layoutSlot` is used to define the rect a parent grants its child
                // In addition, a draft pass relies on `layoutSlot` to dictate starting arrange constraint
                // Since `node` is typically a root element, we need to ensure `layoutSlot`
                //   is not undefined (first run) and matches the current root size (resizes)
                var last = node.state.lastArrangedSlot;
                if (!node.tree.parent && !Size.isEqual(last, rootSize)) {
                    last.x = last.y = 0;
                    Size.copyTo(rootSize, last);
                    node.invalidateArrange();
                }

                for (var walker = node.walkDeep(); walker.step();) {
                    var cur = walker.current;
                    if (!cur.inputs.visible) {
                        walker.skipBranch();
                        continue;
                    }

                    if ((cur.state.flags & LayoutFlags.arrangeHint) === 0) {
                        walker.skipBranch();
                        continue;
                    }

                    cur.state.flags &= ~LayoutFlags.arrangeHint;
                    if ((cur.state.flags & LayoutFlags.arrange) > 0) {
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