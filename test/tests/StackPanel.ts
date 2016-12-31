namespace mirage.tests {
    import LayoutFlags = mirage.core.LayoutFlags;

    QUnit.module("StackPanel");

    QUnit.test("draft-vertical", () => {
        var sp = new StackPanel();
        sp.orientation = Orientation.vertical;
        sp.invalidateMeasure();

        var child1 = new core.LayoutNode();
        child1.width = 100;
        child1.height = 50;
        sp.appendChild(child1);

        var child2 = new core.LayoutNode();
        child2.width = 50;
        child2.height = 50;
        child2.horizontalAlignment = HorizontalAlignment.center;
        sp.appendChild(child2);

        var child3 = new core.LayoutNode();
        child3.width = 75;
        child3.height = 50;
        child3.horizontalAlignment = HorizontalAlignment.right;
        sp.appendChild(child3);

        // measure
        ok(sp.measure(new Size(200, Number.POSITIVE_INFINITY)), "measure changed");
        strictEqual(sp.state.flags & LayoutFlags.measure, 0, "measure flag cleared");
        deepEqual(sp.state.desiredSize, new Size(100, 150), "desiredSize");

        // arrange
        ok(sp.arrange(new Rect(0, 0, 200, 200)), "arrange changed");
        strictEqual(sp.state.flags & LayoutFlags.arrange, 0, "arrange flag cleared");
        arrangeState(sp, new Rect(0, 0, 200, 200), new Rect(0, 0, 200, 200), "root");
        arrangeState(child1, new Rect(0, 0, 200, 50), new Rect(50, 0, 100, 50), "child1");
        arrangeState(child2, new Rect(0, 50, 200, 50), new Rect(75, 50, 50, 50), "child2");
        arrangeState(child3, new Rect(0, 100, 200, 50), new Rect(125, 100, 75, 50), "child3");
    });

    QUnit.test("draft-horizontal", () => {
        var sp = new StackPanel();
        sp.orientation = Orientation.horizontal;
        sp.invalidateMeasure();

        var child1 = new core.LayoutNode();
        child1.width = 50;
        child1.height = 100;
        sp.appendChild(child1);

        var child2 = new core.LayoutNode();
        child2.width = 50;
        child2.height = 50;
        child2.verticalAlignment = VerticalAlignment.center;
        sp.appendChild(child2);

        var child3 = new core.LayoutNode();
        child3.width = 50;
        child3.height = 75;
        child3.verticalAlignment = VerticalAlignment.bottom;
        sp.appendChild(child3);

        // measure
        ok(sp.measure(new Size(Number.POSITIVE_INFINITY, 200)), "measure success");
        strictEqual(sp.state.flags & LayoutFlags.measure, 0, "measure flag cleared");
        deepEqual(sp.state.desiredSize, new Size(150, 100), "desiredSize");

        // arrange
        ok(sp.arrange(new Rect(0, 0, 200, 200)), "arrange change");
        strictEqual(sp.state.flags & LayoutFlags.arrange, 0, "arrange flag cleared");
        arrangeState(sp, new Rect(0, 0, 200, 200), new Rect(0, 0, 200, 200), "root");
        arrangeState(child1, new Rect(0, 0, 50, 200), new Rect(0, 50, 50, 100), "child1");
        arrangeState(child2, new Rect(50, 0, 50, 200), new Rect(50, 75, 50, 50), "child2");
        arrangeState(child3, new Rect(100, 0, 50, 200), new Rect(100, 125, 50, 75), "child3");
    });

    QUnit.test("setters", (assert) => {
        var stackPanel = new StackPanel();

        map.getSetter("orientation")(stackPanel, Orientation.vertical);
        assert.deepEqual(stackPanel.orientation, Orientation.vertical, "orientation");
    });

    QUnit.test("converters", (assert) => {
        assert.strictEqual(convert.getConverter("orientation")(null), Orientation.horizontal, "orientation: (null)");
        assert.strictEqual(convert.getConverter("orientation")(""), Orientation.horizontal, "orientation: (empty)");
        assert.strictEqual(convert.getConverter("orientation")("horizontal"), Orientation.horizontal, "orientation: horizontal");
        assert.strictEqual(convert.getConverter("orientation")("vertical"), Orientation.vertical, "orientation: vertical");
    });
}