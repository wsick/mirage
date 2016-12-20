/// <reference path="Panel" />

namespace mirage {
    export class Canvas extends Panel {
        static getLeft(node: core.LayoutNode): number {
            return node.getAttached("canvas.left");
        }

        static setLeft(node: core.LayoutNode, value: number) {
            node.setAttached("canvas.left", value);
            node.invalidateArrange();
        }

        static getTop(node: core.LayoutNode): number {
            return node.getAttached("canvas.top");
        }

        static setTop(node: core.LayoutNode, value: number) {
            node.setAttached("canvas.top", value);
            node.invalidateArrange();
        }

        protected measureOverride(constraint: ISize): ISize {
            var available = new Size(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
            for (var walker = this.tree.walk(); walker.step();) {
                walker.current.measure(available);
            }
            return new Size();
        }

        protected arrangeOverride(arrangeSize: ISize): ISize {
            var cr = new Rect();
            for (var walker = this.tree.walk(); walker.step();) {
                let child = walker.current;
                //NOTE: Coercing undefined, null, NaN, and 0 to 0
                cr.x = Canvas.getLeft(child) || 0;
                cr.y = Canvas.getTop(child) || 0;
                Size.copyTo(child.state.desiredSize, cr);
                child.arrange(cr);
            }
            return arrangeSize;
        }
    }
}