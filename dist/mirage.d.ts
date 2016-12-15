declare module mirage {
    var version: string;
}
declare namespace mirage {
    interface ICornerRadius {
        topLeft: number;
        topRight: number;
        bottomRight: number;
        bottomLeft: number;
    }
    class CornerRadius implements ICornerRadius {
        topLeft: number;
        topRight: number;
        bottomRight: number;
        bottomLeft: number;
        constructor(topLeft?: number, topRight?: number, bottomRight?: number, bottomLeft?: number);
        static isEmpty(cr: ICornerRadius): boolean;
        static isEqual(cr1: ICornerRadius, cr2: ICornerRadius): boolean;
        static clear(dest: ICornerRadius): void;
        static copyTo(cr2: ICornerRadius, dest: ICornerRadius): void;
    }
}
declare namespace mirage {
    enum HorizontalAlignment {
        Left = 0,
        Center = 1,
        Right = 2,
        Stretch = 3,
    }
    enum VerticalAlignment {
        Top = 0,
        Center = 1,
        Bottom = 2,
        Stretch = 3,
    }
    enum Orientation {
        Horizontal = 0,
        Vertical = 1,
    }
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
    }
    interface ILayoutNodeState {
        flags: LayoutFlags;
        previousAvailable: ISize;
        desiredSize: ISize;
        hiddenDesire: ISize;
        layoutSlot: Rect;
        visualOffset: Point;
        arranged: ISize;
        lastArranged: ISize;
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
        private $measureBinder;
        private $arrangeBinder;
        constructor();
        init(): void;
        protected createInputs(): ILayoutNodeInputs;
        protected createState(): ILayoutNodeState;
        protected createTree(): ILayoutTree;
        protected createMeasurer(): core.IMeasurer;
        protected createArranger(): core.IArranger;
        setParent(parent: LayoutNode): void;
        protected onDetached(): void;
        protected onAttached(): void;
        walkDeep(reverse?: boolean): ILayoutTreeDeepWalker;
        invalidateMeasure(): void;
        doMeasure(): boolean;
        measure(availableSize: ISize): boolean;
        protected measureOverride(constraint: ISize): ISize;
        invalidateArrange(): void;
        doArrange(): boolean;
        arrange(finalRect: Rect): boolean;
        protected arrangeOverride(arrangeSize: ISize): ISize;
        sizing(oldSize: ISize, newSize: ISize): boolean;
        onSizeChanged(oldSize: ISize, newSize: ISize): void;
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
interface IVector2Static {
    create(x: number, y: number): number[];
    init(x: number, y: number, dest?: number[]): number[];
}
declare namespace mirage {
    var vec2: IVector2Static;
}
declare var vec2: IVector2Static;
declare namespace mirage {
    enum RectOverlap {
        Out = 0,
        In = 1,
        Part = 2,
    }
    class Rect implements IPoint, ISize {
        x: number;
        y: number;
        width: number;
        height: number;
        constructor(x?: number, y?: number, width?: number, height?: number);
        static clear(rect: Rect): void;
        static getBottom(rect: Rect): number;
        static getRight(rect: Rect): number;
        static isEqual(rect1: Rect, rect2: Rect): boolean;
        static isEmpty(src: Rect): boolean;
        static copyTo(src: Rect, dest: Rect): void;
        static roundOut(dest: Rect): void;
        static roundIn(dest: Rect): Rect;
        static intersection(dest: Rect, rect2: Rect): void;
        static union(dest: Rect, rect2: Rect): void;
        static isContainedIn(src: Rect, test: Rect): boolean;
        static containsPoint(rect1: Rect, p: Point): boolean;
        static extendTo(dest: Rect, x: number, y: number): void;
        static grow(dest: Rect, left: number, top: number, right: number, bottom: number): Rect;
        static shrink(dest: Rect, left: number, top: number, right: number, bottom: number): void;
        static rectIn(rect1: Rect, rect2: Rect): RectOverlap;
        static transform(dest: Rect, mat: number[]): Rect;
        static transform4(dest: Rect, projection: number[]): void;
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
        static isUndef(size: ISize): boolean;
        static clear(size: ISize): void;
        static undef(size: ISize): void;
    }
}
declare namespace mirage {
    interface IStackPanelInputs extends core.ILayoutNodeInputs {
        orientation: Orientation;
    }
    class StackPanel extends Panel {
        inputs: IStackPanelInputs;
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
        static add(dest: Thickness, t2: Thickness): void;
        static copyTo(thickness: Thickness, dest: Thickness): void;
        static isEmpty(thickness: Thickness): boolean;
        static isBalanced(thickness: Thickness): boolean;
        static shrinkSize(thickness: Thickness, dest: Size): Size;
        static shrinkRect(thickness: Thickness, dest: Rect): void;
        static shrinkCornerRadius(thickness: Thickness, dest: ICornerRadius): void;
        static growSize(thickness: Thickness, dest: Size): Size;
        static growRect(thickness: Thickness, dest: Rect): void;
        static growCornerRadius(thickness: Thickness, dest: ICornerRadius): void;
    }
}
declare namespace mirage.Vector {
    function create(x: number, y: number): number[];
    function reverse(v: number[]): number[];
    function orthogonal(v: number[]): number[];
    function normalize(v: number[]): number[];
    function rotate(v: number[], theta: number): number[];
    function angleBetween(u: number[], v: number[]): number;
    function isClockwiseTo(v1: number[], v2: number[]): boolean;
    function intersection(s1: number[], d1: number[], s2: number[], d2: number[]): number[];
}
declare namespace mirage {
    enum Visibility {
        Visible = 0,
        Collapsed = 1,
    }
}
declare namespace mirage.core {
    interface IArrangeInputs {
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
    interface IArrangeState {
        flags: LayoutFlags;
        previousAvailable: ISize;
        desiredSize: ISize;
        hiddenDesire: ISize;
        layoutSlot: Rect;
        visualOffset: Point;
        arranged: ISize;
        lastArranged: ISize;
    }
    interface IArrangeBinder {
        (): boolean;
    }
    function NewArrangeBinder(state: IArrangeState, tree: ILayoutTree, arranger: IArranger): IArrangeBinder;
    interface IArranger {
        (finalRect: Rect): boolean;
    }
    interface IArrangeOverride {
        (finalSize: ISize): ISize;
    }
    function NewArranger(inputs: IArrangeInputs, state: IArrangeState, tree: ILayoutTree, override: IArrangeOverride): IArranger;
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
        isContainer: boolean;
        isLayoutContainer: boolean;
        parent: LayoutNode;
        applyTemplate(): boolean;
        propagateFlagUp(flag: LayoutFlags): any;
        walk(reverse?: boolean): ILayoutTreeWalker;
    }
}
declare namespace mirage.core {
    enum LayoutFlags {
        None = 0,
        Measure = 2,
        Arrange = 4,
        MeasureHint = 8,
        ArrangeHint = 16,
        SizeHint = 32,
        Hints = 56,
    }
}
declare namespace mirage.core {
    interface IMeasureInputs {
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
    interface IMeasureState {
        flags: LayoutFlags;
        previousAvailable: ISize;
        desiredSize: ISize;
        hiddenDesire: ISize;
    }
    interface IMeasureBinder {
        (): boolean;
    }
    function NewMeasureBinder(state: IMeasureState, tree: ILayoutTree, measurer: IMeasurer): IMeasureBinder;
    interface IMeasurer {
        (availableSize: ISize): boolean;
    }
    interface IMeasureOverride {
        (coreSize: ISize): Size;
    }
    function NewMeasurer(inputs: IMeasureInputs, state: IMeasureState, tree: ILayoutTree, override: IMeasureOverride): IMeasurer;
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
    function NewArrangeDrafter(node: core.LayoutNode): IArrangeDrafter;
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
    function NewMeasureDrafter(node: core.LayoutNode, rootSize: ISize): IMeasureDrafter;
}
declare namespace mirage.draft {
    interface ISizeDrafter {
        flush(): any;
        prepare(): boolean;
        draft(): boolean;
        notify(): boolean;
    }
    function NewSizeDrafter(node: core.LayoutNode): ISizeDrafter;
}
interface IMatrix3Static {
    create(src?: number[]): number[];
    copyTo(src: number[], dest: number[]): number[];
    init(dest: number[], m11: number, m12: number, m21: number, m22: number, x0: number, y0: number): number[];
    identity(dest?: number[]): number[];
    equal(a: number[], b: number[]): boolean;
    multiply(a: number[], b: number[], dest?: number[]): number[];
    inverse(mat: number[], dest?: number[]): number[];
    transformVec2(mat: number[], vec: number[], dest?: number[]): number[];
    createTranslate(x: number, y: number, dest?: number[]): number[];
    translate(mat: number[], x: number, y: number): number[];
    createScale(sx: number, sy: number, dest?: number[]): number[];
    scale(mat: number[], sx: number, sy: number): number[];
    createRotate(angleRad: number, dest?: number[]): number[];
    createSkew(angleRadX: number, angleRadY: number, dest?: number[]): number[];
    preapply(dest: number[], mat: number[]): number[];
    apply(dest: number[], mat: number[]): number[];
}
declare namespace mirage {
    var mat3: IMatrix3Static;
}
declare var mat3: IMatrix3Static;
interface IMatrix4Static {
    create(src?: number[]): number[];
    copyTo(src: number[], dest: number[]): number[];
    identity(dest?: number[]): number[];
    equal(a: number[], b: number[]): boolean;
    multiply(a: number[], b: number[], dest?: number[]): number[];
    inverse(mat: number[], dest?: number[]): number[];
    transpose(mat: number[], dest?: number[]): number[];
    transformVec4(mat: number[], vec: number[], dest?: number[]): number[];
    createTranslate(x: number, y: number, z: number, dest?: number[]): number[];
    createScale(x: number, y: number, z: number, dest?: number[]): number[];
    createRotateX(theta: number, dest?: number[]): number[];
    createRotateY(theta: number, dest?: number[]): number[];
    createRotateZ(theta: number, dest?: number[]): number[];
    createPerspective(fieldOfViewY: number, aspectRatio: number, zNearPlane: number, zFarPlane: number, dest?: number[]): number[];
    createViewport(width: number, height: number, dest?: number[]): number[];
}
declare namespace mirage {
    var mat4: IMatrix4Static;
}
declare var mat4: IMatrix4Static;
declare namespace mirage {
}
interface IVector4Static {
    create(x: number, y: number, z: number, w: number): number[];
    init(x: number, y: number, z: number, w: number, dest?: number[]): number[];
}
declare namespace mirage {
    var vec4: IVector4Static;
}
declare var vec4: IVector4Static;
