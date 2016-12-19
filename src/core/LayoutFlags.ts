namespace mirage.core {
    export enum LayoutFlags {
        none = 0,

        measure = 1 << 1,
        arrange = 1 << 2,

        measureHint = 1 << 3,
        arrangeHint = 1 << 4,
        sizeHint    = 1 << 5,
        hints       = measureHint | arrangeHint | sizeHint,
    }
}
