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
        lastAvailable: ISize;
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

    export var DEFAULT_VISIBLE = true;
    export var DEFAULT_USE_LAYOUT_ROUNDING = true;
    export var DEFAULT_WIDTH = NaN;
    export var DEFAULT_HEIGHT = NaN;
    export var DEFAULT_MIN_WIDTH = 0.0;
    export var DEFAULT_MIN_HEIGHT = 0.0;
    export var DEFAULT_MAX_WIDTH = Number.POSITIVE_INFINITY;
    export var DEFAULT_MAX_HEIGHT = Number.POSITIVE_INFINITY;

    export class LayoutNode {
        inputs: ILayoutNodeInputs;
        state: ILayoutNodeState;
        tree: ILayoutTree;

        private $measurer: core.IMeasurer;
        private $arranger: core.IArranger;

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
                lastAvailable: new Size(NaN, NaN),
                desiredSize: new Size(),
                hiddenDesire: new Size(),
                layoutSlot: new Rect(NaN, NaN, NaN, NaN),
                arrangedSlot: new Rect(),
                lastArrangedSlot: new Rect(NaN, NaN, NaN, NaN),
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
            if (!value) // unset
                value = new Thickness();
            if (Thickness.isEqual(this.inputs.margin, value))
                return;
            this.inputs.margin = value;
            onNodeSizeInputsChanged(this);
        }

        get width(): number {
            return this.inputs.width;
        }

        set width(value: number) {
            if (value == null) //unset
                value = DEFAULT_WIDTH;
            if (this.inputs.width === value)
                return;
            this.inputs.width = value;
            onNodeSizeInputsChanged(this);
        }

        get height(): number {
            return this.inputs.height;
        }

        set height(value: number) {
            if (value == null) //unset
                value = DEFAULT_HEIGHT;
            if (this.inputs.height === value)
                return;
            this.inputs.height = value;
            onNodeSizeInputsChanged(this);
        }

        get minWidth(): number {
            return this.inputs.minWidth;
        }

        set minWidth(value: number) {
            if (value == null) //unset
                value = DEFAULT_MIN_WIDTH;
            if (this.inputs.minWidth === value)
                return;
            this.inputs.minWidth = value;
            onNodeSizeInputsChanged(this);
        }

        get minHeight(): number {
            return this.inputs.minHeight;
        }

        set minHeight(value: number) {
            if (value == null) //unset
                value = DEFAULT_MIN_HEIGHT;
            if (this.inputs.minHeight === value)
                return;
            this.inputs.minHeight = value;
            onNodeSizeInputsChanged(this);
        }

        get maxWidth(): number {
            return this.inputs.maxWidth;
        }

        set maxWidth(value: number) {
            if (value == null) //unset
                value = DEFAULT_MAX_WIDTH;
            if (this.inputs.maxWidth === value)
                return;
            this.inputs.maxWidth = value;
            onNodeSizeInputsChanged(this);
        }

        get maxHeight(): number {
            return this.inputs.maxHeight;
        }

        set maxHeight(value: number) {
            if (value == null) //unset
                value = DEFAULT_MAX_HEIGHT;
            if (this.inputs.maxHeight === value)
                return;
            this.inputs.maxHeight = value;
            onNodeSizeInputsChanged(this);
        }

        get horizontalAlignment(): HorizontalAlignment {
            return this.inputs.horizontalAlignment;
        }

        set horizontalAlignment(value: HorizontalAlignment) {
            value = value || 0; // coerce null, undefined, 0 => 0
            if (this.inputs.horizontalAlignment === value)
                return;
            this.inputs.horizontalAlignment = value;
            this.invalidateArrange();
        }

        get verticalAlignment(): VerticalAlignment {
            return this.inputs.verticalAlignment;
        }

        set verticalAlignment(value: VerticalAlignment) {
            value = value || 0; // coerce null, undefined, 0 => 0
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
            if (value === undefined) {
                delete this.inputs.attached[property];
            } else {
                this.inputs.attached[property] = value;
            }
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
            Rect.undef(this.state.layoutSlot);
        }

        protected onAttached() {
            var state = this.state;
            Size.undef(state.lastAvailable);
            Rect.undef(state.layoutSlot);
            Size.clear(state.arrangedSlot);
            this.invalidateMeasure();
            this.invalidateArrange();
            if ((state.flags & LayoutFlags.slotHint) > 0 || !Rect.isUndef(state.lastArrangedSlot)) {
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

        doMeasure(rootSize: ISize): boolean {
            logger.doMeasure(this);
            var parent = this.tree.parent;
            var available = new Size();

            if (!parent) {
                // A root element will always use root size for measure
                Size.copyTo(rootSize, available);
            } else {
                // Other elements will use their last available size
                Size.copyTo(this.state.lastAvailable, available);
            }

            if (!Size.isUndef(available)) {
                logger.measure(this, available);
                let change = this.$measurer(available);
                logger.finishMeasure(this);
                if (!change)
                    return false;
            }

            if (parent)
                parent.invalidateMeasure();

            this.state.flags &= ~LayoutFlags.measure;
            return true;
        }

        measure(availableSize: ISize): boolean {
            logger.measure(this, availableSize);
            let change = this.$measurer(availableSize);
            logger.finishMeasure(this);
            return change;
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

        doArrange(rootSize: ISize): boolean {
            logger.doArrange(this);
            var parent = this.tree.parent;
            var final = new Rect();
            if (!parent) {
                // A root element will always use root size for arrange
                Size.copyTo(rootSize, final);
                // Constrain "infinite" dimensions by desired measure
                if (!isFinite(final.width))
                    final.width = this.state.desiredSize.width;
                if (!isFinite(final.height))
                    final.height = this.state.desiredSize.height;
            } else {
                // If we are starting an arrange from a non-root element,
                //   our measure developed a desired size that *did not*
                //   cause a further invalidation up the tree
                // This means that our desired size *is* our final for arrange
                Size.copyTo(this.state.desiredSize, final);
            }

            if (!Rect.isUndef(final)) {
                logger.arrange(this, final);
                let change = this.$arranger(final);
                logger.finishArrange(this);
                if (!change)
                    return false;
            }

            if (parent)
                parent.invalidateArrange();

            return true;
        }

        arrange(finalRect: IRect): boolean {
            logger.arrange(this, finalRect);
            let change = this.$arranger(finalRect);
            logger.finishArrange(this);
            return change;
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
            if (!Rect.isUndef(state.lastArrangedSlot))
                Rect.copyTo(state.lastArrangedSlot, oldRect);
            Rect.copyTo(state.arrangedSlot, newRect);
            Rect.undef(state.lastArrangedSlot);
            // TODO: Set actualWidth, actualHeight
            return true;
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