/// <reference path="../core/LayoutFlags" />

namespace mirage.draft {
    import LayoutFlags = mirage.core.LayoutFlags;

    var MAX_COUNT = 255;

    export interface IDrafter {
        (): boolean;
    }

    export function NewDrafter(node: core.LayoutNode, rootSize: ISize): IDrafter {
        var measure = NewMeasureDrafter(node, rootSize);
        var arrange = NewArrangeDrafter(node, rootSize);
        var slot = NewSlotDrafter(node);

        /// Every pass at runDraft will exclusively run measure, arrange, or size
        /// true should be returned if any updates were made
        function runDraft(): boolean {
            if (!node.inputs.visible)
                return false;

            arrange.flush();
            slot.flush();

            var flags = node.state.flags;
            if ((flags & LayoutFlags.measureHint) > 0) {
                return measure.prepare()
                    && measure.draft();
            }
            if ((flags & LayoutFlags.arrangeHint) > 0) {
                return arrange.prepare()
                    && arrange.draft();
            }
            if ((flags & LayoutFlags.slotHint) > 0) {
                return slot.prepare()
                    && slot.draft()
                    && slot.notify();
            }

            return false;
        }

        return function (): boolean {
            if ((node.state.flags & LayoutFlags.hints) === 0)
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