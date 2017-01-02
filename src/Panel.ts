/// <reference path="core/LayoutNode" />
/// <reference path="typeLookup" />

namespace mirage {
    export class Panel extends core.LayoutNode {
        tree: IPanelTree;

        protected createTree(): core.ILayoutTree {
            return NewPanelTree();
        }

        protected measureOverride(constraint: ISize): ISize {
            let measured = new Size();
            for (let walker = this.tree.walk(); walker.step();) {
                let child = walker.current;
                child.measure(constraint);
                Size.max(measured, child.state.desiredSize);
            }
            return measured;
        }

        protected arrangeOverride(arrangeSize: ISize): ISize {
            let finalRect = new Rect(0, 0, arrangeSize.width, arrangeSize.height);
            for (let walker = this.tree.walk(); walker.step();) {
                walker.current.arrange(finalRect);
            }
            return new Size(arrangeSize.width, arrangeSize.height);
        }

        get childCount(): number {
            return this.tree.children.length;
        }

        insertChild(child: core.LayoutNode, index: number) {
            var children = this.tree.children;
            if (index >= children.length) {
                this.appendChild(child);
            } else if (index <= 0) {
                this.prependChild(child);
            } else {
                children.splice(index, 0, child);
                child.setParent(this);
            }
        }

        prependChild(child: core.LayoutNode) {
            this.tree.children.unshift(child);
            child.setParent(this);
        }

        appendChild(child: core.LayoutNode) {
            this.tree.children.push(child);
            child.setParent(this);
        }

        removeChild(child: core.LayoutNode): boolean {
            var children = this.tree.children;
            var index = children.indexOf(child);
            if (index < 0)
                return false;
            this.tree.children.splice(index, 1);
            child.setParent(null);
            return true;
        }

        removeChildAt(index: number): core.LayoutNode {
            var children = this.tree.children;
            if (index < 0 || index >= children.length)
                return null;
            var removed = children.splice(index, 1)[0];
            if (removed)
                removed.setParent(null);
            return removed;
        }

        getChildAt(index: number): core.LayoutNode {
            return this.tree.children[index];
        }

        indexOfChild(child: core.LayoutNode): number {
            return this.tree.children.indexOf(child);
        }
    }
    registerNodeType("panel", Panel);

    export interface IPanelTree extends core.ILayoutTree {
        children: core.LayoutNode[];
    }

    export function NewPanelTree(): IPanelTree {
        var tree = <IPanelTree>core.DefaultLayoutTree();
        tree.children = [];
        tree.walk = (reverse?: boolean): core.ILayoutTreeWalker => {
            if (!reverse) {
                var i = -1;
                return {
                    current: undefined,
                    step(): boolean {
                        i++;
                        if (i >= tree.children.length) {
                            this.current = undefined;
                            return false;
                        }
                        this.current = tree.children[i];
                        return true;
                    },
                };
            } else {
                var i = tree.children.length;
                return {
                    current: undefined,
                    step(): boolean {
                        i--;
                        if (i < 0) {
                            this.current = undefined;
                            return false;
                        }
                        this.current = tree.children[i];
                        return true;
                    },
                }
            }
        };
        return tree;
    }
}