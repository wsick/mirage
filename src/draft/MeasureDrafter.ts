/// <reference path="../core/LayoutFlags" />

namespace mirage.draft {
    import LayoutFlags = mirage.core.LayoutFlags;

    export interface IMeasureDrafter {
        prepare(): boolean;
        draft(rootSize: ISize): boolean;
    }

    export function NewMeasureDrafter(node: core.LayoutNode): IMeasureDrafter {
        var measureList: core.LayoutNode[] = [];

        return {
            prepare(): boolean {
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
            draft(rootSize: ISize): boolean {
                var cur: core.LayoutNode;
                while ((cur = measureList.shift()) != null) {
                    cur.doMeasure(rootSize);
                }
                return true;
            },
        };
    }
}