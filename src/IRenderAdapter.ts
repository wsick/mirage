namespace mirage.adapters {
    export interface IRenderAdapter {
        updateSlots(updates: draft.ISlotUpdate[]);
    }

    var registered: IRenderAdapter[] = [];

    export function register(adapter: IRenderAdapter) {
        if (registered.indexOf(adapter) < 0) {
            registered.push(adapter);
        }
    }

    export function unregister(adapter: IRenderAdapter) {
        var index = registered.indexOf(adapter);
        if (index > -1)
            registered.splice(index, 1);
    }

    export function updateSlots(updates: draft.ISlotUpdate[]) {
        for (var i = 0; i < registered.length; i++) {
            registered[i].updateSlots(updates);
        }
    }
}