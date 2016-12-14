namespace mirage {
    export class Panel extends core.LayoutNode {
        tree: IPanelTree;

        protected createTree(): core.ILayoutTree {
            return new PanelTree();
        }

        protected measureOverride(constraint: ISize): ISize {
            return new Size(constraint.width, constraint.height);
        }

        protected arrangeOverride(arrangeSize: ISize): ISize {
            return new Size(arrangeSize.width, arrangeSize.height);
        }
    }

    export interface IPanelTree extends core.ILayoutTree {
        children: core.LayoutNode[];
    }

    export function PanelTree(): IPanelTree {
        var tree = <IPanelTree>core.DefaultLayoutTree();
        tree.isLayoutContainer = true;
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