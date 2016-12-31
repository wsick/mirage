namespace mirage.tests {
    QUnit.module("LayoutNode");

    QUnit.test("converters", (assert) => {
        assert.strictEqual(convert.getConverter("visible")(null), true, "visible: (null)");
        assert.strictEqual(convert.getConverter("visible")(""), true, "visible: (empty)");
        assert.strictEqual(convert.getConverter("visible")("true"), true, "visible: true");
        assert.strictEqual(convert.getConverter("visible")("1"), true, "visible: 1");
        assert.strictEqual(convert.getConverter("visible")("visible"), true, "visible: visible");
        assert.strictEqual(convert.getConverter("visible")("0"), false, "visible: 0");
        assert.strictEqual(convert.getConverter("visible")("false"), false, "visible: false");

        assert.strictEqual(convert.getConverter("use-layout-rounding")(null), true, "use-layout-rounding: (null)");
        assert.strictEqual(convert.getConverter("use-layout-rounding")(""), true, "use-layout-rounding: (empty)");
        assert.strictEqual(convert.getConverter("use-layout-rounding")("true"), true, "use-layout-rounding: true");
        assert.strictEqual(convert.getConverter("use-layout-rounding")("1"), true, "use-layout-rounding: 1");
        assert.strictEqual(convert.getConverter("use-layout-rounding")("use-layout-rounding"), true, "use-layout-rounding: use-layout-rounding");
        assert.strictEqual(convert.getConverter("use-layout-rounding")("0"), false, "use-layout-rounding: 0");
        assert.strictEqual(convert.getConverter("use-layout-rounding")("false"), false, "use-layout-rounding: false");

        assert.deepEqual(convert.getConverter("margin")("5"), new Thickness(5, 5, 5, 5), "margin: 5");
        assert.deepEqual(convert.getConverter("margin")("5 10"), new Thickness(5, 10, 5, 10), "margin: 5 10");
        assert.deepEqual(convert.getConverter("margin")("5, 10"), new Thickness(5, 10, 5, 10), "margin: 5, 10");
        assert.deepEqual(convert.getConverter("margin")("5,10"), new Thickness(5, 10, 5, 10), "margin: 5,10");
        assert.deepEqual(convert.getConverter("margin")("5 10 15 20"), new Thickness(5, 10, 15, 20), "margin: 5 10 15 20");
        assert.deepEqual(convert.getConverter("margin")("5, 10, 15, 20"), new Thickness(5, 10, 15, 20), "margin: 5, 10, 15, 20");
        assert.deepEqual(convert.getConverter("margin")("5,10,15,20"), new Thickness(5, 10, 15, 20), "margin: 5,10,15,20");

        ok(isNaN(convert.getConverter("width")(null)), "width: (null)");
        ok(isNaN(convert.getConverter("width")("")), "width: (empty)");
        ok(isNaN(convert.getConverter("width")("NaN")), "width: NaN");
        assert.strictEqual(convert.getConverter("width")("10"), 10, "width: 10");
        assert.strictEqual(convert.getConverter("width")("10.5"), 10.5, "width: 10.5");

        ok(isNaN(convert.getConverter("height")(null)), "height: (null)");
        ok(isNaN(convert.getConverter("height")("")), "height: (empty)");
        ok(isNaN(convert.getConverter("height")("NaN")), "height: NaN");
        assert.strictEqual(convert.getConverter("height")("10"), 10, "height: 10");
        assert.strictEqual(convert.getConverter("height")("10.5"), 10.5, "height: 10.5");

        assert.strictEqual(convert.getConverter("min-width")(null), 0, "min-width: (null)");
        assert.strictEqual(convert.getConverter("min-width")(""), 0, "min-width: (empty)");
        assert.strictEqual(convert.getConverter("min-width")("NaN"), 0, "min-width: NaN");
        assert.strictEqual(convert.getConverter("min-width")("10"), 10, "min-width: 10");
        assert.strictEqual(convert.getConverter("min-width")("10.5"), 10.5, "min-width: 10.5");

        assert.strictEqual(convert.getConverter("min-height")(null), 0, "min-height: (null)");
        assert.strictEqual(convert.getConverter("min-height")(""), 0, "min-height: (empty)");
        assert.strictEqual(convert.getConverter("min-height")("NaN"), 0, "min-height: NaN");
        assert.strictEqual(convert.getConverter("min-height")("10"), 10, "min-height: 10");
        assert.strictEqual(convert.getConverter("min-height")("10.5"), 10.5, "min-height: 10.5");

        assert.strictEqual(convert.getConverter("max-width")(null), Number.POSITIVE_INFINITY, "max-width: (null)");
        assert.strictEqual(convert.getConverter("max-width")(""), Number.POSITIVE_INFINITY, "max-width: (empty)");
        assert.strictEqual(convert.getConverter("max-width")("NaN"), Number.POSITIVE_INFINITY, "max-width: NaN");
        assert.strictEqual(convert.getConverter("max-width")("10"), 10, "max-width: 10");
        assert.strictEqual(convert.getConverter("max-width")("10.5"), 10.5, "max-width: 10.5");

        assert.strictEqual(convert.getConverter("max-height")(null), Number.POSITIVE_INFINITY, "max-height: (null)");
        assert.strictEqual(convert.getConverter("max-height")(""), Number.POSITIVE_INFINITY, "max-height: (empty)");
        assert.strictEqual(convert.getConverter("max-height")("NaN"), Number.POSITIVE_INFINITY, "max-height: NaN");
        assert.strictEqual(convert.getConverter("max-height")("10"), 10, "max-height: 10");
        assert.strictEqual(convert.getConverter("max-height")("10.5"), 10.5, "max-height: 10.5");

        assert.strictEqual(convert.getConverter("horizontal-alignment")(null), HorizontalAlignment.stretch, "horizontal-alignment: (null)");
        assert.strictEqual(convert.getConverter("horizontal-alignment")(""), HorizontalAlignment.stretch, "horizontal-alignment: (empty)");
        assert.strictEqual(convert.getConverter("horizontal-alignment")("left"), HorizontalAlignment.left, "horizontal-alignment: left");
        assert.strictEqual(convert.getConverter("horizontal-alignment")("center"), HorizontalAlignment.center, "horizontal-alignment: center");
        assert.strictEqual(convert.getConverter("horizontal-alignment")("right"), HorizontalAlignment.right, "horizontal-alignment: right");
        assert.strictEqual(convert.getConverter("horizontal-alignment")("stretch"), HorizontalAlignment.stretch, "horizontal-alignment: stretch");

        assert.strictEqual(convert.getConverter("vertical-alignment")(null), VerticalAlignment.stretch, "vertical-alignment: (null)");
        assert.strictEqual(convert.getConverter("vertical-alignment")(""), VerticalAlignment.stretch, "vertical-alignment: (empty)");
        assert.strictEqual(convert.getConverter("vertical-alignment")("top"), VerticalAlignment.top, "vertical-alignment: top");
        assert.strictEqual(convert.getConverter("vertical-alignment")("center"), VerticalAlignment.center, "vertical-alignment: center");
        assert.strictEqual(convert.getConverter("vertical-alignment")("bottom"), VerticalAlignment.bottom, "vertical-alignment: bottom");
        assert.strictEqual(convert.getConverter("vertical-alignment")("stretch"), VerticalAlignment.stretch, "vertical-alignment: stretch");
    });
}