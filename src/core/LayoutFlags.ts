namespace mirage.core {
    export enum LayoutFlags {
        Measure = 1 << 1,
        Arrange = 1 << 2,

        MeasureHint = 1 << 3,
        ArrangeHint = 1 << 4,
        SizeHint    = 1 << 5,
    }
}
