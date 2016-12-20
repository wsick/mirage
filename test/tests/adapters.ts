namespace mirage.tests {
    QUnit.module("adapters");

    QUnit.test("updateSlots", () => {
        var canvas = new Canvas();
        canvas.invalidateMeasure();
        canvas.invalidateArrange();

        var child1 = new core.LayoutNode();
        child1.width = 100;
        child1.height = 50;
        canvas.appendChild(child1);

        var passes: mirage.draft.ISlotUpdate[][] = [];
        var adapter: mirage.adapters.IRenderAdapter = {
            updateSlots(updates: mirage.draft.ISlotUpdate[]) {
                passes.push(updates);
            },
        };

        mirage.adapters.register(adapter);
        try {
            ok(mirage.draft.NewDrafter(canvas, new Size(600, 600))(), "draft updated");
        } finally {
            mirage.adapters.unregister(adapter);
        }
    });
}