namespace mirage.core {
    export interface ILayoutTreeWalker {
        current: LayoutNode;
        step(): boolean;
    }

    export interface ILayoutTree {
        isContainer: boolean;
        isLayoutContainer: boolean;
        parent: LayoutNode;
        applyTemplate(): boolean;
        propagateFlagUp(flag: LayoutFlags);
        walk(reverse?: boolean): ILayoutTreeWalker;
    }
}