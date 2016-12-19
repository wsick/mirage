namespace mirage.tests {
    export function arrangeState(got: mirage.core.LayoutNode, wantSlot: IRect, wantArrangedSlot: IRect, id: string) {
        deepEqual(got.state.layoutSlot, wantSlot, "[" + id + "]layoutSlot");
        deepEqual(got.state.arrangedSlot, wantArrangedSlot, "[" + id + "]arrangedSlot");
    }
}