namespace mirage.core {
    export interface IArranger {
        (finalRect: Rect): boolean;
    }
    export interface IArrangeOverride {
        (finalSize: ISize): ISize;
    }

    export function NewArranger(inputs: ILayoutNodeInputs, state: ILayoutNodeState, tree: ILayoutTree, override: IArrangeOverride): IArranger {
        function calcOffer(childRect: IRect): ISize {
            var stretched = new Size(childRect.width, childRect.height);
            coerceSize(stretched, inputs);

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
            return offer;
        }

        function calcVisualOffset(childRect: IRect, arranged: ISize): IPoint {
            var constrained = new Size(arranged.width, arranged.height);
            coerceSize(constrained, inputs);
            Size.min(constrained, arranged);

            var vo = new Point();
            Point.copyTo(childRect, vo);
            switch (inputs.horizontalAlignment) {
                case HorizontalAlignment.left:
                    break;
                case HorizontalAlignment.right:
                    vo.x += childRect.width - constrained.width;
                    break;
                case HorizontalAlignment.center:
                    vo.x += (childRect.width - constrained.width) * 0.5;
                    break;
                default:
                    vo.x += Math.max((childRect.width - constrained.width) * 0.5, 0);
                    break;
            }
            switch (inputs.verticalAlignment) {
                case VerticalAlignment.top:
                    break;
                case VerticalAlignment.bottom:
                    vo.y += childRect.height - constrained.height;
                    break;
                case VerticalAlignment.center:
                    vo.y += (childRect.height - constrained.height) * 0.5;
                    break;
                default:
                    vo.y += Math.max((childRect.height - constrained.height) * 0.5, 0);
                    break;
            }
            if (inputs.useLayoutRounding) {
                Point.round(vo);
            }
            return vo;
        }

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

            // Prepare offer
            Thickness.shrinkRect(inputs.margin, childRect);
            var offer = calcOffer(childRect);

            // Do override
            var arranged = override(offer);

            // Complete override
            state.flags &= ~LayoutFlags.arrange;
            if (inputs.useLayoutRounding) {
                Size.round(arranged);
            }

            // Calculate visual offset
            var vo = calcVisualOffset(childRect, arranged);

            // If arranged slot moved, invalidate slotting
            if (!Point.isEqual(vo, state.arrangedSlot) || !Size.isEqual(arranged, state.arrangedSlot)) {
                Rect.copyTo(state.arrangedSlot, state.lastArrangedSlot);
                state.flags |= LayoutFlags.slotHint;
                tree.propagateFlagUp(LayoutFlags.slotHint);
            }

            // Finalize arrangedSlot
            Size.copyTo(arranged, state.arrangedSlot);
            Point.copyTo(vo, state.arrangedSlot);

            return true;
        }
    }
}