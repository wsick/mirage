namespace mirage {
    export interface IStackPanelInputs extends core.ILayoutNodeInputs {
        orientation: Orientation;
    }

    export class StackPanel extends Panel {
        inputs: IStackPanelInputs;

        protected createInputs(): IStackPanelInputs {
            var inputs = <IStackPanelInputs>super.createInputs();
            inputs.orientation = Orientation.Horizontal;
            return inputs;
        }

        protected measureOverride(constraint: ISize): ISize {
            if (this.inputs.orientation === Orientation.Vertical) {
                return this.measureVertical(constraint);
            } else {
                return this.measureHorizontal(constraint);
            }
        }

        private measureVertical(constraint: ISize): ISize {
            var ca = new Size(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
            var measured = new Size();
            var inputs = this.inputs;

            ca.width = constraint.width;
            if (!isNaN(inputs.width))
                ca.width = inputs.width;
            ca.width = Math.min(ca.width, inputs.maxWidth);
            ca.width = Math.max(ca.width, inputs.minWidth);

            for (var walker = this.tree.walk(); walker.step();) {
                var child = walker.current;
                child.measure(ca);

                var childDesired = child.state.desiredSize;
                measured.height += childDesired.height;
                measured.width = Math.max(measured.width, childDesired.width);
            }

            return measured;
        }

        private measureHorizontal(constraint: ISize): ISize {
            var ca = new Size(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
            var measured = new Size();
            var inputs = this.inputs;

            ca.height = constraint.height;
            if (!isNaN(inputs.height))
                ca.height = inputs.height;
            ca.height = Math.min(ca.height, inputs.maxHeight);
            ca.height = Math.max(ca.height, inputs.minHeight);

            for (var walker = this.tree.walk(); walker.step();) {
                var child = walker.current;
                child.measure(ca);

                var childDesired = child.state.desiredSize;
                measured.width += childDesired.width;
                measured.height = Math.max(measured.height, childDesired.height);
            }

            return measured;
        }

        protected arrangeOverride(arrangeSize: ISize): ISize {
            if (this.inputs.orientation === Orientation.Vertical) {
                return this.arrangeVertical(arrangeSize);
            } else {
                return this.arrangeHorizontal(arrangeSize);
            }
        }

        private arrangeVertical(arrangeSize: ISize): ISize {
            var arranged = new Size(arrangeSize.width, 0);

            for (var walker = this.tree.walk(); walker.step();) {
                var child = walker.current;
                var childDesired = child.state.desiredSize;
                var childFinal = new Rect(0, arranged.height, arrangeSize.width, childDesired.height);
                if (Rect.isEmpty(childFinal))
                    Rect.clear(childFinal);

                child.arrange(childFinal);

                arranged.width = Math.max(arranged.width, arrangeSize.width);
                arranged.height += childDesired.height;
            }

            arranged.height = Math.max(arranged.height, arrangeSize.height);

            return arranged;
        }

        private arrangeHorizontal(arrangeSize: ISize): ISize {
            var arranged = new Size(0, arrangeSize.height);

            for (var walker = this.tree.walk(); walker.step();) {
                var child = walker.current;
                var childDesired = child.state.desiredSize;
                var childFinal = new Rect(arranged.width, 0, childDesired.width, arrangeSize.height);
                if (Rect.isEmpty(childFinal))
                    Rect.clear(childFinal);

                child.arrange(childFinal);

                arranged.width += childDesired.width;
                arranged.height = Math.max(arranged.height, arrangeSize.height);
            }

            arranged.width = Math.max(arranged.width, arrangeSize.width);

            return arranged;
        }
    }
}