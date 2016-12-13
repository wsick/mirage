namespace mirage.core {
    export interface ILayoutTree {
        isLayoutContainer: boolean;
        parent: LayoutNode;
        applyTemplate(): boolean;
        propagateFlagUp(flag: LayoutFlags);
    }
}