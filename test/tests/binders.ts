namespace mirage.tests {
    QUnit.module("binders");

    QUnit.test("updateSlots", () => {
        var canvas = new Canvas();
        canvas.invalidateMeasure();
        canvas.invalidateArrange();

        var child1 = new core.LayoutNode();
        child1.width = 100;
        child1.height = 50;
        canvas.appendChild(child1);

        var passes: mirage.draft.ISlotUpdate[][] = [];
        var updater: mirage.IRenderUpdater = {
            updateSlots(updates: mirage.draft.ISlotUpdate[]) {
                passes.push(updates);
            },
        };

        var rootBinder = NewRootBinder(canvas, updater);
        ok(rootBinder.draft(new Size(600, 600)), "draft updated");

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