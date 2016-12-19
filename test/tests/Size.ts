module mirage.tests {
    QUnit.module("Size");

    QUnit.test("isEqual", () => {
        notDeepEqual(new Size(0, 0), new Size(0, 120));
        notDeepEqual(new Size(0, 0), new Size(120, 0));
        notDeepEqual(new Size(0, 0), new Size(120, 120));
        deepEqual(new Size(120, 120), new Size(120, 120));
    });

    QUnit.test("copyTo", (assert) => {
        var orig = new Size(100, 150);
        var copy = new Size(0, 0);
        Size.copyTo(orig, copy);
        deepEqual(copy, orig);

        var origr = new Rect(10, 10, 99, 199);
        Size.copyTo(origr, copy);
        deepEqual(copy, new Size(99, 199));

        var copyr = new Rect(0, 0, 80, 120);
        Size.copyTo(origr, copyr);
        deepEqual(copyr, new Rect(0, 0, 99, 199));
    });
}