namespace mirage.tests {
    import LayoutFlags = mirage.core.LayoutFlags;

    QUnit.module("Grid");

    interface IRowDefinitionRaw {
        height: IGridLength;
        minHeight: number;
        maxHeight: number;
    }

    function sameRowDef(got: IRowDefinition, want: IRowDefinitionRaw, message?: string) {
        deepEqual(got.height, want.height, "height " + message);
        strictEqual(got.minHeight, want.minHeight, "min " + message);
        strictEqual(got.maxHeight, want.maxHeight, "max " + message);
    }

    function sameRowDefs(got: IRowDefinition[], want: IRowDefinitionRaw[], message: string) {
        strictEqual(got.length, want.length, `length - ${message}`);
        for (let i = 0; i < got.length && i < want.length; i++) {
            sameRowDef(got[i], want[i], `${message}[${i}]`);
        }
    }

    interface IColumnDefinitionRaw {
        width: IGridLength;
        minWidth: number;
        maxWidth: number;
    }

    function sameColDef(got: IColumnDefinition, want: IColumnDefinitionRaw, message?: string) {
        deepEqual(got.width, want.width, "width " + message);
        strictEqual(got.minWidth, want.minWidth, "min " + message);
        strictEqual(got.maxWidth, want.maxWidth, "max " + message);
    }

    function sameColDefs(got: IColumnDefinition[], want: IColumnDefinitionRaw[], message: string) {
        strictEqual(got.length, want.length, `length - ${message}`);
        for (let i = 0; i < got.length && i < want.length; i++) {
            sameColDef(got[i], want[i], `${message}[${i}]`);
        }
    }

    QUnit.test("parseGridLength", () => {
        deepEqual(parseGridLength("auto"), {value: 0, type: GridUnitType.auto}, "auto");
        deepEqual(parseGridLength("20"), {value: 20, type: GridUnitType.pixel}, "pixel");
        deepEqual(parseGridLength("20.2"), {value: 20, type: GridUnitType.pixel}, "pixel (decimal)");
        deepEqual(parseGridLength("*"), {value: 1, type: GridUnitType.star}, "star");
        deepEqual(parseGridLength("2*"), {value: 2, type: GridUnitType.star}, "2 star");
    });

    QUnit.test("NewRowDefinition", () => {
        sameRowDef(NewRowDefinition(), {
            height: {value: 1, type: GridUnitType.star},
            minHeight: 0,
            maxHeight: Number.POSITIVE_INFINITY
        }, "0");
        sameRowDef(NewRowDefinition("auto"), {
            height: {value: 0, type: GridUnitType.auto},
            minHeight: 0,
            maxHeight: Number.POSITIVE_INFINITY
        }, "1");
        sameRowDef(NewRowDefinition(0, GridUnitType.auto), {
            height: {
                value: 0,
                type: GridUnitType.auto
            }, minHeight: 0, maxHeight: Number.POSITIVE_INFINITY
        }, "2");
        sameRowDef(NewRowDefinition("auto", 10, 50), {
            height: {value: 0, type: GridUnitType.auto},
            minHeight: 10,
            maxHeight: 50
        }, "3");
        sameRowDef(NewRowDefinition(0, GridUnitType.auto, 10, 50), {
            height: {value: 0, type: GridUnitType.auto},
            minHeight: 10,
            maxHeight: 50
        }, "4");
    });

    QUnit.test("NewColumnDefinition", () => {
        sameColDef(NewColumnDefinition(), {
            width: {value: 1, type: GridUnitType.star},
            minWidth: 0,
            maxWidth: Number.POSITIVE_INFINITY
        }, "0");
        sameColDef(NewColumnDefinition("auto"), {
            width: {value: 0, type: GridUnitType.auto},
            minWidth: 0,
            maxWidth: Number.POSITIVE_INFINITY
        }, "1");
        sameColDef(NewColumnDefinition(0, GridUnitType.auto), {
            width: {value: 0, type: GridUnitType.auto},
            minWidth: 0,
            maxWidth: Number.POSITIVE_INFINITY
        }, "2");
        sameColDef(NewColumnDefinition("auto", 10, 50), {
            width: {value: 0, type: GridUnitType.auto},
            minWidth: 10,
            maxWidth: 50
        }, "3");
        sameColDef(NewColumnDefinition(0, GridUnitType.auto, 10, 50), {
            width: {value: 0, type: GridUnitType.auto},
            minWidth: 10,
            maxWidth: 50
        }, "4");
    });

