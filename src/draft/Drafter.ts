/// <reference path="../core/LayoutFlags" />

namespace mirage.draft {
    import LayoutFlags = mirage.core.LayoutFlags;

    var MAX_COUNT = 255;

    export interface IDrafter {
        (): boolean;
    }

    export function NewDrafter(node: core.LayoutNode, rootSize: ISize): IDrafter {
        var measure = NewMeasureDrafter(node, rootSize);
        var arrange = NewArrangeDrafter(node);
        var size = NewSizeDrafter(node);

        /// Every pass at runDraft will exclusively run measure, arrange, or size
        /// true should be returned if any updates were made
        function runDraft(): boolean {
            if (!node.inputs.visible)
                return false;

            arrange.flush();
            size.flush();

            var flags = node.state.flags;
            if ((flags & LayoutFlags.MeasureHint) > 0) {
                return measure.prepare()
                    && measure.draft();
            }
            if ((flags & LayoutFlags.ArrangeHint) > 0) {
                return arrange.prepare()
                    && arrange.draft();
            }
            if ((flags & LayoutFlags.SizeHint) > 0) {
                return size.prepare()
                    && size.draft()
                    && size.notify();
            }

            return false;
        }

        return function (): boolean {
            if ((node.state.flags & LayoutFlags.Hints) === 0)
                return false;
            var updated = false;
            for (var count = 0; count < MAX_COUNT; count++) {
                if (!runDraft())
                    break;
                updated = true;
            }
            if (count >= MAX_COUNT) {
                console.error("[mirage] aborting infinite draft");
            }
            return updated;
        };
    }
}