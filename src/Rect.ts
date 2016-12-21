namespace mirage {
    export interface IRect extends IPoint, ISize {
    }

    export class Rect implements IRect {
        x: number;
        y: number;
        width: number;
        height: number;

        constructor(x?: number, y?: number, width?: number, height?: number) {
            this.x = x == null ? 0 : x;
            this.y = y == null ? 0 : y;
            this.width = width == null ? 0 : width;
            this.height = height == null ? 0 : height;
        }

        static clear(rect: IRect) {
            rect.x = rect.y = rect.width = rect.height = 0;
        }

        static isEqual(rect1: IRect, rect2: IRect): boolean {
            return rect1.x === rect2.x
                && rect1.y === rect2.y
                && rect1.width === rect2.width
                && rect1.height === rect2.height;
        }

        static isEmpty(src: IRect): boolean {
            return src.width === 0
                || src.height === 0;
        }

        static copyTo(src: IRect, dest: IRect) {
            dest.x = src.x;
            dest.y = src.y;
            dest.width = src.width;
            dest.height = src.height;
        }
    }
}