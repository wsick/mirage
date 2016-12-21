module mirage.tests {
    QUnit.module("Rect");

    QUnit.test("copyTo", () => {
        var origr = new Rect(10, 10, 150, 300);
        var copyr = new Rect(0, 0, 80, 120);
        Rect.copyTo(origr, copyr);
        deepEqual(copyr, new Rect(10, 10, 150, 300));
    });

    QUnit.test("isEqual", () => {
        ok(!Rect.isEqual(new Rect(10, 10, 150, 300), new Rect(0, 0, 80, 120)));
        ok(Rect.isEqual(new Rect(0, 0, 80, 100), new Rect(0, 0, 80, 100)));
    });

    QUnit.test("isEmpty", () => {
        var r1 = new Rect();
        ok(Rect.isEmpty(r1));

        r1 = new Rect(1, 1, 1, 0);
        ok(Rect.isEmpty(r1));

        r1 = new Rect(1, 1, 0, 1);
        ok(Rect.isEmpty(r1));

        r1 = new Rect(1, 1, 1, 1);
        ok(!Rect.isEmpty(r1));
    });
}