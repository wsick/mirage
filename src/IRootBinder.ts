namespace mirage {
    export interface IRootBinder {
        root: core.LayoutNode;
        draft(rootSize: ISize): boolean;
    }

    export interface IRenderUpdater extends draft.IDraftUpdater {
    }

    export function NewRootBinder(root: core.LayoutNode, updater: IRenderUpdater): IRootBinder {
        return {
            root: root,
            draft: draft.NewDrafter(root, updater),
        };
    }
}