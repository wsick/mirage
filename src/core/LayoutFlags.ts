namespace mirage.core {
    export enum LayoutFlags {
        None = 0,

        Measure = 1 << 1,
        Arrange = 1 << 2,

        MeasureHint = 1 << 3,
        ArrangeHint = 1 << 4,
        SizeHint    = 1 << 5,
        Hints       = MeasureHint | ArrangeHint | SizeHint,
    }
}
