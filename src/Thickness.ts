namespace mirage {
    export class Thickness {
        left: number;
        top: number;
        right: number;
        bottom: number;

        constructor(left?: number, top?: number, right?: number, bottom?: number) {
            this.left = left == null ? 0 : left;
            this.top = top == null ? 0 : top;
            this.right = right == null ? 0 : right;
            this.bottom = bottom == null ? 0 : bottom;
        }

        static isEqual(t1: Thickness, t2: Thickness): boolean {
            return t1.left === t2.left
                && t1.top === t2.top
                && t1.right === t2.right
                && t1.bottom === t2.bottom;
        }

        static growSize(thickness: Thickness, dest: Size) {
            var w = dest.width;
            var h = dest.height;
            if (w != Number.POSITIVE_INFINITY)
                w += thickness.left + thickness.right;
            if (h != Number.POSITIVE_INFINITY)
                h += thickness.top + thickness.bottom;
            dest.width = w > 0 ? w : 0;
            dest.height = h > 0 ? h : 0;
            return dest;
        }

        static shrinkSize(thickness: Thickness, dest: Size) {
            var w = dest.width;
            var h = dest.height;
            if (w != Number.POSITIVE_INFINITY)
                w -= thickness.left + thickness.right;
            if (h != Number.POSITIVE_INFINITY)
                h -= thickness.top + thickness.bottom;
            dest.width = w > 0 ? w : 0;
            dest.height = h > 0 ? h : 0;
            return dest;
        }

        static shrinkRect(thickness: Thickness, dest: IRect) {
            dest.x += thickness.left;
            dest.y += thickness.top;
            dest.width -= thickness.left + thickness.right;
            dest.height -= thickness.top + thickness.bottom;
            if (dest.width < 0)
                dest.width = 0;
            if (dest.height < 0)
                dest.height = 0;
        }
    }
}