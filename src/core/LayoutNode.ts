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
        attached: ILayoutNodeAttachedInputs;
    }

    export interface ILayoutNodeAttachedInputs {
        [property: string]: any;
    }

    export interface ILayoutNodeState {
        flags: LayoutFlags;
        previousAvailable: ISize;
        desiredSize: ISize;
        hiddenDesire: ISize;
        layoutSlot: IRect;
        arrangedSlot: IRect;
        lastArrangedSlot: IRect;
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
                "attached": {value: {}, writable: false},
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
                horizontalAlignment: HorizontalAlignment.stretch,
                verticalAlignment: VerticalAlignment.stretch,
                attached: {},
            };
        }

        protected createState(): ILayoutNodeState {
            return {
                flags: LayoutFlags.none,
                previousAvailable: new Size(),
                desiredSize: new Size(),
                hiddenDesire: new Size(),
                layoutSlot: new Rect(),
                arrangedSlot: new Rect(),
                lastArrangedSlot: new Rect(),
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

        // PROPERTIES

        get visible(): boolean {
            return this.inputs.visible;
        }

        set visible(value: boolean) {
            if (this.inputs.visible === value)
                return;
            this.inputs.visible = value === true;
            this.invalidateMeasure();
            var parent = this.tree.parent;
            if (parent)
                parent.invalidateMeasure();
        }

        get useLayoutRounding(): boolean {
            return this.inputs.useLayoutRounding;
        }

        set useLayoutRounding(value: boolean) {
            if (this.inputs.useLayoutRounding === value)
                return;
            this.inputs.useLayoutRounding = value === true;
            this.invalidateMeasure();
            this.invalidateArrange();
        }

        get margin(): Thickness {
            return this.inputs.margin;
        }

        set margin(value: Thickness) {
            if (Thickness.isEqual(this.inputs.margin, value))
                return;
            this.inputs.margin = value;
            onNodeSizeInputsChanged(this);
        }

        get width(): number {
            return this.inputs.width;
        }

        set width(value: number) {
            if (this.inputs.width === value)
                return;
            this.inputs.width = value;
            onNodeSizeInputsChanged(this);
        }

        get height(): number {
            return this.inputs.height;
        }

        set height(value: number) {
            if (this.inputs.height === value)
                return;
            this.inputs.height = value;
            onNodeSizeInputsChanged(this);
        }

        get minWidth(): number {
            return this.inputs.minWidth;
        }

        set minWidth(value: number) {
            if (this.inputs.minWidth === value)
                return;
            this.inputs.minWidth = value;
            onNodeSizeInputsChanged(this);
        }

        get minHeight(): number {
            return this.inputs.minHeight;
        }

        set minHeight(value: number) {
            if (this.inputs.minHeight === value)
                return;
            this.inputs.minHeight = value;
            onNodeSizeInputsChanged(this);
        }

        get maxWidth(): number {
            return this.inputs.maxWidth;
        }

        set maxWidth(value: number) {
            if (this.inputs.maxWidth === value)
                return;
            this.inputs.maxWidth = value;
            onNodeSizeInputsChanged(this);
        }

        get maxHeight(): number {
            return this.inputs.maxHeight;
        }

        set maxHeight(value: number) {
            if (this.inputs.maxHeight === value)
                return;
            this.inputs.maxHeight = value;
            onNodeSizeInputsChanged(this);
        }

        get horizontalAlignment(): HorizontalAlignment {
            return this.inputs.horizontalAlignment;
        }

        set horizontalAlignment(value: HorizontalAlignment) {
            if (this.inputs.horizontalAlignment === value)
                return;
            this.inputs.horizontalAlignment = value;
            this.invalidateArrange();
        }

        get verticalAlignment(): VerticalAlignment {
            return this.inputs.verticalAlignment;
        }

        set verticalAlignment(value: VerticalAlignment) {
            if (this.inputs.verticalAlignment === value)
                return;
            this.inputs.verticalAlignment = value;
            this.invalidateArrange();
        }

        // ATTACHED

        getAttached(property: string): any {
            return this.inputs.attached[property];
        }

        setAttached(property: string, value: any) {
            this.inputs.attached[property] = value;
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
            if ((state.flags & LayoutFlags.slotHint) > 0 || state.lastArrangedSlot !== undefined) {
                this.tree.propagateFlagUp(LayoutFlags.slotHint);
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
            this.state.flags |= LayoutFlags.measure | LayoutFlags.measureHint;
            this.tree.propagateFlagUp(LayoutFlags.measureHint);
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
            this.state.flags |= LayoutFlags.arrange | LayoutFlags.arrangeHint;
            this.tree.propagateFlagUp(LayoutFlags.arrangeHint);
        }

        doArrange(): boolean {
            return this.$arrangeBinder();
        }

        arrange(finalRect: IRect): boolean {
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

        slot(oldRect: IRect, newRect: IRect): boolean {
            var state = this.state;
            if (state.lastArrangedSlot)
                Rect.copyTo(state.lastArrangedSlot, oldRect);
            Rect.copyTo(state.arrangedSlot, newRect);
            state.lastArrangedSlot = undefined;
            // TODO: Set actualWidth, actualHeight
            return true;
        }

        onSlotChanged(oldRect: IRect, newRect: IRect) {
            // Placeholder for sizing notifications
        }
    }

    function onNodeSizeInputsChanged(node: core.LayoutNode) {
        node.invalidateMeasure();
        node.invalidateArrange();
        var parent = node.tree.parent;
        if (parent)
            parent.invalidateMeasure();
    }
}