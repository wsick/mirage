namespace mirage.tests {
    import LayoutFlags = mirage.core.LayoutFlags;

    QUnit.module("Panel");

    QUnit.test("children", () => {
        var sp = new StackPanel();

        var child1 = new core.LayoutNode();
        sp.appendChild(child1);
        strictEqual(child1.tree.parent, sp, "append parent");
        strictEqual(sp.childCount, 1, "append childCount");
        strictEqual(sp.getChildAt(0), child1, "append getChildAt");

        var child2 = new core.LayoutNode();
        sp.prependChild(child2);
        strictEqual(child2.tree.parent, sp, "prepend parent");
        strictEqual(sp.childCount, 2, "prepend childCount");
        strictEqual(sp.getChildAt(1), child1, "prepend getAt 1");
        strictEqual(sp.getChildAt(0), child2, "prepend getAt 0");

        var child3 = new core.LayoutNode();
        sp.insertChild(child3, 1);
        strictEqual(sp.getChildAt(2), child1, "insertChild getAt 2");
        strictEqual(sp.getChildAt(0), child2, "insertChild getAt 0");
        strictEqual(sp.getChildAt(1), child3, "insertChild getAt 1");
        sp.removeChildAt(1);

        sp.removeChildAt(0);
        equal(child2.tree.parent, null, "removeAt parent");

        sp.removeChild(child1);
        equal(child1.tree.parent, null, "remove parent");
        strictEqual(sp.childCount, 0, "remove childCount");
    });
}