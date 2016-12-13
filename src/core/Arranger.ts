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
        layoutSlot: Rect;
        visualOffset: Point;
        arranged: ISize;
        lastArranged: ISize;
    }

    export interface IArrangeBinder {
        (): boolean;
    }

    export function NewArrangeBinder(state: IArrangeState, tree: ILayoutTree, arranger: IArranger): IArrangeBinder {
        /*
         function expandViewport (viewport: Rect) {
         if (tree.isLayoutContainer) {
         Size.copyTo(state.desiredSize, viewport);
         if (tree.surface) {
         var measure = state.previousAvailable;
         if (!Size.isUndef(measure)) {
         viewport.width = Math.max(viewport.width, measure.width);
         viewport.height = Math.max(viewport.height, measure.height);
         } else {
         viewport.width = tree.surface.width;
         viewport.height = tree.surface.height;
         }
         }
         } else {
         viewport.width = assets.actualWidth;
         viewport.height = assets.actualHeight;
         }
         }
         function shiftViewport (viewport: Rect) {
         //NOTE: Coercing undefined, null, NaN, and 0 to 0
         viewport.x = updater.getAttachedValue("Canvas.Left") || 0;
         viewport.y = updater.getAttachedValue("Canvas.Top") || 0;
         }
         */

        return function (): boolean {
            var last = state.layoutSlot || undefined;
            /*
             TODO: This is intended to expand a top-level node to consume entire surface area
             - Do we need this?
             - Can we do this other ways?
             if (!tree.parent) {
             last = new Rect();
             expandViewport(last);
             shiftViewport(last);
             }
             */

            if (last) {
                return arranger(last);
            } else if (tree.parent) {
                tree.parent.invalidateArrange();
            }
            return false;
        };
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
            if ((state.flags & LayoutFlags.Arrange) <= 0) {
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
            if (inputs.horizontalAlignment === HorizontalAlignment.Stretch) {
                framework.width = Math.max(framework.width, stretched.width);
            }
            if (inputs.verticalAlignment === VerticalAlignment.Stretch) {
                framework.height = Math.max(framework.height, stretched.height);
            }
            var offer = new Size(state.hiddenDesire.width, state.hiddenDesire.height);
            Size.max(offer, framework);

            // Do override
            var arranged = override(offer);

            // Complete override
            state.flags &= ~LayoutFlags.Arrange;
            if (inputs.useLayoutRounding) {
                Size.round(arranged);
            }

            // Constrain
            var constrained = new Size(arranged.width, arranged.height);
            coerceSize(constrained, inputs);
            Size.min(constrained, arranged);

            // Calculate visual offset
            var vo = state.visualOffset;
            Point.copyTo(childRect, vo);
            switch (inputs.horizontalAlignment) {
                case HorizontalAlignment.Left:
                    break;
                case HorizontalAlignment.Right:
                    vo.x += childRect.width - constrained.width;
                    break;
                case HorizontalAlignment.Center:
                    vo.x += (childRect.width - constrained.width) * 0.5;
                    break;
                default:
                    vo.x += Math.max((childRect.width - constrained.width) * 0.5, 0);
                    break;
            }
            switch (inputs.verticalAlignment) {
                case VerticalAlignment.Top:
                    break;
                case VerticalAlignment.Bottom:
                    vo.y += childRect.height - constrained.height;
                    break;
                case VerticalAlignment.Center:
                    vo.y += (childRect.height - constrained.height) * 0.5;
                    break;
                default:
                    vo.y += Math.max((childRect.height - constrained.height) * 0.5, 0);
                    break;
            }
            if (inputs.useLayoutRounding) {
                Point.round(vo);
            }

            // Cycle old + current arranged for sizing
            var oldArrange = state.arranged;
            if (!Size.isEqual(oldArrange, arranged)) {
                Size.copyTo(oldArrange, state.lastArranged);
                state.flags |= LayoutFlags.SizeHint;
                tree.propagateFlagUp(LayoutFlags.SizeHint);
            }
            Size.copyTo(arranged, state.arranged);

            return true;
        }
    }
}