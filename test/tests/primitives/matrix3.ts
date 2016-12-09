module mirana.tests.primitives.matrix {
    QUnit.module("primitives.matrix3");

    function typedToArray (typed) {
        var arr = [];
        for (var i = 0; i < typed.length; i++) {
            arr.push(typed[i]);
        }
        return arr;
    }

    QUnit.test("identity", () => {
        var m = mat3.identity();
        deepEqual(typedToArray(m), [1, 0, 0, 1, 0, 0]);
        var m2 = mat3.identity(m);
        strictEqual(m2, m);
    });

    QUnit.test("equal", () => {
        var m1 = mat3.create([1, 2, 3, 4, 5, 6]);
        var m2 = mat3.create([1, 2, 3, 4, 5, 6]);
        ok(mat3.equal(m1, m2));
    });

    QUnit.test("translate", () => {
        var m = mat3.createTranslate(1, 2);
        deepEqual(typedToArray(m), [1, 0, 0, 1, 1, 2]);

        mat3.translate(m, 1, 2);
        deepEqual(typedToArray(m), [1, 0, 0, 1, 2, 4]);

        deepEqual(typedToArray(mat3.multiply(mat3.createTranslate(1, 2), mat3.createTranslate(2, 4), mat3.create())), [1, 0, 0, 1, 3, 6]);
        deepEqual(typedToArray(mat3.multiply(mat3.createTranslate(2, 4), mat3.createTranslate(1, 2), mat3.create())), [1, 0, 0, 1, 3, 6]);

        var v = vec2.create(1, 1);
        mat3.transformVec2(mat3.createTranslate(1, 2), v);
        deepEqual(typedToArray(v), [2, 3]);
    });

    QUnit.test("scale", () => {
        var m = mat3.createScale(2, 4);
        deepEqual(typedToArray(m), [2, 0, 0, 4, 0, 0]);

        mat3.scale(m, 2, 4);
        deepEqual(typedToArray(m), [4, 0, 0, 16, 0, 0]);

        //s(2,4) * t(1,2)
        deepEqual(typedToArray(mat3.multiply(mat3.createTranslate(1, 2), mat3.createScale(2, 4), mat3.create())), [2, 0, 0, 4, 2, 8]);
        //t(1,2) * s(2,4)
        deepEqual(typedToArray(mat3.multiply(mat3.createScale(2, 4), mat3.createTranslate(1, 2), mat3.create())), [2, 0, 0, 4, 1, 2]);

        var v = vec2.create(1, 1);
        mat3.transformVec2(mat3.createScale(2, 4), v);
        deepEqual(typedToArray(v), [2, 4]);
    });

    var SQRT3_2 = Math.sqrt(3) / 2;
    QUnit.test("rotate", () => {
        var m = mat3.createRotate(-Math.PI / 6);
        ok(mat3.equal(m, mat3.create([SQRT3_2, -0.5, 0.5, SQRT3_2, 0, 0])));

        var angleRad = -Math.PI / 2;
        //t(1,2) * r(-90)
        m = mat3.multiply(mat3.createTranslate(1, 2), mat3.createRotate(angleRad), mat3.create());
        ok(mat3.equal(m, mat3.create([0, -1, 1, 0, 2, -1])));
        //r(-90) * t(1,2)
        m = mat3.multiply(mat3.createRotate(angleRad), mat3.createTranslate(1, 2), mat3.create());
        ok(mat3.equal(m, mat3.create([0, -1, 1, 0, 1, 2])));

        var v = vec2.create(1, 2);
        mat3.transformVec2(mat3.createRotate(Math.PI / 2), v);
        deepEqual(typedToArray(v), [-2, 1]);
    });

    QUnit.test("skew", () => {
        var m = mat3.createSkew(Math.PI / 4, 0);
        ok(mat3.equal(m, mat3.create([1, 0, 1, 1, 0, 0])));

        // | ┌──┐           |   ┌──┐
        // | |  |     -->   |  /  /
        // | └──┘           | └──┘
        // +---------       +---------
        var tl = vec2.create(1, 3);
        var tr = vec2.create(3, 3);
        var br = vec2.create(3, 1);
        var bl = vec2.create(1, 1);
        mat3.transformVec2(m, tl);
        mat3.transformVec2(m, tr);
        mat3.transformVec2(m, br);
        mat3.transformVec2(m, bl);

        deepEqual(typedToArray(tl), [4, 3]);
        deepEqual(typedToArray(tr), [6, 3]);
        deepEqual(typedToArray(br), [4, 1]);
        deepEqual(typedToArray(bl), [2, 1]);

        var angleRadX = Math.PI / 4;
        var angleRadY = 0;
        //sk(45, 0) * t(1,0)
        m = mat3.multiply(mat3.createTranslate(1, 0), mat3.createSkew(angleRadX, angleRadY), mat3.create());
        ok(mat3.equal(m, mat3.create([1, 0, 1, 1, 1, 0])));
        //t(1,0) * sk(45, 0)
        m = mat3.multiply(mat3.createSkew(angleRadX, angleRadY), mat3.createTranslate(1, 0), mat3.create());
        ok(mat3.equal(m, mat3.create([1, 0, 1, 1, 1, 0])));
    });
}