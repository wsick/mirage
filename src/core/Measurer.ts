namespace mirage.core {
    export interface IMeasurer {
        (availableSize: ISize): boolean;
    }
    export interface IMeasureOverride {
        (coreSize: ISize): Size;
    }

    export function NewMeasurer(inputs: ILayoutNodeInputs, state: ILayoutNodeState, tree: ILayoutTree, override: IMeasureOverride): IMeasurer {
        return function (availableSize: ISize): boolean {
            // Validate
            if (isNaN(availableSize.width) || isNaN(availableSize.height)) {
                console.warn("[mirage] cannot call measure using a size with NaN values.");
                return false;
            }
            if (inputs.visible !== true) {
                return false;
            }

            // Check need to measure
            var domeasure = (state.flags & LayoutFlags.measure) > 0;
            var last = state.lastAvailable;
            domeasure = domeasure || (Size.isUndef(last) || !Size.isEqual(last, availableSize));
            Size.copyTo(availableSize, last);

            // Apply Template
            tree.applyTemplate();

            if (!domeasure)
                return false;

            // Invalidate downstream
            state.flags |= (LayoutFlags.arrange | LayoutFlags.arrangeHint);

            // Prepare for override
            var framedSize = new Size(availableSize.width, availableSize.height);
            Thickness.shrinkSize(inputs.margin, framedSize);
            coerceSize(framedSize, inputs);

            // Do override
            var desired = override(framedSize);

            // Complete override
            state.flags &= ~LayoutFlags.measure;
            Size.copyTo(desired, state.hiddenDesire);

            // Finish desired
            coerceSize(desired, inputs);
            Thickness.growSize(inputs.margin, desired);

            desired.width = Math.min(desired.width, availableSize.width);
            desired.height = Math.min(desired.height, availableSize.height);
            if (inputs.useLayoutRounding) {
                Size.round(desired);
            }
            Size.copyTo(desired, state.desiredSize);

            return true;
        };
    }
}