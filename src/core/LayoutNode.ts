namespace mirage.core {
    export interface ILayoutNodeInputs {
        visible: boolean;
        margin: Thickness;
        width: number;
        height: number;
        minWidth: number;
        minHeight: number;
        maxWidth: number;
        maxHeight: number;
        useLayoutRounding: boolean;
        horizontalAlignment: HorizontalAlignment;
        verticalAlignment: VerticalAlignment;
    }

    export interface ILayoutNodeState {
        flags: LayoutFlags;
        previousAvailable: ISize;
        desiredSize: ISize;
        hiddenDesire: ISize;
        layoutSlot: Rect;
    }

    export class LayoutNode {
        private inputs: ILayoutNodeInputs;
        private state: ILayoutNodeState;
        private tree: ILayoutTree;

        private $measureBinder: core.IMeasureBinder;
        private $measurer: core.IMeasurer;

        constructor() {
            this.init();
        }

        init() {
            this.$measurer = core.DefaultMeasurer(this.inputs, this.state, this.tree);
            this.$measureBinder = core.NewMeasureBinder(this.state, this.tree, this.$measurer);

        }

        invalidateMeasure() {
            this.state.flags |= LayoutFlags.Measure;
            this.tree.propagateFlagUp(LayoutFlags.MeasureHint);
        }
    }
}