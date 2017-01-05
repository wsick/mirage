namespace mirage.logging {
    export function NewNoLogger(): ILogger {
        return {
            doMeasure(node: core.LayoutNode){
            },
            measure(node: core.LayoutNode, constraint: ISize){
            },
            finishMeasure(node: core.LayoutNode){
            },
            doArrange(node: core.LayoutNode){
            },
            arrange(node: core.LayoutNode, finalRect: IRect){
            },
            finishArrange(node: core.LayoutNode){
            },
        };
    }
}