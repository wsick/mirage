/// <reference path="Panel" />

namespace mirage {
    export interface IGridInputs extends core.ILayoutNodeInputs {
        rowDefinitions: IRowDefinition[];
        columnDefinitions: IColumnDefinition[];
    }

    export interface IGridState extends core.ILayoutNodeState {
        matrix: grid.IGridMatrix;
    }

    export class Grid extends Panel {
        static getColumn(node: core.LayoutNode): number {
            //TODO:
            return 0;
        }
        static getColumnSpan(node: core.LayoutNode): number {
            //TODO:
            return 1;
        }
        static getRow(node: core.LayoutNode): number {
            //TODO:
            return 0;
        }
        static getRowSpan(node: core.LayoutNode): number {
            //TODO:
            return 1;
        }

        inputs: IGridInputs;
        state: IGridState;

        private $measureOverride: core.IMeasureOverride;
        private $arrangeOverride: core.IArrangeOverride;

        init() {
            super.init();
            this.$measureOverride = grid.NewGridMeasureOverride(this.inputs, this.state, this.tree);
            this.$arrangeOverride = grid.NewGridArrangeOverride(this.inputs, this.state, this.tree);
        }

        protected createInputs(): IGridInputs {
            var inputs = <IGridInputs>super.createInputs();
            inputs.rowDefinitions = [];
            inputs.columnDefinitions = [];
            return inputs;
        }

        protected createState(): IGridState {
            var state = <IGridState>super.createState();
            state.matrix = grid.NewGridMatrix();
            return state;
        }

        protected measureOverride(constraint: ISize): ISize {
            return this.$measureOverride(constraint);
        }

        protected arrangeOverride(arrangeSize: ISize): ISize {
            return this.$arrangeOverride(arrangeSize);
        }
    }
}