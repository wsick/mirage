namespace mirage.core {
    export interface IArrangeInputs {
        visible: boolean;
        margin: Thickness;
        width: number;
        height: number;
        minWidth: number;
        minHeight: number;
        maxWidth: number;
        maxHeight: number;
        useLayoutRounding: boolean;
        horizontalAlignment: HorizontalAlignment;
        verticalAlignment: VerticalAlignment;
    }

    export interface IArrangeState {
        flags: LayoutFlags;
        previousAvailable: ISize;
        desiredSize: ISize;
        hiddenDesire: ISize;
        layoutSlot: IRect;
        arrangedSlot: IRect;
        lastArranged: ISize;
    }


    export interface IArranger {
        (finalRect: Rect): boolean;
    }
    export interface IArrangeOverride {
        (finalSize: ISize): ISize;
    }

    export function NewArranger(inputs: IArrangeInputs, state: IArrangeState, tree: ILayoutTree, override: IArrangeOverride): IArranger {
        return function (finalRect: Rect): boolean {
            if (inputs.visible !== true) {
                return false;
            }

            // Apply rounding
            var childRect = new Rect();
            if (inputs.useLayoutRounding) {
                childRect.x = Math.round(finalRect.x);
                childRect.y = Math.round(finalRect.y);
                childRect.width = Math.round(finalRect.width);
                childRect.height = Math.round(finalRect.height);
            } else {
                Rect.copyTo(finalRect, childRect);
            }

            // Validate
            if (childRect.width < 0 || childRect.height < 0
                || !isFinite(childRect.width) || !isFinite(childRect.height)
                || isNaN(childRect.x) || isNaN(childRect.y)
                || isNaN(childRect.width) || isNaN(childRect.height)) {
                console.warn("[mirage] cannot call arrange using rect with NaN/infinite values.");
                return false;
            }

            // Check need to arrange
            if ((state.flags & LayoutFlags.arrange) <= 0) {
                return false;
            }
            if (Rect.isEqual(state.layoutSlot, childRect)) {
                return false;
            }
            Rect.copyTo(childRect, state.layoutSlot);

            // Calculate stretched
            Thickness.shrinkRect(inputs.margin, childRect);
            var stretched = new Size(childRect.width, childRect.height);
            coerceSize(stretched, inputs);

            // Prepare override
            var framework = new Size();
            coerceSize(framework, inputs);
            if (inputs.horizontalAlignment === HorizontalAlignment.stretch) {
                framework.width = Math.max(framework.width, stretched.width);
            }
            if (inputs.verticalAlignment === VerticalAlignment.stretch) {
                framework.height = Math.max(framework.height, stretched.height);
            }
            var offer = new Size(state.hiddenDesire.width, state.hiddenDesire.height);
            Size.max(offer, framework);

            // Do override
            var arranged = override(offer);

            // Complete override
            state.flags &= ~LayoutFlags.arrange;
            if (inputs.useLayoutRounding) {
                Size.round(arranged);
            }

            // Constrain
            var constrained = new Size(arranged.width, arranged.height);
            coerceSize(constrained, inputs);
            Size.min(constrained, arranged);

            // Calculate visual offset
            var as = state.arrangedSlot;
            Point.copyTo(childRect, as);
            switch (inputs.horizontalAlignment) {
                case HorizontalAlignment.left:
                    break;
                case HorizontalAlignment.right:
                    as.x += childRect.width - constrained.width;
                    break;
                case HorizontalAlignment.center:
                    as.x += (childRect.width - constrained.width) * 0.5;
                    break;
                default:
                    as.x += Math.max((childRect.width - constrained.width) * 0.5, 0);
                    break;
            }
            switch (inputs.verticalAlignment) {
                case VerticalAlignment.top:
                    break;
                case VerticalAlignment.bottom:
                    as.y += childRect.height - constrained.height;
                    break;
                case VerticalAlignment.center:
                    as.y += (childRect.height - constrained.height) * 0.5;
                    break;
                default:
                    as.y += Math.max((childRect.height - constrained.height) * 0.5, 0);
                    break;
            }
            if (inputs.useLayoutRounding) {
                Point.round(as);
            }

            // Cycle old + current arranged for sizing
            var oldArrange = state.arrangedSlot;
            if (!Size.isEqual(oldArrange, arranged)) {
                Size.copyTo(oldArrange, state.lastArranged);
                state.flags |= LayoutFlags.sizeHint;
                tree.propagateFlagUp(LayoutFlags.sizeHint);
            }
            Size.copyTo(arranged, state.arrangedSlot);

            return true;
        }
    }
}