namespace mirage.tests {
    export function arrangeState(got: mirage.core.LayoutNode, wantSlot: Rect, wantVisualOffset: Point, wantArranged: Size, id: string) {
        deepEqual(got.state.layoutSlot, wantSlot, "[" + id + "]layoutSlot");
        deepEqual(got.state.visualOffset, wantVisualOffset, "[" + id + "]visualOffset");
        deepEqual(got.state.arranged, wantArranged, "[" + id + "]arranged");
    }
}