namespace mirage.grid {
    export function NewGridArrangeOverride(inputs: IGridInputs, state: IGridState, tree: IPanelTree): core.IArrangeOverride {
        return function (arrangeSize: ISize): ISize {
            state.matrix.restoreMeasure();
            state.matrix.calcActuals(arrangeSize, inputs.columnDefinitions, inputs.rowDefinitions);

            var cr = new Rect();
            for (var walker = tree.walk(); walker.step();) {
                var child = walker.current;
                state.matrix.calcChildRect(cr,
                    Grid.getColumn(child),
                    Grid.getColumnSpan(child),
                    Grid.getRow(child),
                    Grid.getRowSpan(child));
                child.arrange(cr);
            }

            return new Size(arrangeSize.width, arrangeSize.height);
        };
    }
}