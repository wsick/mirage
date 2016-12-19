namespace mirage.core {
    export interface IArrangeBinder {
        (): boolean;
    }

    export function NewArrangeBinder(state: IArrangeState, tree: ILayoutTree, arranger: IArranger): IArrangeBinder {
        return function (): boolean {
            var last = state.layoutSlot || undefined;
            if (!tree.parent)
                last = new Rect();

            if (last) {
                return arranger(last);
            } else if (tree.parent) {
                tree.parent.invalidateArrange();
            }
            return false;
        };
    }

    // TODO: This binder is not in use at this time
    // We should explore whether expand+shift is needed
    // If it is, we should push the "surface" size rather than pull it
    export function NewSpecialArrangeBinder(node: core.LayoutNode, arranger: IArranger): IArrangeBinder {
        var state = node.state;
        var tree = node.tree;

        function expandViewport(viewport: IRect) {
            /*
             if (tree.isLayoutContainer) {
             Size.copyTo(state.desiredSize, viewport);
             if (tree.surface) {
             var measure = state.previousAvailable;
             if (!Size.isUndef(measure)) {
             viewport.width = Math.max(viewport.width, measure.width);
             viewport.height = Math.max(viewport.height, measure.height);
             } else {
             viewport.width = tree.surface.width;
             viewport.height = tree.surface.height;
             }
             }
             } else {
             viewport.width = assets.actualWidth;
             viewport.height = assets.actualHeight;
             }
             */
        }

        function shiftViewport(viewport: IRect) {
            //NOTE: Coercing undefined, null, NaN, and 0 to 0
            //viewport.x =  Canvas.getLeft(node) || 0;
            //viewport.y = Canvas.getTop(node) || 0;
        }

        return function (): boolean {
            var last = state.layoutSlot || undefined;
            if (!tree.parent) {
                last = new Rect();
                expandViewport(last);
                shiftViewport(last);
            }

            if (last) {
                return arranger(last);
            } else if (tree.parent) {
                tree.parent.invalidateArrange();
            }
            return false;
        };
    }
}