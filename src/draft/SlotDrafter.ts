/// <reference path="../core/LayoutFlags" />

namespace mirage.draft {
    import LayoutFlags = mirage.core.LayoutFlags;

    export interface ISlotDrafter {
        flush();
        prepare(): boolean;
        draft(): boolean;
        notify(): boolean;
    }

    interface ISlotUpdates {
        node: core.LayoutNode;
        oldRect: IRect;
        newRect: IRect;
    }

    export function NewSlotDrafter(node: core.LayoutNode): ISlotDrafter {
        var slotList: core.LayoutNode[] = [];
        var slotUpdates: ISlotUpdates[] = [];

        return {
            flush() {
                var cur: core.LayoutNode;
                while ((cur = slotList.shift()) != null) {
                    cur.tree.propagateFlagUp(LayoutFlags.slotHint);
                }
            },
            prepare(): boolean {
                for (var walker = node.walkDeep(); walker.step();) {
                    var cur = walker.current;
                    if (!cur.inputs.visible) {
                        walker.skipBranch();
                        continue;
                    }

                    if ((cur.state.flags & LayoutFlags.slotHint) === 0) {
                        walker.skipBranch();
                        continue;
                    }

                    cur.state.flags &= ~LayoutFlags.slotHint;
                    if (cur.state.lastArrangedSlot !== undefined) {
                        slotList.push(cur);
                    }
                }
                return slotList.length > 0;
            },
            draft(): boolean {
                var oldRect = new Rect();
                var newRect = new Rect();
                var cur: core.LayoutNode;
                while ((cur = slotList.pop()) != null) {
                    cur.slot(oldRect, newRect);
                    if (!Rect.isEqual(oldRect, newRect)) {
                        slotUpdates.push({
                            node: cur,
                            oldRect: oldRect,
                            newRect: newRect,
                        });
                        oldRect = new Rect();
                        newRect = new Rect();
                    }
                }
                return slotUpdates.length > 0;
            },
            notify(): boolean {
                var update: ISlotUpdates;
                while ((update = slotUpdates.pop()) != null) {
                    update.node.onSlotChanged(update.oldRect, update.newRect);
                }
                return true;
            }
        };
    }
}