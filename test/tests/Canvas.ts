namespace mirage.tests {
    import LayoutFlags = mirage.core.LayoutFlags;

    QUnit.module("Canvas");

    QUnit.test("draft-scenario1", () => {
        var canvas = new Canvas();
        canvas.invalidateMeasure();

        var child1 = new core.LayoutNode();
        child1.width = 100;
        child1.height = 50;
        canvas.appendChild(child1);

        var child2 = new core.LayoutNode();
        child2.width = 50;
        child2.height = 50;
        Canvas.setLeft(child2, 100);
        Canvas.setTop(child2, 200);
        canvas.appendChild(child2);

        var child3 = new core.LayoutNode();
        child3.width = 75;
        child3.height = 50;
        Canvas.setLeft(child3, 300);
        Canvas.setTop(child3, 600);
        canvas.appendChild(child3);

        // measure
        ok(canvas.measure(new Size(600, 600)), "measure changed");
        strictEqual(canvas.state.flags & LayoutFlags.measure, 0, "measure flag cleared");
        deepEqual(canvas.state.desiredSize, new Size(0, 0), "desiredSize");

        // arrange
        ok(canvas.arrange(new Rect(0, 0, 600, 600)), "arrange changed");
        strictEqual(canvas.state.flags & LayoutFlags.arrange, 0, "arrange flag cleared");
        arrangeState(canvas, new Rect(0, 0, 600, 600), new Rect(0, 0, 600, 600), "root");
        arrangeState(child1, new Rect(0, 0, 100, 50), new Rect(0, 0, 100, 50), "child1");
        arrangeState(child2, new Rect(100, 200, 50, 50), new Rect(100, 200, 50, 50), "child2");
        arrangeState(child3, new Rect(300, 600, 75, 50), new Rect(300, 600, 75, 50), "child3");
    });

    QUnit.test("mappers", (assert) => {
        var node = new core.LayoutNode();

        map.getMapper("canvas.left")(node, 50);
        assert.deepEqual(Canvas.getLeft(node), 50, "canvas.left");

        map.getMapper("canvas.top")(node, 100);
        assert.deepEqual(Canvas.getTop(node), 100, "canvas.top");
    });

    QUnit.test("converters", (assert) => {
        assert.strictEqual(convert.getConverter("canvas.top")(null), 0, "canvas.top: (null)");
        assert.strictEqual(convert.getConverter("canvas.top")(""), 0, "canvas.top: (empty)");
        assert.strictEqual(convert.getConverter("canvas.top")("0"), 0, "canvas.top: 0");
        assert.strictEqual(convert.getConverter("canvas.top")("100.2"), 100.2, "canvas.top: 100.2");

        assert.strictEqual(convert.getConverter("canvas.left")(null), 0, "canvas.left: (null)");
        assert.strictEqual(convert.getConverter("canvas.left")(""), 0, "canvas.left: (empty)");
        assert.strictEqual(convert.getConverter("canvas.left")("0"), 0, "canvas.left: 0");
        assert.strictEqual(convert.getConverter("canvas.left")("100.2"), 100.2, "canvas.left: 100.2");
    });
}