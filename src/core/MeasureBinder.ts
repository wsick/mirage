namespace mirage.core {
    export interface IMeasureBinder {
        (): boolean;
    }

    export function NewMeasureBinder(state: ILayoutNodeState, tree: ILayoutTree, measurer: IMeasurer): IMeasureBinder {
        return function (): boolean {
            var last = state.lastAvailable;
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

            state.flags &= ~LayoutFlags.measure;
            return success;
        };
    }
}