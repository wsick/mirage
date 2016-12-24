declare module mirage {
    var version: string;
}
declare namespace mirage.core {
    interface ILayoutNodeInputs {
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
    interface ILayoutNodeAttachedInputs {
        [property: string]: any;
    }
    interface ILayoutNodeState {
        flags: LayoutFlags;
        lastAvailable: ISize;
        desiredSize: ISize;
        hiddenDesire: ISize;
        layoutSlot: IRect;
        arrangedSlot: IRect;
        lastArrangedSlot: IRect;
    }
    interface ILayoutTreeDeepWalker {
        current: LayoutNode;
        step(): boolean;
        skipBranch(): any;
    }
    class LayoutNode {
        inputs: ILayoutNodeInputs;
        state: ILayoutNodeState;
        tree: ILayoutTree;
        private $measurer;
        private $arranger;
        constructor();
        init(): void;
        protected createInputs(): ILayoutNodeInputs;
        protected createState(): ILayoutNodeState;
        protected createTree(): ILayoutTree;
        protected createMeasurer(): core.IMeasurer;
        protected createArranger(): core.IArranger;
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
        getAttached(property: string): any;
        setAttached(property: string, value: any): void;
        setParent(parent: LayoutNode): void;
        protected onDetached(): void;
        protected onAttached(): void;
        walkDeep(reverse?: boolean): ILayoutTreeDeepWalker;
        invalidateMeasure(): void;
        doMeasure(): boolean;
        measure(availableSize: ISize): boolean;
        protected measureOverride(constraint: ISize): ISize;
        invalidateArrange(): void;
        doArrange(rootSize: ISize): boolean;
        arrange(finalRect: IRect): boolean;
        protected arrangeOverride(arrangeSize: ISize): ISize;
        slot(oldRect: IRect, newRect: IRect): boolean;
    }
}
declare namespace mirage {
    class Panel extends core.LayoutNode {
        tree: IPanelTree;
        protected createTree(): core.ILayoutTree;
        protected measureOverride(constraint: ISize): ISize;
        protected arrangeOverride(arrangeSize: ISize): ISize;
        childCount: number;
        insertChild(child: core.LayoutNode, index: number): void;
        prependChild(child: core.LayoutNode): void;
        appendChild(child: core.LayoutNode): void;
        removeChild(child: core.LayoutNode): boolean;
        removeChildAt(index: number): core.LayoutNode;
        getChildAt(index: number): core.LayoutNode;
    }
    interface IPanelTree extends core.ILayoutTree {
        children: core.LayoutNode[];
    }
    function NewPanelTree(): IPanelTree;
}
declare namespace mirage {
    class Canvas extends Panel {
        static getLeft(node: core.LayoutNode): number;
        static setLeft(node: core.LayoutNode, value: number): void;
        static getTop(node: core.LayoutNode): number;
        static setTop(node: core.LayoutNode, value: number): void;
        protected measureOverride(constraint: ISize): ISize;
        protected arrangeOverride(arrangeSize: ISize): ISize;
    }
}
declare namespace mirage {
    enum HorizontalAlignment {
        left = 0,
        center = 1,
        right = 2,
        stretch = 3,
    }
    enum VerticalAlignment {
        top = 0,
        center = 1,
        bottom = 2,
        stretch = 3,
    }
    enum Orientation {
        horizontal = 0,
        vertical = 1,
    }
}
declare namespace mirage {
    interface IGridInputs extends core.ILayoutNodeInputs {
        rowDefinitions: IRowDefinition[];
        columnDefinitions: IColumnDefinition[];
    }
    interface IGridState extends core.ILayoutNodeState {
        design: grid.design.IGridDesign;
    }
    class Grid extends Panel {
        static getColumn(node: core.LayoutNode): number;
        static setColumn(node: core.LayoutNode, value: number): void;
        static getColumnSpan(node: core.LayoutNode): number;
        static setColumnSpan(node: core.LayoutNode, value: number): void;
        static getRow(node: core.LayoutNode): number;
        static setRow(node: core.LayoutNode, value: number): void;
        static getRowSpan(node: core.LayoutNode): number;
        static setRowSpan(node: core.LayoutNode, value: number): void;
        inputs: IGridInputs;
        state: IGridState;
        private $measureOverride;
        private $arrangeOverride;
        init(): void;
        rowDefinitions: IRowDefinition[];
        columnDefinitions: IColumnDefinition[];
        protected createInputs(): IGridInputs;
        protected createState(): IGridState;
        protected measureOverride(constraint: ISize): ISize;
        protected arrangeOverride(arrangeSize: ISize): ISize;
    }
}
declare namespace mirage {
    interface IColumnDefinition {
        width: IGridLength;
        minWidth: number;
        maxWidth: number;
        getActualWidth(): number;
        setActualWidth(value: number): any;
    }
    function NewColumnDefinitions(defs: string): IColumnDefinition[];
    function NewColumnDefinition(): IColumnDefinition;
    function NewColumnDefinition(width: string): IColumnDefinition;
    function NewColumnDefinition(widthValue: number, widthType: GridUnitType): IColumnDefinition;
    function NewColumnDefinition(width: string, minWidth: number, maxWidth: number): IColumnDefinition;
    function NewColumnDefinition(widthValue: number, widthType: GridUnitType, minWidth: number, maxWidth: number): IColumnDefinition;
}
declare namespace mirage {
    enum GridUnitType {
        auto = 0,
        pixel = 1,
        star = 2,
    }
    interface IGridLength {
        value: number;
        type: GridUnitType;
    }
    function parseGridLength(s: string): IGridLength;
}
declare namespace mirage.adapters {
    interface IRenderAdapter {
        updateSlots(updates: draft.ISlotUpdate[]): any;
    }
    function register(adapter: IRenderAdapter): void;
    function unregister(adapter: IRenderAdapter): void;
    function updateSlots(updates: draft.ISlotUpdate[]): void;
}
declare namespace mirage {
    interface IRowDefinition {
        height: IGridLength;
        minHeight: number;
        maxHeight: number;
        getActualHeight(): number;
        setActualHeight(value: number): any;
    }
    function NewRowDefinitions(defs: string): IRowDefinition[];
    function NewRowDefinition(): IRowDefinition;
    function NewRowDefinition(height: string): IRowDefinition;
    function NewRowDefinition(heightValue: number, heightType: GridUnitType): IRowDefinition;
    function NewRowDefinition(height: string, minHeight: number, maxHeight: number): IRowDefinition;
    function NewRowDefinition(heightValue: number, heightType: GridUnitType, minHeight: number, maxHeight: number): IRowDefinition;
}
declare namespace mirage {
    interface IPoint {
        x: number;
        y: number;
    }
    class Point implements IPoint {
        x: number;
        y: number;
        constructor(x?: number, y?: number);
        static isEqual(p1: IPoint, p2: IPoint): boolean;
        static copyTo(src: IPoint, dest: IPoint): void;
        static round(dest: IPoint): void;
    }
}
declare namespace mirage {
    interface IRect extends IPoint, ISize {
    }
    class Rect implements IRect {
        x: number;
        y: number;
        width: number;
        height: number;
        constructor(x?: number, y?: number, width?: number, height?: number);
        static clear(rect: IRect): void;
        static isEqual(rect1: IRect, rect2: IRect): boolean;
        static isEmpty(src: IRect): boolean;
        static copyTo(src: IRect, dest: IRect): void;
        static isUndef(rect: IRect): boolean;
        static undef(rect: IRect): void;
    }
}
declare namespace mirage {
    interface ISize {
        width: number;
        height: number;
    }
    class Size implements ISize {
        width: number;
        height: number;
        constructor(width?: number, height?: number);
        static copyTo(src: ISize, dest: ISize): void;
        static isEqual(size1: ISize, size2: ISize): boolean;
        static isEmpty(size: Size): boolean;
        static max(dest: ISize, size2: ISize): void;
        static min(dest: ISize, size2: ISize): void;
        static round(size: ISize): void;
        static clear(size: ISize): void;
        static isUndef(size: ISize): boolean;
        static undef(size: ISize): void;
    }
}
declare namespace mirage {
    interface IStackPanelInputs extends core.ILayoutNodeInputs {
        orientation: Orientation;
    }
    class StackPanel extends Panel {
        inputs: IStackPanelInputs;
        orientation: Orientation;
        protected createInputs(): IStackPanelInputs;
        protected measureOverride(constraint: ISize): ISize;
        private measureVertical(constraint);
        private measureHorizontal(constraint);
        protected arrangeOverride(arrangeSize: ISize): ISize;
        private arrangeVertical(arrangeSize);
        private arrangeHorizontal(arrangeSize);
    }
}
declare namespace mirage {
    class Thickness {
        left: number;
        top: number;
        right: number;
        bottom: number;
        constructor(left?: number, top?: number, right?: number, bottom?: number);
        static isEqual(t1: Thickness, t2: Thickness): boolean;
        static growSize(thickness: Thickness, dest: Size): Size;
        static shrinkSize(thickness: Thickness, dest: Size): Size;
        static shrinkRect(thickness: Thickness, dest: IRect): void;
    }
}
declare namespace mirage.core {
    interface IArranger {
        (finalRect: Rect): boolean;
    }
    interface IArrangeOverride {
        (finalSize: ISize): ISize;
    }
    function NewArranger(inputs: ILayoutNodeInputs, state: ILayoutNodeState, tree: ILayoutTree, override: IArrangeOverride): IArranger;
}
declare namespace mirage.core {
    function DefaultLayoutTree(): ILayoutTree;
}
declare namespace mirage.core {
    interface ILayoutTreeWalker {
        current: LayoutNode;
        step(): boolean;
    }
    interface ILayoutTree {
        parent: LayoutNode;
        applyTemplate(): boolean;
        propagateFlagUp(flag: LayoutFlags): any;
        walk(reverse?: boolean): ILayoutTreeWalker;
    }
}
declare namespace mirage.core {
    enum LayoutFlags {
        none = 0,
        measure = 2,
        arrange = 4,
        measureHint = 8,
        arrangeHint = 16,
        slotHint = 32,
        hints = 56,
    }
}
declare namespace mirage.core {
    interface IMeasurer {
        (availableSize: ISize): boolean;
    }
    interface IMeasureOverride {
        (coreSize: ISize): Size;
    }
    function NewMeasurer(inputs: ILayoutNodeInputs, state: ILayoutNodeState, tree: ILayoutTree, override: IMeasureOverride): IMeasurer;
}
declare namespace mirage.core {
    interface ISized {
        width: number;
        height: number;
        minWidth: number;
        minHeight: number;
        maxWidth: number;
        maxHeight: number;
        useLayoutRounding: boolean;
    }
    function coerceSize(size: ISize, inputs: ISized): void;
}
declare namespace mirage.draft {
    interface IArrangeDrafter {
        flush(): any;
        prepare(): boolean;
        draft(): boolean;
    }
    function NewArrangeDrafter(node: core.LayoutNode, rootSize: ISize): IArrangeDrafter;
}
declare namespace mirage.draft {
    interface IDrafter {
        (): boolean;
    }
    function NewDrafter(node: core.LayoutNode, rootSize: ISize): IDrafter;
}
declare namespace mirage.draft {
    interface IMeasureDrafter {
        prepare(): boolean;
        draft(): boolean;
    }
    function NewMeasureDrafter(node: core.LayoutNode): IMeasureDrafter;
}
declare namespace mirage.draft {
    interface ISlotDrafter {
        flush(): any;
        prepare(): boolean;
        draft(): boolean;
        notify(): boolean;
    }
    interface ISlotUpdate {
        node: core.LayoutNode;
        oldRect: IRect;
        newRect: IRect;
    }
    function NewSlotDrafter(node: core.LayoutNode): ISlotDrafter;
}
declare namespace mirage.grid {
    function NewGridArrangeOverride(inputs: IGridInputs, state: IGridState, tree: IPanelTree): core.IArrangeOverride;
}
declare namespace mirage.grid {
    function NewGridMeasureOverride(inputs: IGridInputs, state: IGridState, tree: IPanelTree): core.IMeasureOverride;
}
declare namespace mirage.grid.design {
    interface IGridArrangeDesign {
        init(arrangeSize: ISize, coldefs: IColumnDefinition[], rowdefs: IRowDefinition[]): any;
        calcChildRect(childRect: IRect, child: core.LayoutNode): any;
    }
    function NewGridArrangeDesign(cm: Segment[][], rm: Segment[][]): IGridArrangeDesign;
}
declare namespace mirage.grid.design {
    interface IGridPlacement {
        init(): any;
        add(isRow: boolean, start: number, span: number, size: number): any;
        allocate(allocFunc: () => void): any;
    }
    function NewGridPlacement(cm: Segment[][], rm: Segment[][]): IGridPlacement;
}
declare namespace mirage.grid.design {
    interface IGridShape {
        hasAutoAuto: boolean;
        hasStarAuto: boolean;
        hasAutoStar: boolean;
    }
    function NewGridShape(childShapes: IGridChildShape[]): IGridShape;
    interface IGridChildShape {
        starRow: boolean;
        autoRow: boolean;
        starCol: boolean;
        autoCol: boolean;
        col: number;
        row: number;
        colspan: number;
        rowspan: number;
        init(child: core.LayoutNode, rm: Segment[][], cm: Segment[][]): any;
        shouldMeasurePass(gridShape: IGridShape, childSize: ISize, pass: MeasureOverridePass): boolean;
        calcConstraint(childSize: ISize, cm: Segment[][], rm: Segment[][]): any;
    }
    class GridChildShape implements IGridChildShape {
        starRow: boolean;
        autoRow: boolean;
        starCol: boolean;
        autoCol: boolean;
        col: number;
        row: number;
        colspan: number;
        rowspan: number;
        init(child: core.LayoutNode, cm: Segment[][], rm: Segment[][]): void;
        shouldMeasurePass(gridShape: IGridShape, childSize: ISize, pass: MeasureOverridePass): boolean;
        calcConstraint(childSize: ISize, cm: Segment[][], rm: Segment[][]): void;
    }
}
declare namespace mirage.grid.design.helpers {
    function expand(available: number, mat: Segment[][]): void;
    function assignSize(mat: Segment[][], start: number, end: number, size: number, unitType: GridUnitType, desiredSize: boolean): number;
    function calcDesiredToOffered(matrix: Segment[][]): number;
}
declare namespace mirage.grid.design {
    interface IGridDesign {
        measure: IGridMeasureDesign;
        arrange: IGridArrangeDesign;
    }
    function NewGridDesign(): IGridDesign;
}
declare namespace mirage.grid.design {
    interface IGridMeasureDesign {
        init(constraint: ISize, coldefs: IColumnDefinition[], rowdefs: IRowDefinition[], tree: IPanelTree): any;
        measureChild(pass: MeasureOverridePass, index: number, child: core.LayoutNode): any;
        finishPass(): any;
        finish(): any;
        getDesired(): ISize;
    }
    function NewGridMeasureDesign(cm: Segment[][], rm: Segment[][]): IGridMeasureDesign;
}
declare namespace mirage.grid.design {
    enum MeasureOverridePass {
        autoAuto = 0,
        starAuto = 1,
        autoStar = 2,
        starAutoAgain = 3,
        nonStar = 4,
        remainingStar = 5,
    }
    function NewMeasureOverridePass(pass: MeasureOverridePass, des: IGridMeasureDesign, tree: IPanelTree): () => void;
}
declare module mirage.grid.design {
    class Segment {
        desired: number;
        offered: number;
        original: number;
        min: number;
        max: number;
        stars: number;
        type: GridUnitType;
        clamp(value: number): number;
        static init(segment: Segment, offered?: number, min?: number, max?: number, unitType?: GridUnitType): Segment;
    }
}
