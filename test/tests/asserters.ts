namespace mirage.tests {
    export function arrangeState(got: mirage.core.LayoutNode, wantSlot: Rect, wantArrangedSlot: Rect, id: string) {
        deepEqual(got.state.layoutSlot, wantSlot, "[" + id + "]layoutSlot");
        deepEqual(got.state.arrangedSlot, wantArrangedSlot, "[" + id + "]arrangedSlot");
    }
}