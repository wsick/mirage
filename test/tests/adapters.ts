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

        strictEqual(passes.length, 1, "1 slot pass");
        var firstPass = passes[0];
        if (firstPass) {
            strictEqual(firstPass.length, 2, "2 node updates in first slot pass");

            strictEqual(firstPass[0].node, child1, "child1 node update");
            deepEqual(firstPass[0].newRect, new Rect(0, 0, 100, 50), "child1 new slot");

            strictEqual(firstPass[1].node, canvas, "canvas node update");
            deepEqual(firstPass[1].newRect, new Rect(0, 0, 600, 600), "canvas new slot");
        }
    });
}