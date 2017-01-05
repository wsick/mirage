namespace mirage.logging {
    export interface ILogger {
        doMeasure(node: core.LayoutNode);
        measure(node: core.LayoutNode, constraint: ISize);
        finishMeasure(node: core.LayoutNode);
        doArrange(node: core.LayoutNode);
        arrange(node: core.LayoutNode, final: IRect);
        finishArrange(node: core.LayoutNode);
    }
}