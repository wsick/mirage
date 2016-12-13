namespace mirage.core {
    export interface ILayoutNodeInputs {
        visible: boolean;
        useLayoutRounding: boolean;
        margin: Thickness;
        width: number;
        height: number;
        minWidth: number;
        minHeight: number;
        maxWidth: number;
        maxHeight: number;
        horizontalAlignment: HorizontalAlignment;
        verticalAlignment: VerticalAlignment;
    }

    export interface ILayoutNodeState {
        flags: LayoutFlags;
        previousAvailable: ISize;
        desiredSize: ISize;
        hiddenDesire: ISize;
        layoutSlot: Rect;
        visualOffset: Point;
        arranged: ISize;
        lastArranged: ISize;
    }

    export class LayoutNode {
        inputs: ILayoutNodeInputs;
        state: ILayoutNodeState;
        tree: ILayoutTree;

        private $measurer: core.IMeasurer;
        private $arranger: core.IArranger;
        private $measureBinder: core.IMeasureBinder;
        private $arrangeBinder: core.IArrangeBinder;

        constructor() {
            this.init();
        }

        init() {
            Object.defineProperties(this, {
                "inputs": {value: this.createInputs(), writable: false},
                "state": {value: this.createState(), writable: false},
                "tree": {value: this.createTree(), writable: false},
            });
            this.$measurer = core.DefaultMeasurer(this.inputs, this.state, this.tree);
            this.$arranger = core.DefaultArranger(this.inputs, this.state, this.tree);
            this.$measureBinder = core.NewMeasureBinder(this.state, this.tree, this.$measurer);
            this.$arrangeBinder = core.NewArrangeBinder(this.state, this.tree, this.$arranger);
        }

        protected createInputs(): ILayoutNodeInputs {
            return {
                visible: true,
                useLayoutRounding: true,
                margin: new Thickness(),
                width: NaN,
                height: NaN,
                minWidth: 0.0,
                minHeight: 0.0,
                maxWidth: Number.POSITIVE_INFINITY,
                maxHeight: Number.POSITIVE_INFINITY,
                horizontalAlignment: HorizontalAlignment.Stretch,
                verticalAlignment: VerticalAlignment.Stretch,
            };
        }

        protected createState(): ILayoutNodeState {
            return {
                flags: LayoutFlags.None,
                previousAvailable: new Size(),
                desiredSize: new Size(),
                hiddenDesire: new Size(),
                layoutSlot: new Rect(),
                visualOffset: new Point(),
                arranged: new Size(),
                lastArranged: new Size(),
            };
        }

        protected createTree(): ILayoutTree {
            return DefaultLayoutTree(this);
        }

        protected setParent(parent: LayoutNode) {
            if (!parent) {
                if (!this.tree.parent)
                    return;
                this.tree.parent = null;
                this.onDetached();
            } else {
                if (parent === this.tree.parent)
                    return;
                this.tree.parent = null;
                this.onDetached();
                this.tree.parent = parent;
                this.onAttached();
            }
        }

        protected onDetached() {
            this.invalidateMeasure();
            if (this.tree.parent)
                this.tree.parent.invalidateMeasure();
            Rect.clear(this.state.layoutSlot);
        }

        protected onAttached() {
            var state = this.state;
            Size.undef(state.previousAvailable);
            Size.clear(state.arranged);
            this.invalidateMeasure();
            this.invalidateArrange();
            if ((state.flags & LayoutFlags.SizeHint) > 0 || state.lastArranged !== undefined) {
                this.tree.propagateFlagUp(LayoutFlags.SizeHint);
            }
        }

        invalidateMeasure() {
            this.state.flags |= LayoutFlags.Measure | LayoutFlags.MeasureHint;
            this.tree.propagateFlagUp(LayoutFlags.MeasureHint);
        }

        measure(availableSize: ISize): boolean {
            return this.$measurer(availableSize);
        }

        invalidateArrange() {
            this.state.flags |= LayoutFlags.Arrange | LayoutFlags.ArrangeHint;
            this.tree.propagateFlagUp(LayoutFlags.ArrangeHint);
        }

        arrange(finalRect: Rect): boolean {
            return this.$arranger(finalRect);
        }
    }
}