namespace mirage.tests {
    import LayoutFlags = mirage.core.LayoutFlags;

    QUnit.module("StackPanel");

    QUnit.test("draft-vertical", () => {
        var sp = new StackPanel();
        sp.inputs.orientation = Orientation.Vertical;
        sp.invalidateMeasure();

        var child1 = new core.LayoutNode();
        child1.inputs.width = 100;
        child1.inputs.height = 50;
        sp.appendChild(child1);

        var child2 = new core.LayoutNode();
        child2.inputs.width = 50;
        child2.inputs.height = 50;
        child2.inputs.horizontalAlignment = HorizontalAlignment.Center;
        sp.appendChild(child2);

        var child3 = new core.LayoutNode();
        child3.inputs.width = 75;
        child3.inputs.height = 50;
        child3.inputs.horizontalAlignment = HorizontalAlignment.Right;
        sp.appendChild(child3);

        // measure
        ok(sp.measure(new Size(200, Number.POSITIVE_INFINITY)), "measure changed");
        strictEqual(sp.state.flags & LayoutFlags.Measure, 0, "measure flag cleared");
        deepEqual(sp.state.desiredSize, new Size(100, 150), "desiredSize");

        // arrange
        ok(sp.arrange(new Rect(0, 0, 200, 200)), "arrange changed");
        strictEqual(sp.state.flags & LayoutFlags.Arrange, 0, "arrange flag cleared");
        arrangeState(sp, new Rect(0, 0, 200, 200), new Rect(0, 0, 200, 200), "root");
        arrangeState(child1, new Rect(0, 0, 200, 50), new Rect(50, 0, 100, 50), "child1");
        arrangeState(child2, new Rect(0, 50, 200, 50), new Rect(75, 50, 50, 50), "child2");
        arrangeState(child3, new Rect(0, 100, 200, 50), new Rect(125, 100, 75, 50), "child3");
    });

    QUnit.test("draft-horizontal", () => {
        var sp = new StackPanel();
        sp.inputs.orientation = Orientation.Horizontal;
        sp.invalidateMeasure();

        var child1 = new core.LayoutNode();
        child1.inputs.width = 50;
        child1.inputs.height = 100;
        sp.appendChild(child1);

        var child2 = new core.LayoutNode();
        child2.inputs.width = 50;
        child2.inputs.height = 50;
        child2.inputs.verticalAlignment = VerticalAlignment.Center;
        sp.appendChild(child2);

        var child3 = new core.LayoutNode();
        child3.inputs.width = 50;
        child3.inputs.height = 75;
        child3.inputs.verticalAlignment = VerticalAlignment.Bottom;
        sp.appendChild(child3);

        // measure
        ok(sp.measure(new Size(Number.POSITIVE_INFINITY, 200)), "measure success");
        strictEqual(sp.state.flags & LayoutFlags.Measure, 0, "measure flag cleared");
        deepEqual(sp.state.desiredSize, new Size(150, 100), "desiredSize");

        // arrange
        ok(sp.arrange(new Rect(0, 0, 200, 200)), "arrange change");
        strictEqual(sp.state.flags & LayoutFlags.Arrange, 0, "arrange flag cleared");
        arrangeState(sp, new Rect(0, 0, 200, 200), new Rect(0, 0, 200, 200), "root");
        arrangeState(child1, new Rect(0, 0, 50, 200), new Rect(0, 50, 50, 100), "child1");
        arrangeState(child2, new Rect(50, 0, 50, 200), new Rect(50, 75, 50, 50), "child2");
        arrangeState(child3, new Rect(100, 0, 50, 200), new Rect(100, 125, 50, 75), "child3");
    });
}