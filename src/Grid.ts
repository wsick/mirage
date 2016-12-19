/// <reference path="Panel" />

namespace mirage {
    export interface IGridInputs extends core.ILayoutNodeInputs {
        rowDefinitions: IRowDefinition[];
        columnDefinitions: IColumnDefinition[];
    }

    export interface IGridState extends core.ILayoutNodeState {
        design: grid.design.IGridDesign;
    }

    export class Grid extends Panel {
        static getColumn(node: core.LayoutNode): number {
            return node.getAttached("grid.column");
        }

        static setColumn(node: core.LayoutNode, value: number) {
            node.setAttached("grid.column", value);
        }

        static getColumnSpan(node: core.LayoutNode): number {
            return node.getAttached("grid.column-span");
        }

        static setColumnSpan(node: core.LayoutNode, value: number) {
            node.setAttached("grid.column-span", value);
        }

        static getRow(node: core.LayoutNode): number {
            return node.getAttached("grid.row");
        }

        static setRow(node: core.LayoutNode, value: number) {
            node.setAttached("grid.row", value);
        }

        static getRowSpan(node: core.LayoutNode): number {
            return node.getAttached("grid.row-span");
        }

        static setRowSpan(node: core.LayoutNode, value: number) {
            node.setAttached("grid.row-span", value);
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

        get rowDefinitions(): IRowDefinition[] {
            return this.inputs.rowDefinitions;
        }

        set rowDefinitions(value: IRowDefinition[]) {
            this.inputs.rowDefinitions = value;
            this.invalidateMeasure();
        }

        get columnDefinitions(): IColumnDefinition[] {
            return this.inputs.columnDefinitions;
        }

        set columnDefinitions(value: IColumnDefinition[]) {
            this.inputs.columnDefinitions = value;
            this.invalidateMeasure();
        }

        protected createInputs(): IGridInputs {
            var inputs = <IGridInputs>super.createInputs();
            inputs.rowDefinitions = [];
            inputs.columnDefinitions = [];
            return inputs;
        }

        protected createState(): IGridState {
            var state = <IGridState>super.createState();
            state.design = grid.design.NewGridDesign();
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