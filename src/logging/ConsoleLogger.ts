namespace mirage.logging {
    export function NewConsoleLogger(getNodeDescriptor?: (node: core.LayoutNode) => string): ILogger {
        let curindent = "";

        function indent() {
            curindent += "  ";
        }

        function unindent() {
            curindent = curindent.substr(0, curindent.length - 2);
        }

        getNodeDescriptor = getNodeDescriptor || function (node): string {
                let type = <any>node.constructor;
                return `${type.name}`;
            };

        return {
            doMeasure(node: core.LayoutNode){
                console.log(`[do-measure]`);
            },
            measure(node: core.LayoutNode, constraint: ISize){
                console.log(`${curindent}${getNodeDescriptor(node)} => (${constraint.width} ${constraint.height}) [measure]`);
                indent();
            },
            finishMeasure(node: core.LayoutNode){
                unindent();
                let desired = node.state.desiredSize;
                console.log(`${curindent}${getNodeDescriptor(node)} <= (${desired.width} ${desired.height}) [finish-measure]`);
            },
            doArrange(node: core.LayoutNode){
                console.log(`[do-arrange]`);
            },
            arrange(node: core.LayoutNode, final: IRect){
                console.log(`${curindent}${getNodeDescriptor(node)} => (${final.x} ${final.y} ${final.width} ${final.height}) [arrange]`);
                indent();
            },
            finishArrange(node: core.LayoutNode){
                unindent();
                let slot = node.state.arrangedSlot;
                console.log(`${curindent}${getNodeDescriptor(node)} <= (${slot.x} ${slot.y} ${slot.width} ${slot.height}) [finish-arrange]`);
            },
        }
    }
}