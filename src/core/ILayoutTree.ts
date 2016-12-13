namespace mirage.core {
    export interface ILayoutTree {
        isLayoutContainer: boolean;
        parent: any;
        applyTemplate(): boolean;
        propagateFlagUp(flag: LayoutFlags);
    }
}