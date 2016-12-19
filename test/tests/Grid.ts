namespace mirage.tests {
    import LayoutFlags = mirage.core.LayoutFlags;

    QUnit.module("Grid");

    function sameRowDef(got: IRowDefinition, wantHeight: IGridLength, wantMin: number, wantMax: number, message?: string) {
        deepEqual(got.height, wantHeight, "height " + message);
        strictEqual(got.minHeight, wantMin, "min " + message);
        strictEqual(got.maxHeight, wantMax, "max " + message);
    }

    function sameColDef(got: IColumnDefinition, wantWidth: IGridLength, wantMin: number, wantMax: number, message?: string) {
        deepEqual(got.width, wantWidth, "width " + message);
        strictEqual(got.minWidth, wantMin, "min " + message);
        strictEqual(got.maxWidth, wantMax, "max " + message);
    }

    QUnit.test("parseGridLength", () => {
        deepEqual(parseGridLength("auto"), {value: 0, type: GridUnitType.auto}, "auto");
        deepEqual(parseGridLength("20"), {value: 20, type: GridUnitType.pixel}, "pixel");
        deepEqual(parseGridLength("20.2"), {value: 20, type: GridUnitType.pixel}, "pixel (decimal)");
        deepEqual(parseGridLength("*"), {value: 1, type: GridUnitType.star}, "star");
        deepEqual(parseGridLength("2*"), {value: 2, type: GridUnitType.star}, "2 star");
    });

    QUnit.test("NewRowDefinition", () => {
        sameRowDef(NewRowDefinition(), {value: 0, type: GridUnitType.auto}, 0, Number.POSITIVE_INFINITY, "0");
        sameRowDef(NewRowDefinition("auto"), {value: 0, type: GridUnitType.auto}, 0, Number.POSITIVE_INFINITY, "1");
        sameRowDef(NewRowDefinition(0, GridUnitType.auto), {
            value: 0,
            type: GridUnitType.auto
        }, 0, Number.POSITIVE_INFINITY, "2");
        sameRowDef(NewRowDefinition("auto", 10, 50), {value: 0, type: GridUnitType.auto}, 10, 50, "3");
        sameRowDef(NewRowDefinition(0, GridUnitType.auto, 10, 50), {value: 0, type: GridUnitType.auto}, 10, 50, "4");
    });

    QUnit.test("NewColumnDefinition", () => {
        sameColDef(NewColumnDefinition(), {value: 0, type: GridUnitType.auto}, 0, Number.POSITIVE_INFINITY, "0");
        sameColDef(NewColumnDefinition("auto"), {value: 0, type: GridUnitType.auto}, 0, Number.POSITIVE_INFINITY, "1");
        sameColDef(NewColumnDefinition(0, GridUnitType.auto), {
            value: 0,
            type: GridUnitType.auto
        }, 0, Number.POSITIVE_INFINITY, "2");
        sameColDef(NewColumnDefinition("auto", 10, 50), {value: 0, type: GridUnitType.auto}, 10, 50, "3");
        sameColDef(NewColumnDefinition(0, GridUnitType.auto, 10, 50), {value: 0, type: GridUnitType.auto}, 10, 50, "4");
    });

    QUnit.test("scenario1", () => {
        var grid = new Grid();
        // no defined row defs => 1 "auto" row
        // no defined col defs => 1 "auto" col
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
}