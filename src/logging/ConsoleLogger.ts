namespace mirage.logging {
    export function NewConsoleLogger(): ILogger {
        let curindent = "";

        function indent() {
            curindent += "  ";
        }

        function unindent() {
            curindent = curindent.substr(0, curindent.length - 2);
        }

        function getNodeDescriptor(node: core.LayoutNode): string {
            let type = <any>node.constructor;
            return `${type.name}`;
        }

        return {
            doMeasure(node: core.LayoutNode){
                console.log(`[do-measure]${curindent} ${getNodeDescriptor(node)}`);
            },
            measure(node: core.LayoutNode, constraint: ISize){
                console.log(`[measure]${curindent} ${getNodeDescriptor(node)} => (${constraint.width} ${constraint.height})`);
                indent();
            },
            finishMeasure(node: core.LayoutNode){
                unindent();
                let desired = node.state.desiredSize;
                console.log(`[finish-measure]${curindent} ${getNodeDescriptor(node)} => (${desired.width} ${desired.height})`);
            },
            doArrange(node: core.LayoutNode){
                console.log(`[do-arrange]${curindent} ${getNodeDescriptor(node)}`);
            },
            arrange(node: core.LayoutNode, final: IRect){
                console.log(`[arrange]${curindent} ${getNodeDescriptor(node)} => (${final.x} ${final.y} ${final.width} ${final.height})`);
                indent();
            },
            finishArrange(node: core.LayoutNode){
                unindent();
                let slot = node.state.arrangedSlot;
                console.log(`[finish-arrange]${curindent} ${getNodeDescriptor(node)} => (${slot.x} ${slot.y} ${slot.width} ${slot.height})`);
            },
        }
    }
}