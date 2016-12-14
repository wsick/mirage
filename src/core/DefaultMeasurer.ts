namespace mirage.core {
    export function DefaultMeasurer(inputs: IMeasureInputs, state: IMeasureState, tree: ILayoutTree): IMeasurer {
        return NewMeasurer(inputs, state, tree, function(framedSize: ISize): ISize {
            var desired = new Size();
            for (var walker = tree.walk(); walker.step();) {
                walker.current.measure(framedSize);
                Size.max(desired, walker.current.state.desiredSize);
            }
            return desired;
        });
    }
}