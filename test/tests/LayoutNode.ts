namespace mirage.tests {
    QUnit.module("LayoutNode");

    QUnit.test("converters", (assert) => {
        assert.strictEqual(convert.fromString("visible", null), true, "visible: (null)");
        assert.strictEqual(convert.fromString("visible", ""), true, "visible: (empty)");
        assert.strictEqual(convert.fromString("visible", "true"), true, "visible: true");
        assert.strictEqual(convert.fromString("visible", "1"), true, "visible: 1");
        assert.strictEqual(convert.fromString("visible", "visible"), true, "visible: visible");
        assert.strictEqual(convert.fromString("visible", "0"), false, "visible: 0");
        assert.strictEqual(convert.fromString("visible", "false"), false, "visible: false");

        assert.strictEqual(convert.fromString("use-layout-rounding", null), true, "use-layout-rounding: (null)");
        assert.strictEqual(convert.fromString("use-layout-rounding", ""), true, "use-layout-rounding: (empty)");
        assert.strictEqual(convert.fromString("use-layout-rounding", "true"), true, "use-layout-rounding: true");
        assert.strictEqual(convert.fromString("use-layout-rounding", "1"), true, "use-layout-rounding: 1");
        assert.strictEqual(convert.fromString("use-layout-rounding", "use-layout-rounding"), true, "use-layout-rounding: use-layout-rounding");
        assert.strictEqual(convert.fromString("use-layout-rounding", "0"), false, "use-layout-rounding: 0");
        assert.strictEqual(convert.fromString("use-layout-rounding", "false"), false, "use-layout-rounding: false");

        assert.deepEqual(convert.fromString("margin", "5"), new Thickness(5, 5, 5, 5), "margin: 5");
        assert.deepEqual(convert.fromString("margin", "5 10"), new Thickness(5, 10, 5, 10), "margin: 5 10");
        assert.deepEqual(convert.fromString("margin", "5, 10"), new Thickness(5, 10, 5, 10), "margin: 5, 10");
        assert.deepEqual(convert.fromString("margin", "5,10"), new Thickness(5, 10, 5, 10), "margin: 5,10");
        assert.deepEqual(convert.fromString("margin", "5 10 15 20"), new Thickness(5, 10, 15, 20), "margin: 5 10 15 20");
        assert.deepEqual(convert.fromString("margin", "5, 10, 15, 20"), new Thickness(5, 10, 15, 20), "margin: 5, 10, 15, 20");
        assert.deepEqual(convert.fromString("margin", "5,10,15,20"), new Thickness(5, 10, 15, 20), "margin: 5,10,15,20");

        ok(isNaN(convert.fromString("width", null)), "width: (null)");
        ok(isNaN(convert.fromString("width", "")), "width: (empty)");
        ok(isNaN(convert.fromString("width", "NaN")), "width: NaN");
        assert.strictEqual(convert.fromString("width", "10"), 10, "width: 10");
        assert.strictEqual(convert.fromString("width", "10.5"), 10.5, "width: 10.5");

        ok(isNaN(convert.fromString("height", null)), "height: (null)");
        ok(isNaN(convert.fromString("height", "")), "height: (empty)");
        ok(isNaN(convert.fromString("height", "NaN")), "height: NaN");
        assert.strictEqual(convert.fromString("height", "10"), 10, "height: 10");
        assert.strictEqual(convert.fromString("height", "10.5"), 10.5, "height: 10.5");

        assert.strictEqual(convert.fromString("min-width", null), 0, "min-width: (null)");
        assert.strictEqual(convert.fromString("min-width", ""), 0, "min-width: (empty)");
        assert.strictEqual(convert.fromString("min-width", "NaN"), 0, "min-width: NaN");
        assert.strictEqual(convert.fromString("min-width", "10"), 10, "min-width: 10");
        assert.strictEqual(convert.fromString("min-width", "10.5"), 10.5, "min-width: 10.5");

        assert.strictEqual(convert.fromString("min-height", null), 0, "min-height: (null)");
        assert.strictEqual(convert.fromString("min-height", ""), 0, "min-height: (empty)");
        assert.strictEqual(convert.fromString("min-height", "NaN"), 0, "min-height: NaN");
        assert.strictEqual(convert.fromString("min-height", "10"), 10, "min-height: 10");
        assert.strictEqual(convert.fromString("min-height", "10.5"), 10.5, "min-height: 10.5");

        assert.strictEqual(convert.fromString("max-width", null), Number.POSITIVE_INFINITY, "max-width: (null)");
        assert.strictEqual(convert.fromString("max-width", ""), Number.POSITIVE_INFINITY, "max-width: (empty)");
        assert.strictEqual(convert.fromString("max-width", "NaN"), Number.POSITIVE_INFINITY, "max-width: NaN");
        assert.strictEqual(convert.fromString("max-width", "10"), 10, "max-width: 10");
        assert.strictEqual(convert.fromString("max-width", "10.5"), 10.5, "max-width: 10.5");

        assert.strictEqual(convert.fromString("max-height", null), Number.POSITIVE_INFINITY, "max-height: (null)");
        assert.strictEqual(convert.fromString("max-height", ""), Number.POSITIVE_INFINITY, "max-height: (empty)");
        assert.strictEqual(convert.fromString("max-height", "NaN"), Number.POSITIVE_INFINITY, "max-height: NaN");
        assert.strictEqual(convert.fromString("max-height", "10"), 10, "max-height: 10");
        assert.strictEqual(convert.fromString("max-height", "10.5"), 10.5, "max-height: 10.5");

        assert.strictEqual(convert.fromString("horizontal-alignment", null), HorizontalAlignment.stretch, "horizontal-alignment: (null)");
        assert.strictEqual(convert.fromString("horizontal-alignment", ""), HorizontalAlignment.stretch, "horizontal-alignment: (empty)");
        assert.strictEqual(convert.fromString("horizontal-alignment", "left"), HorizontalAlignment.left, "horizontal-alignment: left");
        assert.strictEqual(convert.fromString("horizontal-alignment", "center"), HorizontalAlignment.center, "horizontal-alignment: center");
        assert.strictEqual(convert.fromString("horizontal-alignment", "right"), HorizontalAlignment.right, "horizontal-alignment: right");
        assert.strictEqual(convert.fromString("horizontal-alignment", "stretch"), HorizontalAlignment.stretch, "horizontal-alignment: stretch");

        assert.strictEqual(convert.fromString("vertical-alignment", null), VerticalAlignment.stretch, "vertical-alignment: (null)");
        assert.strictEqual(convert.fromString("vertical-alignment", ""), VerticalAlignment.stretch, "vertical-alignment: (empty)");
        assert.strictEqual(convert.fromString("vertical-alignment", "top"), VerticalAlignment.top, "vertical-alignment: top");
        assert.strictEqual(convert.fromString("vertical-alignment", "center"), VerticalAlignment.center, "vertical-alignment: center");
        assert.strictEqual(convert.fromString("vertical-alignment", "bottom"), VerticalAlignment.bottom, "vertical-alignment: bottom");
        assert.strictEqual(convert.fromString("vertical-alignment", "stretch"), VerticalAlignment.stretch, "vertical-alignment: stretch");
    });
}