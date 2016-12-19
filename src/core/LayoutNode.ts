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
        arrangedSlot: Rect;
        lastArranged: ISize;
    }

    export interface ILayoutTreeDeepWalker {
        current: LayoutNode;
        step(): boolean;
        skipBranch();
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
            this.$measurer = this.createMeasurer();
            this.$arranger = this.createArranger();
            this.$measureBinder = NewMeasureBinder(this.state, this.tree, this.$measurer);
            this.$arrangeBinder = NewArrangeBinder(this.state, this.tree, this.$arranger);
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
                arrangedSlot: new Rect(),
                lastArranged: new Size(),
            };
        }

        protected createTree(): ILayoutTree {
            return DefaultLayoutTree();
        }

        protected createMeasurer(): core.IMeasurer {
            return core.NewMeasurer(this.inputs, this.state, this.tree, constraint => this.measureOverride(constraint));
        }

        protected createArranger(): core.IArranger {
            return core.NewArranger(this.inputs, this.state, this.tree, arrangeSize => this.arrangeOverride(arrangeSize));
        }

        // TREE

        setParent(parent: LayoutNode) {
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
            Size.clear(state.arrangedSlot);
            this.invalidateMeasure();
            this.invalidateArrange();
            if ((state.flags & LayoutFlags.SizeHint) > 0 || state.lastArranged !== undefined) {
                this.tree.propagateFlagUp(LayoutFlags.SizeHint);
            }
        }

        walkDeep(reverse?: boolean): ILayoutTreeDeepWalker {
            var last: LayoutNode = undefined;
            var walkList: LayoutNode[] = [this];

            return {
                current: undefined,
                step(): boolean {
                    if (last) {
                        for (var subwalker = last.tree.walk(reverse); subwalker.step();) {
                            walkList.unshift(subwalker.current);
                        }
                    }

                    this.current = last = walkList.shift();
                    return this.current !== undefined;
                },
                skipBranch() {
                    last = undefined;
                },
            };
        }

        // LAYOUT

        invalidateMeasure() {
            this.state.flags |= LayoutFlags.Measure | LayoutFlags.MeasureHint;
            this.tree.propagateFlagUp(LayoutFlags.MeasureHint);
        }

        doMeasure(): boolean {
            return this.$measureBinder();
        }

        measure(availableSize: ISize): boolean {
            return this.$measurer(availableSize);
        }

        protected measureOverride(constraint: ISize): ISize {
            var desired = new Size();
            for (var walker = this.tree.walk(); walker.step();) {
                walker.current.measure(constraint);
                Size.max(desired, walker.current.state.desiredSize);
            }
            return desired;
        }

        invalidateArrange() {
            this.state.flags |= LayoutFlags.Arrange | LayoutFlags.ArrangeHint;
            this.tree.propagateFlagUp(LayoutFlags.ArrangeHint);
        }

        doArrange(): boolean {
            return this.$arrangeBinder();
        }

        arrange(finalRect: Rect): boolean {
            return this.$arranger(finalRect);
        }

        protected arrangeOverride(arrangeSize: ISize): ISize {
            var arranged = new Size(arrangeSize.width, arrangeSize.height);
            for (var walker = this.tree.walk(); walker.step();) {
                var childRect = new Rect(0, 0, arrangeSize.width, arrangeSize.height);
                walker.current.arrange(childRect);
            }
            return arranged;
        }

        sizing(oldSize: ISize, newSize: ISize): boolean {
            var state = this.state;
            if (state.lastArranged)
                Size.copyTo(state.lastArranged, oldSize);
            Size.copyTo(state.arrangedSlot, newSize);
            state.lastArranged = undefined;
            // TODO: Set actualWidth, actualHeight
            return true;
        }

        onSizeChanged(oldSize: ISize, newSize: ISize) {
            // Placeholder for sizing notifications
        }
    }
}