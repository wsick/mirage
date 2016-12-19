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
        deepEqual(parseGridLength("2*"), {value: 2, type: GridUnitType.star}, "star");
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
}