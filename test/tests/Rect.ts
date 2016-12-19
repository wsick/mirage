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

    QUnit.test("roundOut", () => {
        var r = new Rect(0.25, 0.75, 100.4, 199.8);
        Rect.roundOut(r);
        deepEqual(r, new Rect(0, 0, 101, 201));
    });

    QUnit.test("intersection", () => {
        var r1 = new Rect(0, 0, 100, 100);
        var r2 = new Rect(50, 50, 100, 100);
        Rect.intersection(r1, r2);
        deepEqual(r1, new Rect(50, 50, 50, 50), "r1 should be the intersection");
        deepEqual(r2, new Rect(50, 50, 100, 100), "r2 should remain unchanged");

        r1 = new Rect(0, 0, 100, 100);
        r2 = new Rect(50, 50, 25, 25);
        Rect.intersection(r1, r2);
        deepEqual(r1, new Rect(50, 50, 25, 25), "r1 should be the intersection");
        deepEqual(r2, new Rect(50, 50, 25, 25), "r2 should remain unchanged");

        r1 = new Rect(50, 50, 25, 25);
        r2 = new Rect(0, 0, 100, 100);
        Rect.intersection(r1, r2);
        deepEqual(r1, new Rect(50, 50, 25, 25), "r1 should be the intersection");
        deepEqual(r2, new Rect(0, 0, 100, 100), "r2 should remain unchanged");
    });

    QUnit.test("union", () => {
        var r1 = new Rect();
        var r2 = new Rect(0, 0, 100, 100);
        Rect.union(r1, r2);
        deepEqual(r1, new Rect(0, 0, 100, 100));

        r1 = new Rect(50, 50, 100, 100);
        r2 = new Rect();
        Rect.union(r1, r2);
        deepEqual(r1, new Rect(50, 50, 100, 100));

        r1 = new Rect(50, 50, 100, 100);
        r2 = new Rect(75, 75, 100, 100);
        Rect.union(r1, r2);
        deepEqual(r1, new Rect(50, 50, 125, 125));

        r1 = new Rect(50, 50, 100, 100);
        r2 = new Rect(0, 0, 200, 100);
        Rect.union(r1, r2);
        deepEqual(r1, new Rect(0, 0, 200, 150));
    });

    QUnit.test("isContainedIn", () => {
        var r1 = new Rect(0, 0, 100, 100);
        var r2 = new Rect(50, 50, 25, 25);
        ok(!Rect.isContainedIn(r1, r2));

        r1 = new Rect(50, 50, 25, 25);
        r2 = new Rect(0, 0, 100, 100);
        ok(Rect.isContainedIn(r1, r2));
    });
}