namespace mirage.core {
    export function DefaultArranger(inputs: IArrangeInputs, state: IArrangeState, tree: ILayoutTree): IArranger {
        return NewArranger(inputs, state, tree, function(finalSize: ISize): ISize {
            var arranged = new Size(finalSize.width, finalSize.height);
            for (var walker = tree.walk(); walker.step();) {
                var childRect = new Rect(0, 0, finalSize.width, finalSize.height);
                walker.current.arrange(childRect);
            }
            return arranged;
        });
    }
}