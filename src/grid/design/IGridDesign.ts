namespace mirage.grid.design {
    export interface IGridDesign {
        measure: IGridMeasureDesign;
        arrange: IGridArrangeDesign;
    }

    export function NewGridDesign(): IGridDesign {
        var cm: Segment[][] = [];
        var rm: Segment[][] = [];

        return {
            measure: NewGridMeasureDesign(cm, rm),
            arrange: NewGridArrangeDesign(cm, rm),
        };
    }
}