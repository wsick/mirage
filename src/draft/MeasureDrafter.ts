/// <reference path="../core/LayoutFlags" />

namespace mirage.draft {
    import LayoutFlags = mirage.core.LayoutFlags;

    export interface IMeasureDrafter {
        prepare(): boolean;
        draft(): boolean;
    }

    export function NewMeasureDrafter(node: core.LayoutNode, rootSize: ISize): IMeasureDrafter {
        var measureList: core.LayoutNode[] = [];

        return {
            prepare(): boolean {
                // A draft pass relies on `lastAvailable` to dictate starting measure constraint
                // Since `node` is typically a root element, we need to ensure `lastAvailable`
                //   is not undefined (first run) and matches the current root size (resizes)
                var last = node.state.lastAvailable;
                if (!node.tree.parent && !Size.isEqual(last, rootSize)) {
                    Size.copyTo(rootSize, last);
                    node.invalidateMeasure();
                }

                // Load up measure list
                for (var walker = node.walkDeep(); walker.step();) {
                    var cur = walker.current;
                    if (!cur.inputs.visible) {
                        walker.skipBranch();
                        continue;
                    }

                    if ((cur.state.flags & LayoutFlags.measureHint) === 0) {
                        walker.skipBranch();
                        continue;
                    }

                    cur.state.flags &= ~LayoutFlags.measureHint;
                    if ((cur.state.flags & LayoutFlags.measure) > 0) {
                        measureList.push(cur);
                    }
                }

                return measureList.length > 0;
            },
            draft(): boolean {
                var cur: core.LayoutNode;
                while ((cur = measureList.shift()) != null) {
                    cur.doMeasure();
                }
                return true;
            },
        };
    }
}