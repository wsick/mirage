/// <reference path="../core/LayoutFlags" />

namespace mirage.draft {
    import LayoutFlags = mirage.core.LayoutFlags;

    var MAX_COUNT = 255;

    export interface IDrafter {
        (rootSize: ISize): boolean;
    }

    export interface IDraftUpdater {
        updateSlots(updates: draft.ISlotUpdate[]);
    }

    export function NewDrafter(node: core.LayoutNode, updater: IDraftUpdater): IDrafter {
        var measure = NewMeasureDrafter(node);
        var arrange = NewArrangeDrafter(node);
        var slot = NewSlotDrafter(node);

        /// Every pass at runDraft will exclusively run measure, arrange, or size
        /// true should be returned if any updates were made
        function runDraft(rootSize: ISize): boolean {
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
                    && arrange.draft(rootSize);
            }
            if ((flags & LayoutFlags.slotHint) > 0) {
                return slot.prepare()
                    && slot.draft()
                    && slot.notify(updater);
            }

            return false;
        }

        return function (rootSize: ISize): boolean {
            if ((node.state.flags & LayoutFlags.hints) === 0)
                return false;
            var updated = false;
            var count = 0;
            for (; count < MAX_COUNT; count++) {
                if (!runDraft(rootSize))
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