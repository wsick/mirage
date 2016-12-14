/// <reference path="../core/LayoutFlags" />

namespace mirage.draft {
    import LayoutFlags = mirage.core.LayoutFlags;

    export interface ISizeDrafter {
        flush();
        prepare(): boolean;
        draft(): boolean;
        notify(): boolean;
    }

    interface ISizingUpdate {
        node: core.LayoutNode;
        oldSize: ISize;
        newSize: ISize;
    }

    export function NewSizeDrafter(node: core.LayoutNode): ISizeDrafter {
        var sizingList: core.LayoutNode[] = [];
        var sizingUpdates: ISizingUpdate[] = [];

        return {
            flush() {
                var cur: core.LayoutNode;
                while ((cur = sizingList.shift()) != null) {
                    cur.tree.propagateFlagUp(LayoutFlags.SizeHint);
                }
            },
            prepare(): boolean {
                for (var walker = node.walkDeep(); walker.step();) {
                    var cur = walker.current;
                    if (!cur.inputs.visible) {
                        walker.skipBranch();
                        continue;
                    }

                    if ((cur.state.flags & LayoutFlags.SizeHint) === 0) {
                        walker.skipBranch();
                        continue;
                    }

                    cur.state.flags &= ~LayoutFlags.SizeHint;
                    if (cur.state.lastArranged !== undefined) {
                        sizingList.push(cur);
                    }
                }
                return sizingList.length > 0;
            },
            draft(): boolean {
                var oldSize = new Size();
                var newSize = new Size();
                var cur: core.LayoutNode;
                while ((cur = sizingList.pop()) != null) {
                    cur.sizing(oldSize, newSize);
                    if (!Size.isEqual(oldSize, newSize)) {
                        sizingUpdates.push({
                            node: cur,
                            oldSize: oldSize,
                            newSize: newSize,
                        });
                        oldSize = new Size();
                        newSize = new Size();
                    }
                }
                return sizingUpdates.length > 0;
            },
            notify(): boolean {
                var update: ISizingUpdate;
                while ((update = sizingUpdates.pop()) != null) {
                    update.node.onSizeChanged(update.oldSize, update.newSize);
                }
                return true;
            }
        };
    }
}