    QUnit.test("draft-scenario1", () => {
        var grid = new Grid();
        // no defined row defs => 1*
        // no defined col defs => 1*
        grid.invalidateMeasure();

        var child1 = new core.LayoutNode();
        child1.width = 100;
        child1.height = 50;
        grid.appendChild(child1);

        var child2 = new core.LayoutNode();
        child2.width = 50;
        child2.height = 50;
        child2.horizontalAlignment = HorizontalAlignment.center;
        child2.verticalAlignment = VerticalAlignment.center;
        grid.appendChild(child2);

        var child3 = new core.LayoutNode();
        child3.width = 75;
        child3.height = 50;
        child3.horizontalAlignment = HorizontalAlignment.right;
        child3.verticalAlignment = VerticalAlignment.bottom;
        grid.appendChild(child3);

        // measure
        ok(grid.measure(new Size(200, 200)), "measure changed");
        strictEqual(grid.state.flags & LayoutFlags.measure, 0, "measure flag cleared");
        deepEqual(grid.state.desiredSize, new Size(100, 50), "desiredSize");

        // arrange
        ok(grid.arrange(new Rect(0, 0, 200, 200)), "arrange changed");
        strictEqual(grid.state.flags & LayoutFlags.arrange, 0, "arrange flag cleared");
        arrangeState(grid, new Rect(0, 0, 200, 200), new Rect(0, 0, 200, 200), "root");
        arrangeState(child1, new Rect(0, 0, 200, 200), new Rect(50, 75, 100, 50), "child1");
        arrangeState(child2, new Rect(0, 0, 200, 200), new Rect(75, 75, 50, 50), "child2");
        arrangeState(child3, new Rect(0, 0, 200, 200), new Rect(125, 150, 75, 50), "child3");
    });

    QUnit.test("draft-scenario2", () => {
        var grid = new Grid();
        // 1* 2* 1* => 25% 50% 25%
        grid.rowDefinitions = NewRowDefinitions("1* 2* *");
        // no defined col defs => 1*
        grid.invalidateMeasure();

        var child1 = new core.LayoutNode();
        child1.width = 100;
        child1.height = 50;
        grid.appendChild(child1);

        var child2 = new core.LayoutNode();
        child2.width = 100;
        child2.height = 50;
        Grid.setRow(child2, 1);
        grid.appendChild(child2);

        var child3 = new core.LayoutNode();
        child3.width = 100;
        child3.height = 50;
        Grid.setRow(child3, 2);
        grid.appendChild(child3);

        // measure
        ok(grid.measure(new Size(400, 400)), "measure changed");
        strictEqual(grid.state.flags & LayoutFlags.measure, 0, "measure flag cleared");
        deepEqual(grid.state.desiredSize, new Size(100, 150), "desiredSize");

        // arrange
        ok(grid.arrange(new Rect(0, 0, 400, 400)), "arrange changed");
        strictEqual(grid.state.flags & LayoutFlags.arrange, 0, "arrange flag cleared");
        arrangeState(grid, new Rect(0, 0, 400, 400), new Rect(0, 0, 400, 400), "root");
        arrangeState(child1, new Rect(0, 0, 400, 100), new Rect(150, 25, 100, 50), "child1");
        arrangeState(child2, new Rect(0, 100, 400, 200), new Rect(150, 175, 100, 50), "child2");
        arrangeState(child3, new Rect(0, 300, 400, 100), new Rect(150, 325, 100, 50), "child3");
    });

