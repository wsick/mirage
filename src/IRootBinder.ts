namespace mirage {
    export interface IRootBinder {
        root: core.LayoutNode;
        draft(rootSize: ISize): boolean;
    }

    export interface IRenderBinder extends draft.IDraftUpdater {
    }

    export function NewRootBinder(root: core.LayoutNode, updater: IRenderBinder): IRootBinder {
        return {
            root: root,
            draft: draft.NewDrafter(root, updater),
        };
    }
}