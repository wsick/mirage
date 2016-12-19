namespace mirage.grid {
    export function NewGridArrangeOverride(inputs: IGridInputs, state: IGridState, tree: IPanelTree): core.IArrangeOverride {
        var des = state.design.arrange;

        return function (arrangeSize: ISize): ISize {
            des.init(arrangeSize, inputs.columnDefinitions, inputs.rowDefinitions);

            var cr = new Rect();
            for (var walker = tree.walk(); walker.step();) {
                var child = walker.current;
                des.calcChildRect(cr, child);
                child.arrange(cr);
            }

            return new Size(arrangeSize.width, arrangeSize.height);
        };
    }
}