    QUnit.test("draft-scenario3", () => {
        var grid = new Grid();
        // no defined row defs => 1*
        // 1* auto 50 col defs => (given child constraints) 250 100 50
        grid.columnDefinitions = NewColumnDefinitions("* auto 50");
        grid.invalidateMeasure();

        var child1 = new core.LayoutNode();
        child1.width = 50;
        child1.height = 50;
        grid.appendChild(child1);

        var child2 = new core.LayoutNode();
        child2.width = 100;
        child2.height = 50;
        Grid.setColumn(child2, 1);
        grid.appendChild(child2);

        var child3 = new core.LayoutNode();
        child3.width = 50;
        child3.height = 50;
        Grid.setColumn(child3, 2);
        grid.appendChild(child3);

        // measure
        ok(grid.measure(new Size(400, 400)), "measure changed");
        strictEqual(grid.state.flags & LayoutFlags.measure, 0, "measure flag cleared");
        deepEqual(grid.state.desiredSize, new Size(150, 50), "desiredSize");

        // arrange
        ok(grid.arrange(new Rect(0, 0, 400, 400)), "arrange changed");
        strictEqual(grid.state.flags & LayoutFlags.arrange, 0, "arrange flag cleared");
        arrangeState(grid, new Rect(0, 0, 400, 400), new Rect(0, 0, 400, 400), "root");
        arrangeState(child1, new Rect(0, 0, 250, 400), new Rect(100, 175, 50, 50), "child1");
        arrangeState(child2, new Rect(250, 0, 100, 400), new Rect(250, 175, 100, 50), "child2");
        arrangeState(child3, new Rect(350, 0, 50, 400), new Rect(350, 175, 50, 50), "child3");
    });

    QUnit.test("converters", (assert) => {
        assert.strictEqual(convert.getConverter("grid.row")(null), 0, "grid.row: (null)");
        assert.strictEqual(convert.getConverter("grid.row")(""), 0, "grid.row: (empty)");
        assert.strictEqual(convert.getConverter("grid.row")("0"), 0, "grid.row: 0");
        assert.strictEqual(convert.getConverter("grid.row")("2"), 2, "grid.row: 2");
        assert.strictEqual(convert.getConverter("grid.row")("2.2"), 2, "grid.row: 2.2");

        assert.strictEqual(convert.getConverter("grid.row-span")(null), 0, "grid.row-span: (null)");
        assert.strictEqual(convert.getConverter("grid.row-span")(""), 0, "grid.row-span: (empty)");
        assert.strictEqual(convert.getConverter("grid.row-span")("0"), 0, "grid.row-span: 0");
        assert.strictEqual(convert.getConverter("grid.row-span")("2"), 2, "grid.row-span: 2");
        assert.strictEqual(convert.getConverter("grid.row-span")("2.2"), 2, "grid.row-span: 2.2");

        assert.strictEqual(convert.getConverter("grid.column")(null), 0, "grid.column: (null)");
        assert.strictEqual(convert.getConverter("grid.column")(""), 0, "grid.column: (empty)");
        assert.strictEqual(convert.getConverter("grid.column")("0"), 0, "grid.column: 0");
        assert.strictEqual(convert.getConverter("grid.column")("2"), 2, "grid.column: 2");
        assert.strictEqual(convert.getConverter("grid.column")("2.2"), 2, "grid.column: 2.2");

        assert.strictEqual(convert.getConverter("grid.column-span")(null), 0, "grid.column-span: (null)");
        assert.strictEqual(convert.getConverter("grid.column-span")(""), 0, "grid.column-span: (empty)");
        assert.strictEqual(convert.getConverter("grid.column-span")("0"), 0, "grid.column-span: 0");
        assert.strictEqual(convert.getConverter("grid.column-span")("2"), 2, "grid.column-span: 2");
        assert.strictEqual(convert.getConverter("grid.column-span")("2.2"), 2, "grid.column-span: 2.2");

        sameRowDefs(convert.getConverter("row-definitions")("* auto 100"), [
            {height: {value: 1, type: GridUnitType.star}, minHeight: 0, maxHeight: Number.POSITIVE_INFINITY},
            {height: {value: 0, type: GridUnitType.auto}, minHeight: 0, maxHeight: Number.POSITIVE_INFINITY},
            {height: {value: 100, type: GridUnitType.pixel}, minHeight: 0, maxHeight: Number.POSITIVE_INFINITY},
        ], "row-definitions: * auto 100");

        sameColDefs(convert.getConverter("column-definitions")("* auto 100"), [
            {width: {value: 1, type: GridUnitType.star}, minWidth: 0, maxWidth: Number.POSITIVE_INFINITY},
            {width: {value: 0, type: GridUnitType.auto}, minWidth: 0, maxWidth: Number.POSITIVE_INFINITY},
            {width: {value: 100, type: GridUnitType.pixel}, minWidth: 0, maxWidth: Number.POSITIVE_INFINITY},
        ], "column-definitions: * auto 100");
    });
}