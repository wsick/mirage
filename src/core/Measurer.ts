namespace mirage.core {
    export interface IMeasureInputs {
        visible: boolean;
        margin: Thickness;
        width: number;
        height: number;
        minWidth: number;
        minHeight: number;
        maxWidth: number;
        maxHeight: number;
        useLayoutRounding: boolean;
    }

    export interface IMeasureState {
        flags: LayoutFlags;
        previousAvailable: ISize;
        desiredSize: ISize;
        hiddenDesire: ISize;
    }

    export interface IMeasureBinder {
        (): boolean;
    }

    export function NewMeasureBinder(state: IMeasureState, tree: ILayoutTree, measurer: IMeasurer): IMeasureBinder {
        return function(): boolean {
            var last = state.previousAvailable;

            if (Size.isUndef(last) && !tree.parent && tree.isLayoutContainer)
                last.width = last.height = Number.POSITIVE_INFINITY;

            var success = false;
            if (!Size.isUndef(last)) {
                var old = new Size();
                Size.copyTo(state.desiredSize, old);
                success = measurer(last);
                if (Size.isEqual(old, state.desiredSize))
                    return success;
            }

            if (tree.parent)
                tree.parent.invalidateMeasure();

            state.flags &= ~LayoutFlags.Measure;
            return success;
        };
    }

    export interface IMeasurer {
        (availableSize: ISize): boolean;
    }
    export interface IMeasureOverride {
        (coreSize: ISize): Size;
    }

    export function NOOP_MEASURE_OVERRIDE(framedSize: ISize): ISize {
        return new Size();
    }

    export function DefaultMeasurer(inputs: IMeasureInputs, state: IMeasureState, tree: ILayoutTree): IMeasurer {
        return NewMeasurer(inputs, state, tree, NOOP_MEASURE_OVERRIDE);
    }

    export function NewMeasurer(inputs: IMeasureInputs, state: IMeasureState, tree: ILayoutTree, override: IMeasureOverride): IMeasurer {
        return function (availableSize: ISize): boolean {
            // Validate
            if (isNaN(availableSize.width) || isNaN(availableSize.height)) {
                console.warn("[mirage] cannot call measure using a size with NaN values.");
                return false;
            }
            if (inputs.visible !== true) {
                return false;
            }

            // Apply Template
            tree.applyTemplate();

            // Check need to measure
            if ((state.flags & LayoutFlags.Measure) <= 0) {
                return false;
            }
            var pc = state.previousAvailable;
            if (!Size.isUndef(pc) && pc.width === availableSize.width && pc.height === availableSize.height) {
                return false;
            }

            // Invalidate downstream
            state.flags |= (LayoutFlags.Arrange | LayoutFlags.ArrangeHint);

            // Prepare for override
            var framedSize = new Size(availableSize.width, availableSize.height);
            Thickness.shrinkSize(inputs.margin, framedSize);
            coerceSize(framedSize, inputs);

            // Do override
            var desired = override(framedSize);

            // Complete override
            state.flags &= ~LayoutFlags.Measure;
            Size.copyTo(desired, state.hiddenDesire);

            // Finish desired
            coerceSize(desired, inputs);
            Thickness.growSize(inputs.margin, desired);

            desired.width = Math.min(desired.width, availableSize.width);
            desired.height = Math.min(desired.height, availableSize.height);
            if (inputs.useLayoutRounding) {
                desired.width = Math.round(desired.width);
                desired.height = Math.round(desired.height);
            }
            Size.copyTo(desired, state.desiredSize);

            return true;
        };
    }
}