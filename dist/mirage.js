var mirage;
(function (mirage) {
    mirage.version = '0.1.0';
})(mirage || (mirage = {}));
var mirage;
(function (mirage) {
    var CornerRadius = (function () {
        function CornerRadius(topLeft, topRight, bottomRight, bottomLeft) {
            this.topLeft = topLeft == null ? 0 : topLeft;
            this.topRight = topRight == null ? 0 : topRight;
            this.bottomRight = bottomRight == null ? 0 : bottomRight;
            this.bottomLeft = bottomLeft == null ? 0 : bottomLeft;
        }
        CornerRadius.isEmpty = function (cr) {
            return cr.topLeft === 0
                && cr.topRight === 0
                && cr.bottomRight === 0
                && cr.bottomLeft === 0;
        };
        CornerRadius.isEqual = function (cr1, cr2) {
            return cr1.topLeft === cr2.topLeft
                && cr1.topRight === cr2.topRight
                && cr1.bottomRight === cr2.bottomRight
                && cr1.bottomLeft === cr2.bottomLeft;
        };
        CornerRadius.clear = function (dest) {
            dest.topLeft = dest.topRight = dest.bottomRight = dest.bottomLeft = 0;
        };
        CornerRadius.copyTo = function (cr2, dest) {
            dest.topLeft = cr2.topLeft;
            dest.topRight = cr2.topRight;
            dest.bottomRight = cr2.bottomRight;
            dest.bottomLeft = cr2.bottomLeft;
        };
        return CornerRadius;
    })();
    mirage.CornerRadius = CornerRadius;
})(mirage || (mirage = {}));
var mirage;
(function (mirage) {
    (function (HorizontalAlignment) {
        HorizontalAlignment[HorizontalAlignment["Left"] = 0] = "Left";
        HorizontalAlignment[HorizontalAlignment["Center"] = 1] = "Center";
        HorizontalAlignment[HorizontalAlignment["Right"] = 2] = "Right";
        HorizontalAlignment[HorizontalAlignment["Stretch"] = 3] = "Stretch";
    })(mirage.HorizontalAlignment || (mirage.HorizontalAlignment = {}));
    var HorizontalAlignment = mirage.HorizontalAlignment;
    (function (VerticalAlignment) {
        VerticalAlignment[VerticalAlignment["Top"] = 0] = "Top";
        VerticalAlignment[VerticalAlignment["Center"] = 1] = "Center";
        VerticalAlignment[VerticalAlignment["Bottom"] = 2] = "Bottom";
        VerticalAlignment[VerticalAlignment["Stretch"] = 3] = "Stretch";
    })(mirage.VerticalAlignment || (mirage.VerticalAlignment = {}));
    var VerticalAlignment = mirage.VerticalAlignment;
    (function (Orientation) {
        Orientation[Orientation["Horizontal"] = 0] = "Horizontal";
        Orientation[Orientation["Vertical"] = 1] = "Vertical";
    })(mirage.Orientation || (mirage.Orientation = {}));
    var Orientation = mirage.Orientation;
})(mirage || (mirage = {}));
var mirage;
(function (mirage) {
    var core;
    (function (core) {
        var LayoutNode = (function () {
            function LayoutNode() {
                this.init();
            }
            LayoutNode.prototype.init = function () {
                Object.defineProperties(this, {
                    "inputs": { value: this.createInputs(), writable: false },
                    "state": { value: this.createState(), writable: false },
                    "tree": { value: this.createTree(), writable: false },
                });
                this.$measurer = this.createMeasurer();
                this.$arranger = this.createArranger();
                this.$measureBinder = core.NewMeasureBinder(this.state, this.tree, this.$measurer);
                this.$arrangeBinder = core.NewArrangeBinder(this.state, this.tree, this.$arranger);
            };
            LayoutNode.prototype.createInputs = function () {
                return {
                    visible: true,
                    useLayoutRounding: true,
                    margin: new mirage.Thickness(),
                    width: NaN,
                    height: NaN,
                    minWidth: 0.0,
                    minHeight: 0.0,
                    maxWidth: Number.POSITIVE_INFINITY,
                    maxHeight: Number.POSITIVE_INFINITY,
                    horizontalAlignment: mirage.HorizontalAlignment.Stretch,
                    verticalAlignment: mirage.VerticalAlignment.Stretch,
                };
            };
            LayoutNode.prototype.createState = function () {
                return {
                    flags: core.LayoutFlags.None,
                    previousAvailable: new mirage.Size(),
                    desiredSize: new mirage.Size(),
                    hiddenDesire: new mirage.Size(),
                    layoutSlot: new mirage.Rect(),
                    visualOffset: new mirage.Point(),
                    arranged: new mirage.Size(),
                    lastArranged: new mirage.Size(),
                };
            };
            LayoutNode.prototype.createTree = function () {
                return core.DefaultLayoutTree();
            };
            LayoutNode.prototype.createMeasurer = function () {
                var _this = this;
                return core.NewMeasurer(this.inputs, this.state, this.tree, function (constraint) { return _this.measureOverride(constraint); });
            };
            LayoutNode.prototype.createArranger = function () {
                var _this = this;
                return core.NewArranger(this.inputs, this.state, this.tree, function (arrangeSize) { return _this.arrangeOverride(arrangeSize); });
            };
            LayoutNode.prototype.setParent = function (parent) {
                if (!parent) {
                    if (!this.tree.parent)
                        return;
                    this.tree.parent = null;
                    this.onDetached();
                }
                else {
                    if (parent === this.tree.parent)
                        return;
                    this.tree.parent = null;
                    this.onDetached();
                    this.tree.parent = parent;
                    this.onAttached();
                }
            };
            LayoutNode.prototype.onDetached = function () {
                this.invalidateMeasure();
                if (this.tree.parent)
                    this.tree.parent.invalidateMeasure();
                mirage.Rect.clear(this.state.layoutSlot);
            };
            LayoutNode.prototype.onAttached = function () {
                var state = this.state;
                mirage.Size.undef(state.previousAvailable);
                mirage.Size.clear(state.arranged);
                this.invalidateMeasure();
                this.invalidateArrange();
                if ((state.flags & core.LayoutFlags.SizeHint) > 0 || state.lastArranged !== undefined) {
                    this.tree.propagateFlagUp(core.LayoutFlags.SizeHint);
                }
            };
            LayoutNode.prototype.walkDeep = function (reverse) {
                var last = undefined;
                var walkList = [this];
                return {
                    current: undefined,
                    step: function () {
                        if (last) {
                            for (var subwalker = last.tree.walk(reverse); subwalker.step();) {
                                walkList.unshift(subwalker.current);
                            }
                        }
                        this.current = last = walkList.shift();
                        return this.current !== undefined;
                    },
                    skipBranch: function () {
                        last = undefined;
                    },
                };
            };
            LayoutNode.prototype.invalidateMeasure = function () {
                this.state.flags |= core.LayoutFlags.Measure | core.LayoutFlags.MeasureHint;
                this.tree.propagateFlagUp(core.LayoutFlags.MeasureHint);
            };
            LayoutNode.prototype.doMeasure = function () {
                return this.$measureBinder();
            };
            LayoutNode.prototype.measure = function (availableSize) {
                return this.$measurer(availableSize);
            };
            LayoutNode.prototype.measureOverride = function (constraint) {
                var desired = new mirage.Size();
                for (var walker = this.tree.walk(); walker.step();) {
                    walker.current.measure(constraint);
                    mirage.Size.max(desired, walker.current.state.desiredSize);
                }
                return desired;
            };
            LayoutNode.prototype.invalidateArrange = function () {
                this.state.flags |= core.LayoutFlags.Arrange | core.LayoutFlags.ArrangeHint;
                this.tree.propagateFlagUp(core.LayoutFlags.ArrangeHint);
            };
            LayoutNode.prototype.doArrange = function () {
                return this.$arrangeBinder();
            };
            LayoutNode.prototype.arrange = function (finalRect) {
                return this.$arranger(finalRect);
            };
            LayoutNode.prototype.arrangeOverride = function (arrangeSize) {
                var arranged = new mirage.Size(arrangeSize.width, arrangeSize.height);
                for (var walker = this.tree.walk(); walker.step();) {
                    var childRect = new mirage.Rect(0, 0, arrangeSize.width, arrangeSize.height);
                    walker.current.arrange(childRect);
                }
                return arranged;
            };
            LayoutNode.prototype.sizing = function (oldSize, newSize) {
                var state = this.state;
                if (state.lastArranged)
                    mirage.Size.copyTo(state.lastArranged, oldSize);
                mirage.Size.copyTo(state.arranged, newSize);
                state.lastArranged = undefined;
                return true;
            };
            LayoutNode.prototype.onSizeChanged = function (oldSize, newSize) {
            };
            return LayoutNode;
        })();
        core.LayoutNode = LayoutNode;
    })(core = mirage.core || (mirage.core = {}));
})(mirage || (mirage = {}));
/// <reference path="core/LayoutNode" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var mirage;
(function (mirage) {
    var Panel = (function (_super) {
        __extends(Panel, _super);
        function Panel() {
            _super.apply(this, arguments);
        }
        Panel.prototype.createTree = function () {
            return NewPanelTree();
        };
        Panel.prototype.measureOverride = function (constraint) {
            return new mirage.Size(constraint.width, constraint.height);
        };
        Panel.prototype.arrangeOverride = function (arrangeSize) {
            return new mirage.Size(arrangeSize.width, arrangeSize.height);
        };
        Object.defineProperty(Panel.prototype, "childCount", {
            get: function () {
                return this.tree.children.length;
            },
            enumerable: true,
            configurable: true
        });
        Panel.prototype.insertChild = function (child, index) {
            var children = this.tree.children;
            if (index >= children.length) {
                this.appendChild(child);
            }
            else if (index <= 0) {
                this.prependChild(child);
            }
            else {
                children.splice(index, 0, child);
                child.setParent(this);
            }
        };
        Panel.prototype.prependChild = function (child) {
            this.tree.children.unshift(child);
            child.setParent(this);
        };
        Panel.prototype.appendChild = function (child) {
            this.tree.children.push(child);
            child.setParent(this);
        };
        Panel.prototype.removeChild = function (child) {
            var children = this.tree.children;
            var index = children.indexOf(child);
            if (index < 0)
                return false;
            this.tree.children.splice(index, 1);
            child.setParent(null);
            return true;
        };
        Panel.prototype.removeChildAt = function (index) {
            var children = this.tree.children;
            if (index < 0 || index >= children.length)
                return null;
            var removed = children.splice(index, 1)[0];
            if (removed)
                removed.setParent(null);
            return removed;
        };
        Panel.prototype.getChildAt = function (index) {
            return this.tree.children[index];
        };
        return Panel;
    })(mirage.core.LayoutNode);
    mirage.Panel = Panel;
    function NewPanelTree() {
        var tree = mirage.core.DefaultLayoutTree();
        tree.isLayoutContainer = true;
        tree.children = [];
        tree.walk = function (reverse) {
            if (!reverse) {
                var i = -1;
                return {
                    current: undefined,
                    step: function () {
                        i++;
                        if (i >= tree.children.length) {
                            this.current = undefined;
                            return false;
                        }
                        this.current = tree.children[i];
                        return true;
                    },
                };
            }
            else {
                var i = tree.children.length;
                return {
                    current: undefined,
                    step: function () {
                        i--;
                        if (i < 0) {
                            this.current = undefined;
                            return false;
                        }
                        this.current = tree.children[i];
                        return true;
                    },
                };
            }
        };
        return tree;
    }
    mirage.NewPanelTree = NewPanelTree;
})(mirage || (mirage = {}));
var mirage;
(function (mirage) {
    var Point = (function () {
        function Point(x, y) {
            this.x = x == null ? 0 : x;
            this.y = y == null ? 0 : y;
        }
        Point.isEqual = function (p1, p2) {
            return p1.x === p2.x
                && p1.y === p2.y;
        };
        Point.copyTo = function (src, dest) {
            dest.x = src.x;
            dest.y = src.y;
        };
        Point.round = function (dest) {
            dest.x = Math.round(dest.x);
            dest.y = Math.round(dest.y);
        };
        return Point;
    })();
    mirage.Point = Point;
})(mirage || (mirage = {}));
var mirage;
(function (mirage) {
    var createTypedArray;
    if (typeof Float32Array !== "undefined") {
        createTypedArray = function (length) {
            return new Float32Array(length);
        };
    }
    else {
        createTypedArray = function (length) {
            return new Array(length);
        };
    }
    mirage.vec2 = {
        create: function (x, y) {
            var dest = createTypedArray(2);
            dest[0] = x;
            dest[1] = y;
            return dest;
        },
        init: function (x, y, dest) {
            if (!dest)
                dest = createTypedArray(2);
            dest[0] = x;
            dest[1] = y;
            return dest;
        }
    };
})(mirage || (mirage = {}));
var vec2 = mirage.vec2;
/// <reference path="mat/vec2" />
var mirage;
(function (mirage) {
    (function (RectOverlap) {
        RectOverlap[RectOverlap["Out"] = 0] = "Out";
        RectOverlap[RectOverlap["In"] = 1] = "In";
        RectOverlap[RectOverlap["Part"] = 2] = "Part";
    })(mirage.RectOverlap || (mirage.RectOverlap = {}));
    var RectOverlap = mirage.RectOverlap;
    var p1 = mirage.vec2.create(0, 0);
    var p2 = mirage.vec2.create(0, 0);
    var p3 = mirage.vec2.create(0, 0);
    var p4 = mirage.vec2.create(0, 0);
    var Rect = (function () {
        function Rect(x, y, width, height) {
            this.x = x == null ? 0 : x;
            this.y = y == null ? 0 : y;
            this.width = width == null ? 0 : width;
            this.height = height == null ? 0 : height;
        }
        Rect.clear = function (rect) {
            rect.x = rect.y = rect.width = rect.height = 0;
        };
        Rect.getBottom = function (rect) {
            return rect.y + rect.height;
        };
        Rect.getRight = function (rect) {
            return rect.x + rect.width;
        };
        Rect.isEqual = function (rect1, rect2) {
            return rect1.x === rect2.x
                && rect1.y === rect2.y
                && rect1.width === rect2.width
                && rect1.height === rect2.height;
        };
        Rect.isEmpty = function (src) {
            return src.width === 0
                || src.height === 0;
        };
        Rect.copyTo = function (src, dest) {
            dest.x = src.x;
            dest.y = src.y;
            dest.width = src.width;
            dest.height = src.height;
        };
        Rect.roundOut = function (dest) {
            var x = Math.floor(dest.x);
            var y = Math.floor(dest.y);
            dest.width = Math.ceil(dest.x + dest.width) - x;
            dest.height = Math.ceil(dest.y + dest.height) - y;
            dest.x = x;
            dest.y = y;
        };
        Rect.roundIn = function (dest) {
            var x = Math.ceil(dest.x);
            var y = Math.ceil(dest.y);
            dest.width = Math.floor(dest.x + dest.width) - Math.ceil(dest.x);
            dest.height = Math.floor(dest.y + dest.height) - Math.ceil(dest.y);
            dest.x = x;
            dest.y = y;
            return dest;
        };
        Rect.intersection = function (dest, rect2) {
            var x = Math.max(dest.x, rect2.x);
            var y = Math.max(dest.y, rect2.y);
            dest.width = Math.max(0, Math.min(dest.x + dest.width, rect2.x + rect2.width) - x);
            dest.height = Math.max(0, Math.min(dest.y + dest.height, rect2.y + rect2.height) - y);
            dest.x = x;
            dest.y = y;
        };
        Rect.union = function (dest, rect2) {
            if (rect2.width <= 0 || rect2.height <= 0)
                return;
            if (dest.width <= 0 || dest.height <= 0) {
                Rect.copyTo(rect2, dest);
                return;
            }
            var x = Math.min(dest.x, rect2.x);
            var y = Math.min(dest.y, rect2.y);
            dest.width = Math.max(dest.x + dest.width, rect2.x + rect2.width) - x;
            dest.height = Math.max(dest.y + dest.height, rect2.y + rect2.height) - y;
            dest.x = x;
            dest.y = y;
        };
        Rect.isContainedIn = function (src, test) {
            var sl = src.x;
            var st = src.y;
            var sr = src.x + src.width;
            var sb = src.y + src.height;
            var tl = test.x;
            var tt = test.y;
            var tr = test.x + test.width;
            var tb = test.y + test.height;
            if (sl < tl || st < tt || sl > tr || st > tb)
                return false;
            if (sr < tl || sb < tt || sr > tr || sb > tb)
                return false;
            return true;
        };
        Rect.containsPoint = function (rect1, p) {
            return rect1.x <= p.x
                && rect1.y <= p.y
                && (rect1.x + rect1.width) >= p.x
                && (rect1.y + rect1.height) >= p.y;
        };
        Rect.extendTo = function (dest, x, y) {
            var rx = dest.x;
            var ry = dest.y;
            var rw = dest.width;
            var rh = dest.height;
            if (x < rx || x > (rx + rw))
                rw = Math.max(Math.abs(x - rx), Math.abs(x - rx - rw));
            if (y < ry || y > (ry + rh))
                rh = Math.max(Math.abs(y - ry), Math.abs(y - ry - rh));
            dest.x = Math.min(rx, x);
            dest.y = Math.min(ry, y);
            dest.width = rw;
            dest.height = rh;
        };
        Rect.grow = function (dest, left, top, right, bottom) {
            dest.x -= left;
            dest.y -= top;
            dest.width += left + right;
            dest.height += top + bottom;
            if (dest.width < 0)
                dest.width = 0;
            if (dest.height < 0)
                dest.height = 0;
            return dest;
        };
        Rect.shrink = function (dest, left, top, right, bottom) {
            dest.x += left;
            dest.y += top;
            dest.width -= left + right;
            dest.height -= top + bottom;
            if (dest.width < 0)
                dest.width = 0;
            if (dest.height < 0)
                dest.height = 0;
        };
        Rect.rectIn = function (rect1, rect2) {
            var copy = new Rect();
            Rect.copyTo(rect1, copy);
            Rect.intersection(copy, rect2);
            if (Rect.isEmpty(copy))
                return RectOverlap.Out;
            if (Rect.isEqual(copy, rect2))
                return RectOverlap.In;
            return RectOverlap.Part;
        };
        Rect.transform = function (dest, mat) {
            if (!mat)
                return dest;
            var x = dest.x;
            var y = dest.y;
            var width = dest.width;
            var height = dest.height;
            mirage.vec2.init(x, y, p1);
            mirage.vec2.init(x + width, y, p2);
            mirage.vec2.init(x + width, y + height, p3);
            mirage.vec2.init(x, y + height, p4);
            mirage.mat3.transformVec2(mat, p1);
            mirage.mat3.transformVec2(mat, p2);
            mirage.mat3.transformVec2(mat, p3);
            mirage.mat3.transformVec2(mat, p4);
            var l = Math.min(p1[0], p2[0], p3[0], p4[0]);
            var t = Math.min(p1[1], p2[1], p3[1], p4[1]);
            var r = Math.max(p1[0], p2[0], p3[0], p4[0]);
            var b = Math.max(p1[1], p2[1], p3[1], p4[1]);
            dest.x = l;
            dest.y = t;
            dest.width = r - l;
            dest.height = b - t;
            return dest;
        };
        Rect.transform4 = function (dest, projection) {
        };
        return Rect;
    })();
    mirage.Rect = Rect;
})(mirage || (mirage = {}));
var mirage;
(function (mirage) {
    var Size = (function () {
        function Size(width, height) {
            this.width = width == null ? 0 : width;
            this.height = height == null ? 0 : height;
        }
        Size.copyTo = function (src, dest) {
            dest.width = src.width;
            dest.height = src.height;
        };
        Size.isEqual = function (size1, size2) {
            return size1.width === size2.width
                && size1.height === size2.height;
        };
        Size.isEmpty = function (size) {
            return size.width === 0
                || size.height === 0;
        };
        Size.max = function (dest, size2) {
            dest.width = Math.max(dest.width, size2.width);
            dest.height = Math.max(dest.height, size2.height);
        };
        Size.min = function (dest, size2) {
            dest.width = Math.min(dest.width, size2.width);
            dest.height = Math.min(dest.height, size2.height);
        };
        Size.round = function (size) {
            size.width = Math.round(size.width);
            size.height = Math.round(size.height);
        };
        Size.isUndef = function (size) {
            return isNaN(size.width) && isNaN(size.height);
        };
        Size.clear = function (size) {
            size.width = 0;
            size.height = 0;
        };
        Size.undef = function (size) {
            size.width = NaN;
            size.height = NaN;
        };
        return Size;
    })();
    mirage.Size = Size;
})(mirage || (mirage = {}));
var mirage;
(function (mirage) {
    var StackPanel = (function (_super) {
        __extends(StackPanel, _super);
        function StackPanel() {
            _super.apply(this, arguments);
        }
        StackPanel.prototype.createInputs = function () {
            var inputs = _super.prototype.createInputs.call(this);
            inputs.orientation = mirage.Orientation.Horizontal;
            return inputs;
        };
        StackPanel.prototype.measureOverride = function (constraint) {
            if (this.inputs.orientation === mirage.Orientation.Vertical) {
                return this.measureVertical(constraint);
            }
            else {
                return this.measureHorizontal(constraint);
            }
        };
        StackPanel.prototype.measureVertical = function (constraint) {
            var ca = new mirage.Size(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
            var measured = new mirage.Size();
            var inputs = this.inputs;
            ca.width = constraint.width;
            if (!isNaN(inputs.width))
                ca.width = inputs.width;
            ca.width = Math.min(ca.width, inputs.maxWidth);
            ca.width = Math.max(ca.width, inputs.minWidth);
            for (var walker = this.tree.walk(); walker.step();) {
                var child = walker.current;
                child.measure(ca);
                var childDesired = child.state.desiredSize;
                measured.height += childDesired.height;
                measured.width = Math.max(measured.width, childDesired.width);
            }
            return measured;
        };
        StackPanel.prototype.measureHorizontal = function (constraint) {
            var ca = new mirage.Size(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
            var measured = new mirage.Size();
            var inputs = this.inputs;
            ca.height = constraint.height;
            if (!isNaN(inputs.height))
                ca.height = inputs.height;
            ca.height = Math.min(ca.height, inputs.maxHeight);
            ca.height = Math.max(ca.height, inputs.minHeight);
            for (var walker = this.tree.walk(); walker.step();) {
                var child = walker.current;
                child.measure(ca);
                var childDesired = child.state.desiredSize;
                measured.width += childDesired.width;
                measured.height = Math.max(measured.height, childDesired.height);
            }
            return measured;
        };
        StackPanel.prototype.arrangeOverride = function (arrangeSize) {
            if (this.inputs.orientation === mirage.Orientation.Vertical) {
                return this.arrangeVertical(arrangeSize);
            }
            else {
                return this.arrangeHorizontal(arrangeSize);
            }
        };
        StackPanel.prototype.arrangeVertical = function (arrangeSize) {
            var arranged = new mirage.Size(arrangeSize.width, 0);
            for (var walker = this.tree.walk(); walker.step();) {
                var child = walker.current;
                var childDesired = child.state.desiredSize;
                var childFinal = new mirage.Rect(0, arranged.height, arrangeSize.width, childDesired.height);
                if (mirage.Rect.isEmpty(childFinal))
                    mirage.Rect.clear(childFinal);
                child.arrange(childFinal);
                arranged.width = Math.max(arranged.width, arrangeSize.width);
                arranged.height += childDesired.height;
            }
            arranged.height = Math.max(arranged.height, arrangeSize.height);
            return arranged;
        };
        StackPanel.prototype.arrangeHorizontal = function (arrangeSize) {
            var arranged = new mirage.Size(0, arrangeSize.height);
            for (var walker = this.tree.walk(); walker.step();) {
                var child = walker.current;
                var childDesired = child.state.desiredSize;
                var childFinal = new mirage.Rect(arranged.width, 0, childDesired.width, arrangeSize.height);
                if (mirage.Rect.isEmpty(childFinal))
                    mirage.Rect.clear(childFinal);
                child.arrange(childFinal);
                arranged.width += childDesired.width;
                arranged.height = Math.max(arranged.height, arrangeSize.height);
            }
            arranged.width = Math.max(arranged.width, arrangeSize.width);
            return arranged;
        };
        return StackPanel;
    })(mirage.Panel);
    mirage.StackPanel = StackPanel;
})(mirage || (mirage = {}));
var mirage;
(function (mirage) {
    var Thickness = (function () {
        function Thickness(left, top, right, bottom) {
            this.left = left == null ? 0 : left;
            this.top = top == null ? 0 : top;
            this.right = right == null ? 0 : right;
            this.bottom = bottom == null ? 0 : bottom;
        }
        Thickness.add = function (dest, t2) {
            dest.left += t2.left;
            dest.top += t2.top;
            dest.right += t2.right;
            dest.bottom += t2.bottom;
        };
        Thickness.copyTo = function (thickness, dest) {
            dest.left = thickness.left;
            dest.top = thickness.top;
            dest.right = thickness.right;
            dest.bottom = thickness.bottom;
        };
        Thickness.isEmpty = function (thickness) {
            return thickness.left === 0 && thickness.top === 0 && thickness.right === 0 && thickness.bottom === 0;
        };
        Thickness.isBalanced = function (thickness) {
            return thickness.left === thickness.top
                && thickness.left === thickness.right
                && thickness.left === thickness.bottom;
        };
        Thickness.shrinkSize = function (thickness, dest) {
            var w = dest.width;
            var h = dest.height;
            if (w != Number.POSITIVE_INFINITY)
                w -= thickness.left + thickness.right;
            if (h != Number.POSITIVE_INFINITY)
                h -= thickness.top + thickness.bottom;
            dest.width = w > 0 ? w : 0;
            dest.height = h > 0 ? h : 0;
            return dest;
        };
        Thickness.shrinkRect = function (thickness, dest) {
            dest.x += thickness.left;
            dest.y += thickness.top;
            dest.width -= thickness.left + thickness.right;
            dest.height -= thickness.top + thickness.bottom;
            if (dest.width < 0)
                dest.width = 0;
            if (dest.height < 0)
                dest.height = 0;
        };
        Thickness.shrinkCornerRadius = function (thickness, dest) {
            dest.topLeft = Math.max(dest.topLeft - Math.max(thickness.left, thickness.top) * 0.5, 0);
            dest.topRight = Math.max(dest.topRight - Math.max(thickness.right, thickness.top) * 0.5, 0);
            dest.bottomRight = Math.max(dest.bottomRight - Math.max(thickness.right, thickness.bottom) * 0.5, 0);
            dest.bottomLeft = Math.max(dest.bottomLeft - Math.max(thickness.left, thickness.bottom) * 0.5, 0);
        };
        Thickness.growSize = function (thickness, dest) {
            var w = dest.width;
            var h = dest.height;
            if (w != Number.POSITIVE_INFINITY)
                w += thickness.left + thickness.right;
            if (h != Number.POSITIVE_INFINITY)
                h += thickness.top + thickness.bottom;
            dest.width = w > 0 ? w : 0;
            dest.height = h > 0 ? h : 0;
            return dest;
        };
        Thickness.growRect = function (thickness, dest) {
            dest.x -= thickness.left;
            dest.y -= thickness.top;
            dest.width += thickness.left + thickness.right;
            dest.height += thickness.top + thickness.bottom;
            if (dest.width < 0)
                dest.width = 0;
            if (dest.height < 0)
                dest.height = 0;
        };
        Thickness.growCornerRadius = function (thickness, dest) {
            dest.topLeft = dest.topLeft ? Math.max(dest.topLeft + Math.max(thickness.left, thickness.top) * 0.5, 0) : 0;
            dest.topRight = dest.topRight ? Math.max(dest.topRight + Math.max(thickness.right, thickness.top) * 0.5, 0) : 0;
            dest.bottomRight = dest.bottomRight ? Math.max(dest.bottomRight + Math.max(thickness.right, thickness.bottom) * 0.5, 0) : 0;
            dest.bottomLeft = dest.bottomLeft ? Math.max(dest.bottomLeft + Math.max(thickness.left, thickness.bottom) * 0.5, 0) : 0;
        };
        return Thickness;
    })();
    mirage.Thickness = Thickness;
})(mirage || (mirage = {}));
var mirage;
(function (mirage) {
    var Vector;
    (function (Vector) {
        var EPSILON = 1e-10;
        function create(x, y) {
            return [x, y];
        }
        Vector.create = create;
        function reverse(v) {
            v[0] = -v[0];
            v[1] = -v[1];
            return v;
        }
        Vector.reverse = reverse;
        function orthogonal(v) {
            var x = v[0], y = v[1];
            v[0] = -y;
            v[1] = x;
            return v;
        }
        Vector.orthogonal = orthogonal;
        function normalize(v) {
            var x = v[0], y = v[1];
            var len = Math.sqrt(x * x + y * y);
            v[0] = x / len;
            v[1] = y / len;
            return v;
        }
        Vector.normalize = normalize;
        function rotate(v, theta) {
            var c = Math.cos(theta);
            var s = Math.sin(theta);
            var x = v[0];
            var y = v[1];
            v[0] = x * c - y * s;
            v[1] = x * s + y * c;
            return v;
        }
        Vector.rotate = rotate;
        function angleBetween(u, v) {
            var ux = u[0], uy = u[1], vx = v[0], vy = v[1];
            var num = ux * vx + uy * vy;
            var den = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
            return Math.acos(num / den);
        }
        Vector.angleBetween = angleBetween;
        function isClockwiseTo(v1, v2) {
            var theta = angleBetween(v1, v2);
            var nv1 = normalize(v1.slice(0));
            var nv2 = normalize(v2.slice(0));
            rotate(nv1, theta);
            var nx = Math.abs(nv1[0] - nv2[0]);
            var ny = Math.abs(nv1[1] - nv2[1]);
            return nx < EPSILON
                && ny < EPSILON;
        }
        Vector.isClockwiseTo = isClockwiseTo;
        function intersection(s1, d1, s2, d2) {
            var x1 = s1[0];
            var y1 = s1[1];
            var x2 = x1 + d1[0];
            var y2 = y1 + d1[1];
            var x3 = s2[0];
            var y3 = s2[1];
            var x4 = x3 + d2[0];
            var y4 = y3 + d2[1];
            var det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (det === 0)
                return null;
            var xn = ((x1 * y2 - y1 * x2) * (x3 - x4)) - ((x1 - x2) * (x3 * y4 - y3 * x4));
            var yn = ((x1 * y2 - y1 * x2) * (y3 - y4)) - ((y1 - y2) * (x3 * y4 - y3 * x4));
            return [xn / det, yn / det];
        }
        Vector.intersection = intersection;
    })(Vector = mirage.Vector || (mirage.Vector = {}));
})(mirage || (mirage = {}));
var mirage;
(function (mirage) {
    (function (Visibility) {
        Visibility[Visibility["Visible"] = 0] = "Visible";
        Visibility[Visibility["Collapsed"] = 1] = "Collapsed";
    })(mirage.Visibility || (mirage.Visibility = {}));
    var Visibility = mirage.Visibility;
})(mirage || (mirage = {}));
var mirage;
(function (mirage) {
    var core;
    (function (core) {
        function NewArrangeBinder(state, tree, arranger) {
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
            return function () {
                var last = state.layoutSlot || undefined;
                if (last) {
                    return arranger(last);
                }
                else if (tree.parent) {
                    tree.parent.invalidateArrange();
                }
                return false;
            };
        }
        core.NewArrangeBinder = NewArrangeBinder;
        function NewArranger(inputs, state, tree, override) {
            return function (finalRect) {
                if (inputs.visible !== true) {
                    return false;
                }
                var childRect = new mirage.Rect();
                if (inputs.useLayoutRounding) {
                    childRect.x = Math.round(finalRect.x);
                    childRect.y = Math.round(finalRect.y);
                    childRect.width = Math.round(finalRect.width);
                    childRect.height = Math.round(finalRect.height);
                }
                else {
                    mirage.Rect.copyTo(finalRect, childRect);
                }
                if (childRect.width < 0 || childRect.height < 0
                    || !isFinite(childRect.width) || !isFinite(childRect.height)
                    || isNaN(childRect.x) || isNaN(childRect.y)
                    || isNaN(childRect.width) || isNaN(childRect.height)) {
                    console.warn("[mirage] cannot call arrange using rect with NaN/infinite values.");
                    return false;
                }
                if ((state.flags & core.LayoutFlags.Arrange) <= 0) {
                    return false;
                }
                if (mirage.Rect.isEqual(state.layoutSlot, childRect)) {
                    return false;
                }
                mirage.Rect.copyTo(childRect, state.layoutSlot);
                mirage.Thickness.shrinkRect(inputs.margin, childRect);
                var stretched = new mirage.Size(childRect.width, childRect.height);
                core.coerceSize(stretched, inputs);
                var framework = new mirage.Size();
                core.coerceSize(framework, inputs);
                if (inputs.horizontalAlignment === mirage.HorizontalAlignment.Stretch) {
                    framework.width = Math.max(framework.width, stretched.width);
                }
                if (inputs.verticalAlignment === mirage.VerticalAlignment.Stretch) {
                    framework.height = Math.max(framework.height, stretched.height);
                }
                var offer = new mirage.Size(state.hiddenDesire.width, state.hiddenDesire.height);
                mirage.Size.max(offer, framework);
                var arranged = override(offer);
                state.flags &= ~core.LayoutFlags.Arrange;
                if (inputs.useLayoutRounding) {
                    mirage.Size.round(arranged);
                }
                var constrained = new mirage.Size(arranged.width, arranged.height);
                core.coerceSize(constrained, inputs);
                mirage.Size.min(constrained, arranged);
                var vo = state.visualOffset;
                mirage.Point.copyTo(childRect, vo);
                switch (inputs.horizontalAlignment) {
                    case mirage.HorizontalAlignment.Left:
                        break;
                    case mirage.HorizontalAlignment.Right:
                        vo.x += childRect.width - constrained.width;
                        break;
                    case mirage.HorizontalAlignment.Center:
                        vo.x += (childRect.width - constrained.width) * 0.5;
                        break;
                    default:
                        vo.x += Math.max((childRect.width - constrained.width) * 0.5, 0);
                        break;
                }
                switch (inputs.verticalAlignment) {
                    case mirage.VerticalAlignment.Top:
                        break;
                    case mirage.VerticalAlignment.Bottom:
                        vo.y += childRect.height - constrained.height;
                        break;
                    case mirage.VerticalAlignment.Center:
                        vo.y += (childRect.height - constrained.height) * 0.5;
                        break;
                    default:
                        vo.y += Math.max((childRect.height - constrained.height) * 0.5, 0);
                        break;
                }
                if (inputs.useLayoutRounding) {
                    mirage.Point.round(vo);
                }
                var oldArrange = state.arranged;
                if (!mirage.Size.isEqual(oldArrange, arranged)) {
                    mirage.Size.copyTo(oldArrange, state.lastArranged);
                    state.flags |= core.LayoutFlags.SizeHint;
                    tree.propagateFlagUp(core.LayoutFlags.SizeHint);
                }
                mirage.Size.copyTo(arranged, state.arranged);
                return true;
            };
        }
        core.NewArranger = NewArranger;
    })(core = mirage.core || (mirage.core = {}));
})(mirage || (mirage = {}));
var mirage;
(function (mirage) {
    var core;
    (function (core) {
        function DefaultLayoutTree() {
            return {
                isContainer: true,
                isLayoutContainer: false,
                parent: null,
                applyTemplate: function () {
                    return true;
                },
                propagateFlagUp: function (flag) {
                    for (var cur = this.parent; !!cur && (cur.state.flags & flag) <= 0; cur = cur.tree.parent) {
                        cur.state.flags |= flag;
                    }
                },
                walk: function (reverse) {
                    return {
                        current: undefined,
                        step: function () {
                            return false;
                        },
                    };
                },
            };
        }
        core.DefaultLayoutTree = DefaultLayoutTree;
    })(core = mirage.core || (mirage.core = {}));
})(mirage || (mirage = {}));
var mirage;
(function (mirage) {
    var core;
    (function (core) {
        (function (LayoutFlags) {
            LayoutFlags[LayoutFlags["None"] = 0] = "None";
            LayoutFlags[LayoutFlags["Measure"] = 2] = "Measure";
            LayoutFlags[LayoutFlags["Arrange"] = 4] = "Arrange";
            LayoutFlags[LayoutFlags["MeasureHint"] = 8] = "MeasureHint";
            LayoutFlags[LayoutFlags["ArrangeHint"] = 16] = "ArrangeHint";
            LayoutFlags[LayoutFlags["SizeHint"] = 32] = "SizeHint";
            LayoutFlags[LayoutFlags["Hints"] = 56] = "Hints";
        })(core.LayoutFlags || (core.LayoutFlags = {}));
        var LayoutFlags = core.LayoutFlags;
    })(core = mirage.core || (mirage.core = {}));
})(mirage || (mirage = {}));
var mirage;
(function (mirage) {
    var core;
    (function (core) {
        function NewMeasureBinder(state, tree, measurer) {
            return function () {
                var last = state.previousAvailable;
                if (mirage.Size.isUndef(last) && !tree.parent && tree.isLayoutContainer)
                    last.width = last.height = Number.POSITIVE_INFINITY;
                var success = false;
                if (!mirage.Size.isUndef(last)) {
                    var old = new mirage.Size();
                    mirage.Size.copyTo(state.desiredSize, old);
                    success = measurer(last);
                    if (mirage.Size.isEqual(old, state.desiredSize))
                        return success;
                }
                if (tree.parent)
                    tree.parent.invalidateMeasure();
                state.flags &= ~core.LayoutFlags.Measure;
                return success;
            };
        }
        core.NewMeasureBinder = NewMeasureBinder;
        function NewMeasurer(inputs, state, tree, override) {
            return function (availableSize) {
                if (isNaN(availableSize.width) || isNaN(availableSize.height)) {
                    console.warn("[mirage] cannot call measure using a size with NaN values.");
                    return false;
                }
                if (inputs.visible !== true) {
                    return false;
                }
                tree.applyTemplate();
                if ((state.flags & core.LayoutFlags.Measure) <= 0) {
                    return false;
                }
                var pc = state.previousAvailable;
                if (!mirage.Size.isUndef(pc) && pc.width === availableSize.width && pc.height === availableSize.height) {
                    return false;
                }
                state.flags |= (core.LayoutFlags.Arrange | core.LayoutFlags.ArrangeHint);
                var framedSize = new mirage.Size(availableSize.width, availableSize.height);
                mirage.Thickness.shrinkSize(inputs.margin, framedSize);
                core.coerceSize(framedSize, inputs);
                var desired = override(framedSize);
                state.flags &= ~core.LayoutFlags.Measure;
                mirage.Size.copyTo(desired, state.hiddenDesire);
                core.coerceSize(desired, inputs);
                mirage.Thickness.growSize(inputs.margin, desired);
                desired.width = Math.min(desired.width, availableSize.width);
                desired.height = Math.min(desired.height, availableSize.height);
                if (inputs.useLayoutRounding) {
                    mirage.Size.round(desired);
                }
                mirage.Size.copyTo(desired, state.desiredSize);
                return true;
            };
        }
        core.NewMeasurer = NewMeasurer;
    })(core = mirage.core || (mirage.core = {}));
})(mirage || (mirage = {}));
var mirage;
(function (mirage) {
    var core;
    (function (core) {
        function coerceSize(size, inputs) {
            var cw = Math.max(inputs.minWidth, size.width);
            var ch = Math.max(inputs.minHeight, size.height);
            if (!isNaN(inputs.width))
                cw = inputs.width;
            if (!isNaN(inputs.height))
                ch = inputs.height;
            cw = Math.max(Math.min(cw, inputs.maxWidth), inputs.minWidth);
            ch = Math.max(Math.min(ch, inputs.maxHeight), inputs.minHeight);
            if (inputs.useLayoutRounding) {
                cw = Math.round(cw);
                ch = Math.round(ch);
            }
            size.width = cw;
            size.height = ch;
        }
        core.coerceSize = coerceSize;
    })(core = mirage.core || (mirage.core = {}));
})(mirage || (mirage = {}));
/// <reference path="../core/LayoutFlags" />
var mirage;
(function (mirage) {
    var draft;
    (function (draft) {
        var LayoutFlags = mirage.core.LayoutFlags;
        function NewArrangeDrafter(node) {
            var arrangeList = [];
            return {
                flush: function () {
                    var cur;
                    while ((cur = arrangeList.shift()) != null) {
                        cur.tree.propagateFlagUp(LayoutFlags.ArrangeHint);
                    }
                },
                prepare: function () {
                    for (var walker = node.walkDeep(); walker.step();) {
                        var cur = walker.current;
                        if (!cur.inputs.visible) {
                            walker.skipBranch();
                            continue;
                        }
                        if ((cur.state.flags & LayoutFlags.ArrangeHint) === 0) {
                            walker.skipBranch();
                            continue;
                        }
                        cur.state.flags &= ~LayoutFlags.ArrangeHint;
                        if ((cur.state.flags & LayoutFlags.Arrange) > 0) {
                            arrangeList.push(cur);
                        }
                    }
                    return arrangeList.length > 0;
                },
                draft: function () {
                    var cur;
                    while ((cur = arrangeList.shift()) != null) {
                        cur.doArrange();
                    }
                    return true;
                },
            };
        }
        draft.NewArrangeDrafter = NewArrangeDrafter;
    })(draft = mirage.draft || (mirage.draft = {}));
})(mirage || (mirage = {}));
/// <reference path="../core/LayoutFlags" />
var mirage;
(function (mirage) {
    var draft;
    (function (draft) {
        var LayoutFlags = mirage.core.LayoutFlags;
        var MAX_COUNT = 255;
        function NewDrafter(node, rootSize) {
            var measure = draft.NewMeasureDrafter(node, rootSize);
            var arrange = draft.NewArrangeDrafter(node);
            var size = draft.NewSizeDrafter(node);
            function runDraft() {
                if (!node.inputs.visible)
                    return false;
                arrange.flush();
                size.flush();
                var flags = node.state.flags;
                if ((flags & LayoutFlags.MeasureHint) > 0) {
                    return measure.prepare()
                        && measure.draft();
                }
                if ((flags & LayoutFlags.ArrangeHint) > 0) {
                    return arrange.prepare()
                        && arrange.draft();
                }
                if ((flags & LayoutFlags.SizeHint) > 0) {
                    return size.prepare()
                        && size.draft()
                        && size.notify();
                }
                return false;
            }
            return function () {
                if ((node.state.flags & LayoutFlags.Hints) === 0)
                    return false;
                var updated = false;
                for (var count = 0; count < MAX_COUNT; count++) {
                    if (!runDraft())
                        break;
                    updated = true;
                }
                if (count >= MAX_COUNT) {
                    console.error("[mirage] aborting infinite draft");
                }
                return updated;
            };
        }
        draft.NewDrafter = NewDrafter;
    })(draft = mirage.draft || (mirage.draft = {}));
})(mirage || (mirage = {}));
/// <reference path="../core/LayoutFlags" />
var mirage;
(function (mirage) {
    var draft;
    (function (draft) {
        var LayoutFlags = mirage.core.LayoutFlags;
        function NewMeasureDrafter(node, rootSize) {
            var measureList = [];
            return {
                prepare: function () {
                    var last = node.state.previousAvailable;
                    if (node.tree.isContainer && (mirage.Size.isUndef(last) || !mirage.Size.isEqual(last, rootSize))) {
                        node.state.flags |= LayoutFlags.Measure;
                        mirage.Size.copyTo(rootSize, node.state.previousAvailable);
                    }
                    for (var walker = node.walkDeep(); walker.step();) {
                        var cur = walker.current;
                        if (!cur.inputs.visible) {
                            walker.skipBranch();
                            continue;
                        }
                        if ((cur.state.flags & LayoutFlags.MeasureHint) === 0) {
                            walker.skipBranch();
                            continue;
                        }
                        cur.state.flags &= ~LayoutFlags.MeasureHint;
                        if ((cur.state.flags & LayoutFlags.Measure) > 0) {
                            measureList.push(cur);
                        }
                    }
                    return measureList.length > 0;
                },
                draft: function () {
                    var cur;
                    while ((cur = measureList.shift()) != null) {
                        cur.doMeasure();
                    }
                    return true;
                },
            };
        }
        draft.NewMeasureDrafter = NewMeasureDrafter;
    })(draft = mirage.draft || (mirage.draft = {}));
})(mirage || (mirage = {}));
/// <reference path="../core/LayoutFlags" />
var mirage;
(function (mirage) {
    var draft;
    (function (draft) {
        var LayoutFlags = mirage.core.LayoutFlags;
        function NewSizeDrafter(node) {
            var sizingList = [];
            var sizingUpdates = [];
            return {
                flush: function () {
                    var cur;
                    while ((cur = sizingList.shift()) != null) {
                        cur.tree.propagateFlagUp(LayoutFlags.SizeHint);
                    }
                },
                prepare: function () {
                    for (var walker = node.walkDeep(); walker.step();) {
                        var cur = walker.current;
                        if (!cur.inputs.visible) {
                            walker.skipBranch();
                            continue;
                        }
                        if ((cur.state.flags & LayoutFlags.SizeHint) === 0) {
                            walker.skipBranch();
                            continue;
                        }
                        cur.state.flags &= ~LayoutFlags.SizeHint;
                        if (cur.state.lastArranged !== undefined) {
                            sizingList.push(cur);
                        }
                    }
                    return sizingList.length > 0;
                },
                draft: function () {
                    var oldSize = new mirage.Size();
                    var newSize = new mirage.Size();
                    var cur;
                    while ((cur = sizingList.pop()) != null) {
                        cur.sizing(oldSize, newSize);
                        if (!mirage.Size.isEqual(oldSize, newSize)) {
                            sizingUpdates.push({
                                node: cur,
                                oldSize: oldSize,
                                newSize: newSize,
                            });
                            oldSize = new mirage.Size();
                            newSize = new mirage.Size();
                        }
                    }
                    return sizingUpdates.length > 0;
                },
                notify: function () {
                    var update;
                    while ((update = sizingUpdates.pop()) != null) {
                        update.node.onSizeChanged(update.oldSize, update.newSize);
                    }
                    return true;
                }
            };
        }
        draft.NewSizeDrafter = NewSizeDrafter;
    })(draft = mirage.draft || (mirage.draft = {}));
})(mirage || (mirage = {}));
var mirage;
(function (mirage) {
    var FLOAT_EPSILON = 0.000001;
    var createTypedArray;
    if (typeof Float32Array !== "undefined") {
        createTypedArray = function (length) {
            return new Float32Array(length);
        };
    }
    else {
        createTypedArray = function (length) {
            return new Array(length);
        };
    }
    mirage.mat3 = {
        create: function (src) {
            var dest = createTypedArray(6);
            if (src) {
                dest[0] = src[0];
                dest[1] = src[1];
                dest[2] = src[2];
                dest[3] = src[3];
                dest[4] = src[4];
                dest[5] = src[5];
            }
            else {
                dest[0] = dest[1] = dest[2] = dest[3] = dest[4] = dest[5] = 0;
            }
            return dest;
        },
        copyTo: function (src, dest) {
            dest[0] = src[0];
            dest[1] = src[1];
            dest[2] = src[2];
            dest[3] = src[3];
            dest[4] = src[4];
            dest[5] = src[5];
            return dest;
        },
        init: function (dest, m11, m12, m21, m22, x0, y0) {
            dest[0] = m11;
            dest[1] = m12;
            dest[2] = m21;
            dest[3] = m22;
            dest[4] = x0;
            dest[5] = y0;
            return dest;
        },
        identity: function (dest) {
            if (!dest)
                dest = mirage.mat3.create();
            dest[0] = 1;
            dest[1] = 0;
            dest[2] = 0;
            dest[3] = 1;
            dest[4] = 0;
            dest[5] = 0;
            return dest;
        },
        equal: function (a, b) {
            return a === b || (Math.abs(a[0] - b[0]) < FLOAT_EPSILON &&
                Math.abs(a[1] - b[1]) < FLOAT_EPSILON &&
                Math.abs(a[2] - b[2]) < FLOAT_EPSILON &&
                Math.abs(a[3] - b[3]) < FLOAT_EPSILON &&
                Math.abs(a[4] - b[4]) < FLOAT_EPSILON &&
                Math.abs(a[5] - b[5]) < FLOAT_EPSILON);
        },
        multiply: function (a, b, dest) {
            if (!dest)
                dest = a;
            var a11 = a[0], a12 = a[1], a21 = a[2], a22 = a[3], ax0 = a[4], ay0 = a[5], b11 = b[0], b12 = b[1], b21 = b[2], b22 = b[3], bx0 = b[4], by0 = b[5];
            dest[0] = a11 * b11 + a12 * b21;
            dest[1] = a11 * b12 + a12 * b22;
            dest[2] = a21 * b11 + a22 * b21;
            dest[3] = a21 * b12 + a22 * b22;
            dest[4] = ax0 * b11 + ay0 * b21 + bx0;
            dest[5] = ax0 * b12 + ay0 * b22 + by0;
            return dest;
        },
        inverse: function (mat, dest) {
            if (Math.abs(mat[1]) < FLOAT_EPSILON && Math.abs(mat[2]) < FLOAT_EPSILON)
                return simple_inverse(mat, dest);
            else
                return complex_inverse(mat, dest);
        },
        transformVec2: function (mat, vec, dest) {
            if (!dest)
                dest = vec;
            var x = vec[0], y = vec[1];
            dest[0] = (mat[0] * x) + (mat[2] * y) + mat[4];
            dest[1] = (mat[1] * x) + (mat[3] * y) + mat[5];
            return dest;
        },
        createTranslate: function (x, y, dest) {
            if (!dest)
                dest = mirage.mat3.create();
            dest[0] = 1;
            dest[1] = 0;
            dest[2] = 0;
            dest[3] = 1;
            dest[4] = x;
            dest[5] = y;
            return dest;
        },
        translate: function (mat, x, y) {
            mat[4] += x;
            mat[5] += y;
            return mat;
        },
        createScale: function (sx, sy, dest) {
            if (!dest)
                dest = mirage.mat3.create();
            dest[0] = sx;
            dest[1] = 0;
            dest[2] = 0;
            dest[3] = sy;
            dest[4] = 0;
            dest[5] = 0;
            return dest;
        },
        scale: function (mat, sx, sy) {
            mat[0] *= sx;
            mat[2] *= sx;
            mat[4] *= sx;
            mat[1] *= sy;
            mat[3] *= sy;
            mat[5] *= sy;
            return mat;
        },
        createRotate: function (angleRad, dest) {
            if (!dest)
                dest = mirage.mat3.create();
            var c = Math.cos(angleRad);
            var s = Math.sin(angleRad);
            dest[0] = c;
            dest[1] = s;
            dest[2] = -s;
            dest[3] = c;
            dest[4] = 0;
            dest[5] = 0;
            return dest;
        },
        createSkew: function (angleRadX, angleRadY, dest) {
            if (!dest)
                dest = mirage.mat3.create();
            dest[0] = 1;
            dest[1] = Math.tan(angleRadY);
            dest[2] = Math.tan(angleRadX);
            dest[3] = 1;
            dest[4] = 0;
            dest[5] = 0;
            return dest;
        },
        preapply: function (dest, mat) {
            return mirage.mat3.multiply(mat, dest, dest);
        },
        apply: function (dest, mat) {
            return mirage.mat3.multiply(dest, mat, dest);
        }
    };
    function simple_inverse(mat, dest) {
        var m11 = mat[0];
        if (Math.abs(m11) < FLOAT_EPSILON)
            return null;
        var m22 = mat[3];
        if (Math.abs(m22) < FLOAT_EPSILON)
            return null;
        if (!dest) {
            dest = mat;
        }
        else {
            dest[1] = mat[1];
            dest[2] = mat[2];
        }
        var x0 = -mat[4];
        var y0 = -mat[5];
        if (Math.abs(m11 - 1) > FLOAT_EPSILON) {
            m11 = 1 / m11;
            x0 *= m11;
        }
        if (Math.abs(m22 - 1) > FLOAT_EPSILON) {
            m22 = 1 / m22;
            y0 *= m22;
        }
        dest[0] = m11;
        dest[3] = m22;
        dest[4] = x0;
        dest[5] = y0;
        return dest;
    }
    function complex_inverse(mat, dest) {
        if (!dest)
            dest = mat;
        var m11 = mat[0], m12 = mat[1], m21 = mat[2], m22 = mat[3];
        var det = m11 * m22 - m12 * m21;
        if (det === 0 || !isFinite(det))
            return null;
        var id = 1 / det;
        var x0 = mat[4], y0 = mat[5];
        dest[0] = m22 * id;
        dest[1] = -m12 * id;
        dest[2] = -m21 * id;
        dest[3] = m11 * id;
        dest[4] = (m21 * y0 - m22 * x0) * id;
        dest[5] = (m12 * x0 - m11 * y0) * id;
        return dest;
    }
})(mirage || (mirage = {}));
var mat3 = mirage.mat3;
var mirage;
(function (mirage) {
    var Indexes;
    (function (Indexes) {
        Indexes[Indexes["M11"] = 0] = "M11";
        Indexes[Indexes["M12"] = 1] = "M12";
        Indexes[Indexes["M13"] = 2] = "M13";
        Indexes[Indexes["M14"] = 3] = "M14";
        Indexes[Indexes["M21"] = 4] = "M21";
        Indexes[Indexes["M22"] = 5] = "M22";
        Indexes[Indexes["M23"] = 6] = "M23";
        Indexes[Indexes["M24"] = 7] = "M24";
        Indexes[Indexes["M31"] = 8] = "M31";
        Indexes[Indexes["M32"] = 9] = "M32";
        Indexes[Indexes["M33"] = 10] = "M33";
        Indexes[Indexes["M34"] = 11] = "M34";
        Indexes[Indexes["OffsetX"] = 12] = "OffsetX";
        Indexes[Indexes["OffsetY"] = 13] = "OffsetY";
        Indexes[Indexes["OffsetZ"] = 14] = "OffsetZ";
        Indexes[Indexes["M44"] = 15] = "M44";
    })(Indexes || (Indexes = {}));
    var FLOAT_EPSILON = 0.000001;
    var createTypedArray;
    if (typeof Float32Array !== "undefined") {
        createTypedArray = function (length) {
            return new Float32Array(length);
        };
    }
    else {
        createTypedArray = function (length) {
            return new Array(length);
        };
    }
    mirage.mat4 = {
        create: function (src) {
            var dest = createTypedArray(16);
            if (src) {
                dest[Indexes.M11] = src[Indexes.M11];
                dest[Indexes.M12] = src[Indexes.M12];
                dest[Indexes.M13] = src[Indexes.M13];
                dest[Indexes.M14] = src[Indexes.M14];
                dest[Indexes.M21] = src[Indexes.M21];
                dest[Indexes.M22] = src[Indexes.M22];
                dest[Indexes.M23] = src[Indexes.M23];
                dest[Indexes.M24] = src[Indexes.M24];
                dest[Indexes.M31] = src[Indexes.M31];
                dest[Indexes.M32] = src[Indexes.M32];
                dest[Indexes.M33] = src[Indexes.M33];
                dest[Indexes.M34] = src[Indexes.M34];
                dest[Indexes.OffsetX] = src[Indexes.OffsetX];
                dest[Indexes.OffsetY] = src[Indexes.OffsetY];
                dest[Indexes.OffsetZ] = src[Indexes.OffsetZ];
                dest[Indexes.M44] = src[Indexes.M44];
            }
            return dest;
        },
        copyTo: function (src, dest) {
            dest[Indexes.M11] = src[Indexes.M11];
            dest[Indexes.M12] = src[Indexes.M12];
            dest[Indexes.M13] = src[Indexes.M13];
            dest[Indexes.M14] = src[Indexes.M14];
            dest[Indexes.M21] = src[Indexes.M21];
            dest[Indexes.M22] = src[Indexes.M22];
            dest[Indexes.M23] = src[Indexes.M23];
            dest[Indexes.M24] = src[Indexes.M24];
            dest[Indexes.M31] = src[Indexes.M31];
            dest[Indexes.M32] = src[Indexes.M32];
            dest[Indexes.M33] = src[Indexes.M33];
            dest[Indexes.M34] = src[Indexes.M34];
            dest[Indexes.OffsetX] = src[Indexes.OffsetX];
            dest[Indexes.OffsetY] = src[Indexes.OffsetY];
            dest[Indexes.OffsetZ] = src[Indexes.OffsetZ];
            dest[Indexes.M44] = src[Indexes.M44];
            return dest;
        },
        identity: function (dest) {
            if (!dest)
                dest = mirage.mat4.create();
            dest[Indexes.M11] = 1;
            dest[Indexes.M12] = 0;
            dest[Indexes.M13] = 0;
            dest[Indexes.M14] = 0;
            dest[Indexes.M21] = 0;
            dest[Indexes.M22] = 1;
            dest[Indexes.M23] = 0;
            dest[Indexes.M24] = 0;
            dest[Indexes.M31] = 0;
            dest[Indexes.M32] = 0;
            dest[Indexes.M33] = 1;
            dest[Indexes.M34] = 0;
            dest[Indexes.OffsetX] = 0;
            dest[Indexes.OffsetY] = 0;
            dest[Indexes.OffsetZ] = 0;
            dest[Indexes.M44] = 1;
            return dest;
        },
        equal: function (a, b) {
            return a === b || (Math.abs(a[Indexes.M11] - b[Indexes.M11]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.M12] - b[Indexes.M12]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.M13] - b[Indexes.M13]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.M14] - b[Indexes.M14]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.M21] - b[Indexes.M21]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.M22] - b[Indexes.M22]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.M23] - b[Indexes.M23]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.M24] - b[Indexes.M24]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.M31] - b[Indexes.M31]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.M32] - b[Indexes.M32]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.M33] - b[Indexes.M33]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.M34] - b[Indexes.M34]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.OffsetX] - b[Indexes.OffsetX]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.OffsetY] - b[Indexes.OffsetY]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.OffsetZ] - b[Indexes.OffsetZ]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.M44] - b[Indexes.M44]) < FLOAT_EPSILON);
        },
        multiply: function (a, b, dest) {
            if (!dest)
                dest = a;
            var m11 = a[Indexes.M11], m12 = a[Indexes.M12], m13 = a[Indexes.M13], m14 = a[Indexes.M14], m21 = a[Indexes.M21], m22 = a[Indexes.M22], m23 = a[Indexes.M23], m24 = a[Indexes.M24], m31 = a[Indexes.M31], m32 = a[Indexes.M32], m33 = a[Indexes.M33], m34 = a[Indexes.M34], mx0 = a[Indexes.OffsetX], my0 = a[Indexes.OffsetY], mz0 = a[Indexes.OffsetZ], m44 = a[Indexes.M44];
            var n11 = b[Indexes.M11], n12 = b[Indexes.M12], n13 = b[Indexes.M13], n14 = b[Indexes.M14], n21 = b[Indexes.M21], n22 = b[Indexes.M22], n23 = b[Indexes.M23], n24 = b[Indexes.M24], n31 = b[Indexes.M31], n32 = b[Indexes.M32], n33 = b[Indexes.M33], n34 = b[Indexes.M34], nx0 = b[Indexes.OffsetX], ny0 = b[Indexes.OffsetY], nz0 = b[Indexes.OffsetZ], n44 = b[Indexes.M44];
            dest[Indexes.M11] = m11 * n11 + m12 * n21 + m13 * n31 + m14 * nx0;
            dest[Indexes.M12] = m11 * n12 + m12 * n22 + m13 * n32 + m14 * ny0;
            dest[Indexes.M13] = m11 * n13 + m12 * n23 + m13 * n33 + m14 * nz0;
            dest[Indexes.M14] = m11 * n14 + m12 * n24 + m13 * n34 + m14 * n44;
            dest[Indexes.M21] = m21 * n11 + m22 * n21 + m23 * n31 + m24 * nx0;
            dest[Indexes.M22] = m21 * n12 + m22 * n22 + m23 * n32 + m24 * ny0;
            dest[Indexes.M23] = m21 * n13 + m22 * n23 + m23 * n33 + m24 * nz0;
            dest[Indexes.M24] = m21 * n14 + m22 * n24 + m23 * n34 + m24 * n44;
            dest[Indexes.M31] = m31 * n11 + m32 * n21 + m33 * n31 + m34 * nx0;
            dest[Indexes.M32] = m31 * n12 + m32 * n22 + m33 * n32 + m34 * ny0;
            dest[Indexes.M33] = m31 * n13 + m32 * n23 + m33 * n33 + m34 * nz0;
            dest[Indexes.M34] = m31 * n14 + m32 * n24 + m33 * n34 + m34 * n44;
            dest[Indexes.OffsetX] = mx0 * n11 + my0 * n21 + mz0 * n31 + m44 * nx0;
            dest[Indexes.OffsetY] = mx0 * n12 + my0 * n22 + mz0 * n32 + m44 * ny0;
            dest[Indexes.OffsetZ] = mx0 * n13 + my0 * n23 + mz0 * n33 + m44 * nz0;
            dest[Indexes.M44] = mx0 * n14 + my0 * n24 + mz0 * n34 + m44 * n44;
            return dest;
        },
        inverse: function (mat, dest) {
            if (!dest)
                dest = mat;
            var a00 = mat[Indexes.M11], a01 = mat[Indexes.M12], a02 = mat[Indexes.M13], a03 = mat[Indexes.M14], a10 = mat[Indexes.M21], a11 = mat[Indexes.M22], a12 = mat[Indexes.M23], a13 = mat[Indexes.M24], a20 = mat[Indexes.M31], a21 = mat[Indexes.M32], a22 = mat[Indexes.M33], a23 = mat[Indexes.M34], a30 = mat[Indexes.OffsetX], a31 = mat[Indexes.OffsetY], a32 = mat[Indexes.OffsetZ], a33 = mat[Indexes.M44], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
            var d = (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
            if (!isFinite(d) || !d)
                return null;
            var id = 1 / d;
            dest[Indexes.M11] = (a11 * b11 - a12 * b10 + a13 * b09) * id;
            dest[Indexes.M12] = (-a01 * b11 + a02 * b10 - a03 * b09) * id;
            dest[Indexes.M13] = (a31 * b05 - a32 * b04 + a33 * b03) * id;
            dest[Indexes.M14] = (-a21 * b05 + a22 * b04 - a23 * b03) * id;
            dest[Indexes.M21] = (-a10 * b11 + a12 * b08 - a13 * b07) * id;
            dest[Indexes.M22] = (a00 * b11 - a02 * b08 + a03 * b07) * id;
            dest[Indexes.M23] = (-a30 * b05 + a32 * b02 - a33 * b01) * id;
            dest[Indexes.M24] = (a20 * b05 - a22 * b02 + a23 * b01) * id;
            dest[Indexes.M31] = (a10 * b10 - a11 * b08 + a13 * b06) * id;
            dest[Indexes.M32] = (-a00 * b10 + a01 * b08 - a03 * b06) * id;
            dest[Indexes.M33] = (a30 * b04 - a31 * b02 + a33 * b00) * id;
            dest[Indexes.M34] = (-a20 * b04 + a21 * b02 - a23 * b00) * id;
            dest[Indexes.OffsetX] = (-a10 * b09 + a11 * b07 - a12 * b06) * id;
            dest[Indexes.OffsetY] = (a00 * b09 - a01 * b07 + a02 * b06) * id;
            dest[Indexes.OffsetZ] = (-a30 * b03 + a31 * b01 - a32 * b00) * id;
            dest[Indexes.M44] = (a20 * b03 - a21 * b01 + a22 * b00) * id;
            return dest;
        },
        transpose: function (mat, dest) {
            if (!dest)
                dest = mat;
            var a00 = mat[Indexes.M11], a01 = mat[Indexes.M12], a02 = mat[Indexes.M13], a03 = mat[Indexes.M14], a10 = mat[Indexes.M21], a11 = mat[Indexes.M22], a12 = mat[Indexes.M23], a13 = mat[Indexes.M24], a20 = mat[Indexes.M31], a21 = mat[Indexes.M32], a22 = mat[Indexes.M33], a23 = mat[Indexes.M34], a30 = mat[Indexes.OffsetX], a31 = mat[Indexes.OffsetY], a32 = mat[Indexes.OffsetZ], a33 = mat[Indexes.M44];
            dest[Indexes.M11] = a00;
            dest[Indexes.M21] = a01;
            dest[Indexes.M31] = a02;
            dest[Indexes.OffsetX] = a03;
            dest[Indexes.M12] = a10;
            dest[Indexes.M22] = a11;
            dest[Indexes.M32] = a12;
            dest[Indexes.OffsetY] = a13;
            dest[Indexes.M13] = a20;
            dest[Indexes.M23] = a21;
            dest[Indexes.M33] = a22;
            dest[Indexes.OffsetZ] = a23;
            dest[Indexes.M14] = a30;
            dest[Indexes.M24] = a31;
            dest[Indexes.M34] = a32;
            dest[Indexes.M44] = a33;
            return dest;
        },
        transformVec4: function (mat, vec, dest) {
            if (!dest)
                dest = vec;
            var x = vec[0], y = vec[1], z = vec[2], w = vec[3];
            var m11 = mat[Indexes.M11], m12 = mat[Indexes.M12], m13 = mat[Indexes.M13], m14 = mat[Indexes.M14], m21 = mat[Indexes.M21], m22 = mat[Indexes.M22], m23 = mat[Indexes.M23], m24 = mat[Indexes.M24], m31 = mat[Indexes.M31], m32 = mat[Indexes.M32], m33 = mat[Indexes.M33], m34 = mat[Indexes.M34], mx0 = mat[Indexes.OffsetX], my0 = mat[Indexes.OffsetY], mz0 = mat[Indexes.OffsetZ], m44 = mat[Indexes.M44];
            dest[0] = m11 * x + m12 * y + m13 * z + m14 * w;
            dest[1] = m21 * x + m22 * y + m23 * z + m24 * w;
            dest[2] = m31 * x + m32 * y + m33 * z + m34 * w;
            dest[3] = mx0 * x + my0 * y + mz0 * z + m44 * w;
            return dest;
        },
        createTranslate: function (x, y, z, dest) {
            if (!dest)
                dest = mirage.mat4.create();
            dest[Indexes.M11] = 1;
            dest[Indexes.M12] = 0;
            dest[Indexes.M13] = 0;
            dest[Indexes.M14] = 0;
            dest[Indexes.M21] = 0;
            dest[Indexes.M22] = 1;
            dest[Indexes.M23] = 0;
            dest[Indexes.M24] = 0;
            dest[Indexes.M31] = 0;
            dest[Indexes.M32] = 0;
            dest[Indexes.M33] = 1;
            dest[Indexes.M34] = 0;
            dest[Indexes.OffsetX] = x;
            dest[Indexes.OffsetY] = y;
            dest[Indexes.OffsetZ] = z;
            dest[Indexes.M44] = 1;
            return dest;
        },
        createScale: function (x, y, z, dest) {
            if (!dest)
                dest = mirage.mat4.create();
            dest[Indexes.M11] = x;
            dest[Indexes.M12] = 0;
            dest[Indexes.M13] = 0;
            dest[Indexes.M14] = 0;
            dest[Indexes.M11] = 0;
            dest[Indexes.M12] = y;
            dest[Indexes.M13] = 0;
            dest[Indexes.M14] = 0;
            dest[Indexes.M31] = 0;
            dest[Indexes.M32] = 0;
            dest[Indexes.M33] = z;
            dest[Indexes.M34] = 0;
            dest[Indexes.OffsetX] = 0;
            dest[Indexes.OffsetY] = 0;
            dest[Indexes.OffsetZ] = 0;
            dest[Indexes.M44] = 1;
            return dest;
        },
        createRotateX: function (theta, dest) {
            if (!dest)
                dest = mirage.mat4.create();
            var s = Math.sin(theta);
            var c = Math.cos(theta);
            dest[Indexes.M11] = 1;
            dest[Indexes.M12] = 0;
            dest[Indexes.M13] = 0;
            dest[Indexes.M14] = 0;
            dest[Indexes.M21] = 0;
            dest[Indexes.M22] = c;
            dest[Indexes.M23] = s;
            dest[Indexes.M24] = 0;
            dest[Indexes.M31] = 0;
            dest[Indexes.M32] = -s;
            dest[Indexes.M33] = c;
            dest[Indexes.M34] = 0;
            dest[Indexes.OffsetX] = 0;
            dest[Indexes.OffsetY] = 0;
            dest[Indexes.OffsetZ] = 0;
            dest[Indexes.M44] = 1;
            return dest;
        },
        createRotateY: function (theta, dest) {
            if (!dest)
                dest = mirage.mat4.create();
            var s = Math.sin(theta);
            var c = Math.cos(theta);
            dest[Indexes.M11] = c;
            dest[Indexes.M12] = 0;
            dest[Indexes.M13] = -s;
            dest[Indexes.M14] = 0;
            dest[Indexes.M21] = 0;
            dest[Indexes.M22] = 1;
            dest[Indexes.M23] = 0;
            dest[Indexes.M24] = 0;
            dest[Indexes.M31] = s;
            dest[Indexes.M32] = 0;
            dest[Indexes.M33] = c;
            dest[Indexes.M34] = 0;
            dest[Indexes.OffsetX] = 0;
            dest[Indexes.OffsetY] = 0;
            dest[Indexes.OffsetZ] = 0;
            dest[Indexes.M44] = 1;
            return dest;
        },
        createRotateZ: function (theta, dest) {
            if (!dest)
                dest = mirage.mat4.create();
            var s = Math.sin(theta);
            var c = Math.cos(theta);
            dest[Indexes.M11] = c;
            dest[Indexes.M12] = s;
            dest[Indexes.M13] = 0;
            dest[Indexes.M14] = 0;
            dest[Indexes.M21] = -s;
            dest[Indexes.M22] = c;
            dest[Indexes.M23] = 0;
            dest[Indexes.M24] = 0;
            dest[Indexes.M31] = 0;
            dest[Indexes.M32] = 0;
            dest[Indexes.M33] = 1;
            dest[Indexes.M34] = 0;
            dest[Indexes.OffsetX] = 0;
            dest[Indexes.OffsetY] = 0;
            dest[Indexes.OffsetZ] = 0;
            dest[Indexes.M44] = 1;
            return dest;
        },
        createPerspective: function (fieldOfViewY, aspectRatio, zNearPlane, zFarPlane, dest) {
            if (!dest)
                dest = mirage.mat4.create();
            var height = 1.0 / Math.tan(fieldOfViewY / 2.0);
            var width = height / aspectRatio;
            var d = zNearPlane - zFarPlane;
            dest[Indexes.M11] = width;
            dest[Indexes.M12] = 0;
            dest[Indexes.M13] = 0;
            dest[Indexes.M14] = 0;
            dest[Indexes.M21] = 0;
            dest[Indexes.M22] = height;
            dest[Indexes.M23] = 0;
            dest[Indexes.M24] = 0;
            dest[Indexes.M31] = 0;
            dest[Indexes.M32] = 0;
            dest[Indexes.M33] = zFarPlane / d;
            dest[Indexes.M34] = -1.0;
            dest[Indexes.OffsetX] = 0;
            dest[Indexes.OffsetY] = 0;
            dest[Indexes.OffsetZ] = zNearPlane * zFarPlane / d;
            dest[Indexes.M44] = 0.0;
            return dest;
        },
        createViewport: function (width, height, dest) {
            if (!dest)
                dest = mirage.mat4.create();
            dest[Indexes.M11] = width / 2.0;
            dest[Indexes.M12] = 0;
            dest[Indexes.M13] = 0;
            dest[Indexes.M14] = 0;
            dest[Indexes.M21] = 0;
            dest[Indexes.M22] = -height / 2.0;
            dest[Indexes.M23] = 0;
            dest[Indexes.M24] = 0;
            dest[Indexes.M31] = 0;
            dest[Indexes.M32] = 0;
            dest[Indexes.M33] = 1;
            dest[Indexes.M34] = 0;
            dest[Indexes.OffsetX] = width / 2.0;
            dest[Indexes.OffsetY] = height / 2.0;
            dest[Indexes.OffsetZ] = 0;
            dest[Indexes.M44] = 1;
            return dest;
        }
    };
})(mirage || (mirage = {}));
var mat4 = mirage.mat4;
/// <reference path="../Rect" />
var mirage;
(function (mirage) {
    mirage.Rect.transform4 = function (dest, projection) {
        console.warn("[Rect.transform4] Not implemented");
    };
    function clipmask(clip) {
        var mask = 0;
        if (-clip[0] + clip[3] < 0)
            mask |= (1 << 0);
        if (clip[0] + clip[3] < 0)
            mask |= (1 << 1);
        if (-clip[1] + clip[3] < 0)
            mask |= (1 << 2);
        if (clip[1] + clip[3] < 0)
            mask |= (1 << 3);
        if (clip[2] + clip[3] < 0)
            mask |= (1 << 4);
        if (-clip[2] + clip[3] < 0)
            mask |= (1 << 5);
        return mask;
    }
})(mirage || (mirage = {}));
var mirage;
(function (mirage) {
    var createTypedArray;
    if (typeof Float32Array !== "undefined") {
        createTypedArray = function (length) {
            return new Float32Array(length);
        };
    }
    else {
        createTypedArray = function (length) {
            return new Array(length);
        };
    }
    mirage.vec4 = {
        create: function (x, y, z, w) {
            var dest = createTypedArray(4);
            dest[0] = x;
            dest[1] = y;
            dest[2] = z;
            dest[3] = w;
            return dest;
        },
        init: function (x, y, z, w, dest) {
            if (!dest)
                dest = createTypedArray(4);
            dest[0] = x;
            dest[1] = y;
            dest[2] = z;
            dest[3] = w;
            return dest;
        }
    };
})(mirage || (mirage = {}));
var vec4 = mirage.vec4;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl92ZXJzaW9uLnRzIiwiQ29ybmVyUmFkaXVzLnRzIiwiRW51bXMudHMiLCJjb3JlL0xheW91dE5vZGUudHMiLCJQYW5lbC50cyIsIlBvaW50LnRzIiwibWF0L3ZlYzIudHMiLCJSZWN0LnRzIiwiU2l6ZS50cyIsIlN0YWNrUGFuZWwudHMiLCJUaGlja25lc3MudHMiLCJWZWN0b3IudHMiLCJWaXNpYmlsaXR5LnRzIiwiY29yZS9BcnJhbmdlci50cyIsImNvcmUvRGVmYXVsdExheW91dFRyZWUudHMiLCJjb3JlL0xheW91dEZsYWdzLnRzIiwiY29yZS9NZWFzdXJlci50cyIsImNvcmUvdXRpbC50cyIsImRyYWZ0L0FycmFuZ2VEcmFmdGVyLnRzIiwiZHJhZnQvRHJhZnRlci50cyIsImRyYWZ0L01lYXN1cmVEcmFmdGVyLnRzIiwiZHJhZnQvU2l6ZURyYWZ0ZXIudHMiLCJtYXQvbWF0My50cyIsIm1hdC9tYXQ0LnRzIiwibWF0L3RyYW5zZm9ybTQudHMiLCJtYXQvdmVjNC50cyJdLCJuYW1lcyI6WyJtaXJhZ2UiLCJtaXJhZ2UuQ29ybmVyUmFkaXVzIiwibWlyYWdlLkNvcm5lclJhZGl1cy5jb25zdHJ1Y3RvciIsIm1pcmFnZS5Db3JuZXJSYWRpdXMuaXNFbXB0eSIsIm1pcmFnZS5Db3JuZXJSYWRpdXMuaXNFcXVhbCIsIm1pcmFnZS5Db3JuZXJSYWRpdXMuY2xlYXIiLCJtaXJhZ2UuQ29ybmVyUmFkaXVzLmNvcHlUbyIsIm1pcmFnZS5Ib3Jpem9udGFsQWxpZ25tZW50IiwibWlyYWdlLlZlcnRpY2FsQWxpZ25tZW50IiwibWlyYWdlLk9yaWVudGF0aW9uIiwibWlyYWdlLmNvcmUiLCJtaXJhZ2UuY29yZS5MYXlvdXROb2RlIiwibWlyYWdlLmNvcmUuTGF5b3V0Tm9kZS5jb25zdHJ1Y3RvciIsIm1pcmFnZS5jb3JlLkxheW91dE5vZGUuaW5pdCIsIm1pcmFnZS5jb3JlLkxheW91dE5vZGUuY3JlYXRlSW5wdXRzIiwibWlyYWdlLmNvcmUuTGF5b3V0Tm9kZS5jcmVhdGVTdGF0ZSIsIm1pcmFnZS5jb3JlLkxheW91dE5vZGUuY3JlYXRlVHJlZSIsIm1pcmFnZS5jb3JlLkxheW91dE5vZGUuY3JlYXRlTWVhc3VyZXIiLCJtaXJhZ2UuY29yZS5MYXlvdXROb2RlLmNyZWF0ZUFycmFuZ2VyIiwibWlyYWdlLmNvcmUuTGF5b3V0Tm9kZS5zZXRQYXJlbnQiLCJtaXJhZ2UuY29yZS5MYXlvdXROb2RlLm9uRGV0YWNoZWQiLCJtaXJhZ2UuY29yZS5MYXlvdXROb2RlLm9uQXR0YWNoZWQiLCJtaXJhZ2UuY29yZS5MYXlvdXROb2RlLndhbGtEZWVwIiwibWlyYWdlLmNvcmUuTGF5b3V0Tm9kZS53YWxrRGVlcC5zdGVwIiwibWlyYWdlLmNvcmUuTGF5b3V0Tm9kZS53YWxrRGVlcC5za2lwQnJhbmNoIiwibWlyYWdlLmNvcmUuTGF5b3V0Tm9kZS5pbnZhbGlkYXRlTWVhc3VyZSIsIm1pcmFnZS5jb3JlLkxheW91dE5vZGUuZG9NZWFzdXJlIiwibWlyYWdlLmNvcmUuTGF5b3V0Tm9kZS5tZWFzdXJlIiwibWlyYWdlLmNvcmUuTGF5b3V0Tm9kZS5tZWFzdXJlT3ZlcnJpZGUiLCJtaXJhZ2UuY29yZS5MYXlvdXROb2RlLmludmFsaWRhdGVBcnJhbmdlIiwibWlyYWdlLmNvcmUuTGF5b3V0Tm9kZS5kb0FycmFuZ2UiLCJtaXJhZ2UuY29yZS5MYXlvdXROb2RlLmFycmFuZ2UiLCJtaXJhZ2UuY29yZS5MYXlvdXROb2RlLmFycmFuZ2VPdmVycmlkZSIsIm1pcmFnZS5jb3JlLkxheW91dE5vZGUuc2l6aW5nIiwibWlyYWdlLmNvcmUuTGF5b3V0Tm9kZS5vblNpemVDaGFuZ2VkIiwibWlyYWdlLlBhbmVsIiwibWlyYWdlLlBhbmVsLmNvbnN0cnVjdG9yIiwibWlyYWdlLlBhbmVsLmNyZWF0ZVRyZWUiLCJtaXJhZ2UuUGFuZWwubWVhc3VyZU92ZXJyaWRlIiwibWlyYWdlLlBhbmVsLmFycmFuZ2VPdmVycmlkZSIsIm1pcmFnZS5QYW5lbC5jaGlsZENvdW50IiwibWlyYWdlLlBhbmVsLmluc2VydENoaWxkIiwibWlyYWdlLlBhbmVsLnByZXBlbmRDaGlsZCIsIm1pcmFnZS5QYW5lbC5hcHBlbmRDaGlsZCIsIm1pcmFnZS5QYW5lbC5yZW1vdmVDaGlsZCIsIm1pcmFnZS5QYW5lbC5yZW1vdmVDaGlsZEF0IiwibWlyYWdlLlBhbmVsLmdldENoaWxkQXQiLCJtaXJhZ2UuTmV3UGFuZWxUcmVlIiwibWlyYWdlLk5ld1BhbmVsVHJlZS5zdGVwIiwibWlyYWdlLlBvaW50IiwibWlyYWdlLlBvaW50LmNvbnN0cnVjdG9yIiwibWlyYWdlLlBvaW50LmlzRXF1YWwiLCJtaXJhZ2UuUG9pbnQuY29weVRvIiwibWlyYWdlLlBvaW50LnJvdW5kIiwibWlyYWdlLmNyZWF0ZSIsIm1pcmFnZS5pbml0IiwibWlyYWdlLlJlY3RPdmVybGFwIiwibWlyYWdlLlJlY3QiLCJtaXJhZ2UuUmVjdC5jb25zdHJ1Y3RvciIsIm1pcmFnZS5SZWN0LmNsZWFyIiwibWlyYWdlLlJlY3QuZ2V0Qm90dG9tIiwibWlyYWdlLlJlY3QuZ2V0UmlnaHQiLCJtaXJhZ2UuUmVjdC5pc0VxdWFsIiwibWlyYWdlLlJlY3QuaXNFbXB0eSIsIm1pcmFnZS5SZWN0LmNvcHlUbyIsIm1pcmFnZS5SZWN0LnJvdW5kT3V0IiwibWlyYWdlLlJlY3Qucm91bmRJbiIsIm1pcmFnZS5SZWN0LmludGVyc2VjdGlvbiIsIm1pcmFnZS5SZWN0LnVuaW9uIiwibWlyYWdlLlJlY3QuaXNDb250YWluZWRJbiIsIm1pcmFnZS5SZWN0LmNvbnRhaW5zUG9pbnQiLCJtaXJhZ2UuUmVjdC5leHRlbmRUbyIsIm1pcmFnZS5SZWN0Lmdyb3ciLCJtaXJhZ2UuUmVjdC5zaHJpbmsiLCJtaXJhZ2UuUmVjdC5yZWN0SW4iLCJtaXJhZ2UuUmVjdC50cmFuc2Zvcm0iLCJtaXJhZ2UuUmVjdC50cmFuc2Zvcm00IiwibWlyYWdlLlNpemUiLCJtaXJhZ2UuU2l6ZS5jb25zdHJ1Y3RvciIsIm1pcmFnZS5TaXplLmNvcHlUbyIsIm1pcmFnZS5TaXplLmlzRXF1YWwiLCJtaXJhZ2UuU2l6ZS5pc0VtcHR5IiwibWlyYWdlLlNpemUubWF4IiwibWlyYWdlLlNpemUubWluIiwibWlyYWdlLlNpemUucm91bmQiLCJtaXJhZ2UuU2l6ZS5pc1VuZGVmIiwibWlyYWdlLlNpemUuY2xlYXIiLCJtaXJhZ2UuU2l6ZS51bmRlZiIsIm1pcmFnZS5TdGFja1BhbmVsIiwibWlyYWdlLlN0YWNrUGFuZWwuY29uc3RydWN0b3IiLCJtaXJhZ2UuU3RhY2tQYW5lbC5jcmVhdGVJbnB1dHMiLCJtaXJhZ2UuU3RhY2tQYW5lbC5tZWFzdXJlT3ZlcnJpZGUiLCJtaXJhZ2UuU3RhY2tQYW5lbC5tZWFzdXJlVmVydGljYWwiLCJtaXJhZ2UuU3RhY2tQYW5lbC5tZWFzdXJlSG9yaXpvbnRhbCIsIm1pcmFnZS5TdGFja1BhbmVsLmFycmFuZ2VPdmVycmlkZSIsIm1pcmFnZS5TdGFja1BhbmVsLmFycmFuZ2VWZXJ0aWNhbCIsIm1pcmFnZS5TdGFja1BhbmVsLmFycmFuZ2VIb3Jpem9udGFsIiwibWlyYWdlLlRoaWNrbmVzcyIsIm1pcmFnZS5UaGlja25lc3MuY29uc3RydWN0b3IiLCJtaXJhZ2UuVGhpY2tuZXNzLmFkZCIsIm1pcmFnZS5UaGlja25lc3MuY29weVRvIiwibWlyYWdlLlRoaWNrbmVzcy5pc0VtcHR5IiwibWlyYWdlLlRoaWNrbmVzcy5pc0JhbGFuY2VkIiwibWlyYWdlLlRoaWNrbmVzcy5zaHJpbmtTaXplIiwibWlyYWdlLlRoaWNrbmVzcy5zaHJpbmtSZWN0IiwibWlyYWdlLlRoaWNrbmVzcy5zaHJpbmtDb3JuZXJSYWRpdXMiLCJtaXJhZ2UuVGhpY2tuZXNzLmdyb3dTaXplIiwibWlyYWdlLlRoaWNrbmVzcy5ncm93UmVjdCIsIm1pcmFnZS5UaGlja25lc3MuZ3Jvd0Nvcm5lclJhZGl1cyIsIm1pcmFnZS5WZWN0b3IiLCJtaXJhZ2UuVmVjdG9yLmNyZWF0ZSIsIm1pcmFnZS5WZWN0b3IucmV2ZXJzZSIsIm1pcmFnZS5WZWN0b3Iub3J0aG9nb25hbCIsIm1pcmFnZS5WZWN0b3Iubm9ybWFsaXplIiwibWlyYWdlLlZlY3Rvci5yb3RhdGUiLCJtaXJhZ2UuVmVjdG9yLmFuZ2xlQmV0d2VlbiIsIm1pcmFnZS5WZWN0b3IuaXNDbG9ja3dpc2VUbyIsIm1pcmFnZS5WZWN0b3IuaW50ZXJzZWN0aW9uIiwibWlyYWdlLlZpc2liaWxpdHkiLCJtaXJhZ2UuY29yZS5OZXdBcnJhbmdlQmluZGVyIiwibWlyYWdlLmNvcmUuTmV3QXJyYW5nZXIiLCJtaXJhZ2UuY29yZS5EZWZhdWx0TGF5b3V0VHJlZSIsIm1pcmFnZS5jb3JlLkRlZmF1bHRMYXlvdXRUcmVlLmFwcGx5VGVtcGxhdGUiLCJtaXJhZ2UuY29yZS5EZWZhdWx0TGF5b3V0VHJlZS5wcm9wYWdhdGVGbGFnVXAiLCJtaXJhZ2UuY29yZS5EZWZhdWx0TGF5b3V0VHJlZS53YWxrIiwibWlyYWdlLmNvcmUuRGVmYXVsdExheW91dFRyZWUud2Fsay5zdGVwIiwibWlyYWdlLmNvcmUuTGF5b3V0RmxhZ3MiLCJtaXJhZ2UuY29yZS5OZXdNZWFzdXJlQmluZGVyIiwibWlyYWdlLmNvcmUuTmV3TWVhc3VyZXIiLCJtaXJhZ2UuY29yZS5jb2VyY2VTaXplIiwibWlyYWdlLmRyYWZ0IiwibWlyYWdlLmRyYWZ0Lk5ld0FycmFuZ2VEcmFmdGVyIiwibWlyYWdlLmRyYWZ0Lk5ld0FycmFuZ2VEcmFmdGVyLmZsdXNoIiwibWlyYWdlLmRyYWZ0Lk5ld0FycmFuZ2VEcmFmdGVyLnByZXBhcmUiLCJtaXJhZ2UuZHJhZnQuTmV3QXJyYW5nZURyYWZ0ZXIuZHJhZnQiLCJtaXJhZ2UuZHJhZnQuTmV3RHJhZnRlciIsIm1pcmFnZS5kcmFmdC5OZXdEcmFmdGVyLnJ1bkRyYWZ0IiwibWlyYWdlLmRyYWZ0Lk5ld01lYXN1cmVEcmFmdGVyIiwibWlyYWdlLmRyYWZ0Lk5ld01lYXN1cmVEcmFmdGVyLnByZXBhcmUiLCJtaXJhZ2UuZHJhZnQuTmV3TWVhc3VyZURyYWZ0ZXIuZHJhZnQiLCJtaXJhZ2UuZHJhZnQuTmV3U2l6ZURyYWZ0ZXIiLCJtaXJhZ2UuZHJhZnQuTmV3U2l6ZURyYWZ0ZXIuZmx1c2giLCJtaXJhZ2UuZHJhZnQuTmV3U2l6ZURyYWZ0ZXIucHJlcGFyZSIsIm1pcmFnZS5kcmFmdC5OZXdTaXplRHJhZnRlci5kcmFmdCIsIm1pcmFnZS5kcmFmdC5OZXdTaXplRHJhZnRlci5ub3RpZnkiLCJtaXJhZ2UuY29weVRvIiwibWlyYWdlLmlkZW50aXR5IiwibWlyYWdlLmVxdWFsIiwibWlyYWdlLm11bHRpcGx5IiwibWlyYWdlLmludmVyc2UiLCJtaXJhZ2UudHJhbnNmb3JtVmVjMiIsIm1pcmFnZS5jcmVhdGVUcmFuc2xhdGUiLCJtaXJhZ2UudHJhbnNsYXRlIiwibWlyYWdlLmNyZWF0ZVNjYWxlIiwibWlyYWdlLnNjYWxlIiwibWlyYWdlLmNyZWF0ZVJvdGF0ZSIsIm1pcmFnZS5jcmVhdGVTa2V3IiwibWlyYWdlLnByZWFwcGx5IiwibWlyYWdlLmFwcGx5IiwibWlyYWdlLnNpbXBsZV9pbnZlcnNlIiwibWlyYWdlLmNvbXBsZXhfaW52ZXJzZSIsIm1pcmFnZS5JbmRleGVzIiwibWlyYWdlLnRyYW5zcG9zZSIsIm1pcmFnZS50cmFuc2Zvcm1WZWM0IiwibWlyYWdlLmNyZWF0ZVJvdGF0ZVgiLCJtaXJhZ2UuY3JlYXRlUm90YXRlWSIsIm1pcmFnZS5jcmVhdGVSb3RhdGVaIiwibWlyYWdlLmNyZWF0ZVBlcnNwZWN0aXZlIiwibWlyYWdlLmNyZWF0ZVZpZXdwb3J0IiwibWlyYWdlLmNsaXBtYXNrIl0sIm1hcHBpbmdzIjoiQUFBQSxJQUFPLE1BQU0sQ0FFWjtBQUZELFdBQU8sTUFBTSxFQUFDLENBQUM7SUFDQUEsY0FBT0EsR0FBR0EsT0FBT0EsQ0FBQ0E7QUFDakNBLENBQUNBLEVBRk0sTUFBTSxLQUFOLE1BQU0sUUFFWjtBQ0ZELElBQVUsTUFBTSxDQThDZjtBQTlDRCxXQUFVLE1BQU0sRUFBQyxDQUFDO0lBUWRBO1FBTUlDLHNCQUFhQSxPQUFnQkEsRUFBRUEsUUFBaUJBLEVBQUVBLFdBQW9CQSxFQUFFQSxVQUFtQkE7WUFDdkZDLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLE9BQU9BLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLEdBQUdBLE9BQU9BLENBQUNBO1lBQzdDQSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxRQUFRQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxHQUFHQSxRQUFRQSxDQUFDQTtZQUNoREEsSUFBSUEsQ0FBQ0EsV0FBV0EsR0FBR0EsV0FBV0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsR0FBR0EsV0FBV0EsQ0FBQ0E7WUFDekRBLElBQUlBLENBQUNBLFVBQVVBLEdBQUdBLFVBQVVBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLEdBQUdBLFVBQVVBLENBQUNBO1FBQzFEQSxDQUFDQTtRQUVNRCxvQkFBT0EsR0FBZEEsVUFBZ0JBLEVBQWlCQTtZQUM3QkUsTUFBTUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsT0FBT0EsS0FBS0EsQ0FBQ0E7bUJBQ2hCQSxFQUFFQSxDQUFDQSxRQUFRQSxLQUFLQSxDQUFDQTttQkFDakJBLEVBQUVBLENBQUNBLFdBQVdBLEtBQUtBLENBQUNBO21CQUNwQkEsRUFBRUEsQ0FBQ0EsVUFBVUEsS0FBS0EsQ0FBQ0EsQ0FBQ0E7UUFDL0JBLENBQUNBO1FBRU1GLG9CQUFPQSxHQUFkQSxVQUFnQkEsR0FBa0JBLEVBQUVBLEdBQWtCQTtZQUNsREcsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsT0FBT0EsS0FBS0EsR0FBR0EsQ0FBQ0EsT0FBT0E7bUJBQzNCQSxHQUFHQSxDQUFDQSxRQUFRQSxLQUFLQSxHQUFHQSxDQUFDQSxRQUFRQTttQkFDN0JBLEdBQUdBLENBQUNBLFdBQVdBLEtBQUtBLEdBQUdBLENBQUNBLFdBQVdBO21CQUNuQ0EsR0FBR0EsQ0FBQ0EsVUFBVUEsS0FBS0EsR0FBR0EsQ0FBQ0EsVUFBVUEsQ0FBQ0E7UUFDN0NBLENBQUNBO1FBRU1ILGtCQUFLQSxHQUFaQSxVQUFjQSxJQUFtQkE7WUFDN0JJLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBLFdBQVdBLEdBQUdBLElBQUlBLENBQUNBLFVBQVVBLEdBQUdBLENBQUNBLENBQUNBO1FBQzFFQSxDQUFDQTtRQUVNSixtQkFBTUEsR0FBYkEsVUFBZUEsR0FBa0JBLEVBQUVBLElBQW1CQTtZQUNsREssSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0E7WUFDM0JBLElBQUlBLENBQUNBLFFBQVFBLEdBQUdBLEdBQUdBLENBQUNBLFFBQVFBLENBQUNBO1lBQzdCQSxJQUFJQSxDQUFDQSxXQUFXQSxHQUFHQSxHQUFHQSxDQUFDQSxXQUFXQSxDQUFDQTtZQUNuQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsR0FBR0EsR0FBR0EsQ0FBQ0EsVUFBVUEsQ0FBQ0E7UUFDckNBLENBQUNBO1FBQ0xMLG1CQUFDQTtJQUFEQSxDQXJDQUQsQUFxQ0NDLElBQUFEO0lBckNZQSxtQkFBWUEsZUFxQ3hCQSxDQUFBQTtBQUNMQSxDQUFDQSxFQTlDUyxNQUFNLEtBQU4sTUFBTSxRQThDZjtBQzlDRCxJQUFVLE1BQU0sQ0FpQmY7QUFqQkQsV0FBVSxNQUFNLEVBQUMsQ0FBQztJQUNkQSxXQUFZQSxtQkFBbUJBO1FBQzNCTyw2REFBUUEsQ0FBQUE7UUFDUkEsaUVBQVVBLENBQUFBO1FBQ1ZBLCtEQUFTQSxDQUFBQTtRQUNUQSxtRUFBV0EsQ0FBQUE7SUFDZkEsQ0FBQ0EsRUFMV1AsMEJBQW1CQSxLQUFuQkEsMEJBQW1CQSxRQUs5QkE7SUFMREEsSUFBWUEsbUJBQW1CQSxHQUFuQkEsMEJBS1hBLENBQUFBO0lBQ0RBLFdBQVlBLGlCQUFpQkE7UUFDekJRLHVEQUFPQSxDQUFBQTtRQUNQQSw2REFBVUEsQ0FBQUE7UUFDVkEsNkRBQVVBLENBQUFBO1FBQ1ZBLCtEQUFXQSxDQUFBQTtJQUNmQSxDQUFDQSxFQUxXUix3QkFBaUJBLEtBQWpCQSx3QkFBaUJBLFFBSzVCQTtJQUxEQSxJQUFZQSxpQkFBaUJBLEdBQWpCQSx3QkFLWEEsQ0FBQUE7SUFDREEsV0FBWUEsV0FBV0E7UUFDbkJTLHlEQUFjQSxDQUFBQTtRQUNkQSxxREFBWUEsQ0FBQUE7SUFDaEJBLENBQUNBLEVBSFdULGtCQUFXQSxLQUFYQSxrQkFBV0EsUUFHdEJBO0lBSERBLElBQVlBLFdBQVdBLEdBQVhBLGtCQUdYQSxDQUFBQTtBQUNMQSxDQUFDQSxFQWpCUyxNQUFNLEtBQU4sTUFBTSxRQWlCZjtBQ2pCRCxJQUFVLE1BQU0sQ0F5TmY7QUF6TkQsV0FBVSxNQUFNO0lBQUNBLElBQUFBLElBQUlBLENBeU5wQkE7SUF6TmdCQSxXQUFBQSxJQUFJQSxFQUFDQSxDQUFDQTtRQWdDbkJVO1lBVUlDO2dCQUNJQyxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtZQUNoQkEsQ0FBQ0E7WUFFREQseUJBQUlBLEdBQUpBO2dCQUNJRSxNQUFNQSxDQUFDQSxnQkFBZ0JBLENBQUNBLElBQUlBLEVBQUVBO29CQUMxQkEsUUFBUUEsRUFBRUEsRUFBQ0EsS0FBS0EsRUFBRUEsSUFBSUEsQ0FBQ0EsWUFBWUEsRUFBRUEsRUFBRUEsUUFBUUEsRUFBRUEsS0FBS0EsRUFBQ0E7b0JBQ3ZEQSxPQUFPQSxFQUFFQSxFQUFDQSxLQUFLQSxFQUFFQSxJQUFJQSxDQUFDQSxXQUFXQSxFQUFFQSxFQUFFQSxRQUFRQSxFQUFFQSxLQUFLQSxFQUFDQTtvQkFDckRBLE1BQU1BLEVBQUVBLEVBQUNBLEtBQUtBLEVBQUVBLElBQUlBLENBQUNBLFVBQVVBLEVBQUVBLEVBQUVBLFFBQVFBLEVBQUVBLEtBQUtBLEVBQUNBO2lCQUN0REEsQ0FBQ0EsQ0FBQ0E7Z0JBQ0hBLElBQUlBLENBQUNBLFNBQVNBLEdBQUdBLElBQUlBLENBQUNBLGNBQWNBLEVBQUVBLENBQUNBO2dCQUN2Q0EsSUFBSUEsQ0FBQ0EsU0FBU0EsR0FBR0EsSUFBSUEsQ0FBQ0EsY0FBY0EsRUFBRUEsQ0FBQ0E7Z0JBQ3ZDQSxJQUFJQSxDQUFDQSxjQUFjQSxHQUFHQSxxQkFBZ0JBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLEVBQUVBLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBO2dCQUM5RUEsSUFBSUEsQ0FBQ0EsY0FBY0EsR0FBR0EscUJBQWdCQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxFQUFFQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtZQUNsRkEsQ0FBQ0E7WUFFU0YsaUNBQVlBLEdBQXRCQTtnQkFDSUcsTUFBTUEsQ0FBQ0E7b0JBQ0hBLE9BQU9BLEVBQUVBLElBQUlBO29CQUNiQSxpQkFBaUJBLEVBQUVBLElBQUlBO29CQUN2QkEsTUFBTUEsRUFBRUEsSUFBSUEsZ0JBQVNBLEVBQUVBO29CQUN2QkEsS0FBS0EsRUFBRUEsR0FBR0E7b0JBQ1ZBLE1BQU1BLEVBQUVBLEdBQUdBO29CQUNYQSxRQUFRQSxFQUFFQSxHQUFHQTtvQkFDYkEsU0FBU0EsRUFBRUEsR0FBR0E7b0JBQ2RBLFFBQVFBLEVBQUVBLE1BQU1BLENBQUNBLGlCQUFpQkE7b0JBQ2xDQSxTQUFTQSxFQUFFQSxNQUFNQSxDQUFDQSxpQkFBaUJBO29CQUNuQ0EsbUJBQW1CQSxFQUFFQSwwQkFBbUJBLENBQUNBLE9BQU9BO29CQUNoREEsaUJBQWlCQSxFQUFFQSx3QkFBaUJBLENBQUNBLE9BQU9BO2lCQUMvQ0EsQ0FBQ0E7WUFDTkEsQ0FBQ0E7WUFFU0gsZ0NBQVdBLEdBQXJCQTtnQkFDSUksTUFBTUEsQ0FBQ0E7b0JBQ0hBLEtBQUtBLEVBQUVBLGdCQUFXQSxDQUFDQSxJQUFJQTtvQkFDdkJBLGlCQUFpQkEsRUFBRUEsSUFBSUEsV0FBSUEsRUFBRUE7b0JBQzdCQSxXQUFXQSxFQUFFQSxJQUFJQSxXQUFJQSxFQUFFQTtvQkFDdkJBLFlBQVlBLEVBQUVBLElBQUlBLFdBQUlBLEVBQUVBO29CQUN4QkEsVUFBVUEsRUFBRUEsSUFBSUEsV0FBSUEsRUFBRUE7b0JBQ3RCQSxZQUFZQSxFQUFFQSxJQUFJQSxZQUFLQSxFQUFFQTtvQkFDekJBLFFBQVFBLEVBQUVBLElBQUlBLFdBQUlBLEVBQUVBO29CQUNwQkEsWUFBWUEsRUFBRUEsSUFBSUEsV0FBSUEsRUFBRUE7aUJBQzNCQSxDQUFDQTtZQUNOQSxDQUFDQTtZQUVTSiwrQkFBVUEsR0FBcEJBO2dCQUNJSyxNQUFNQSxDQUFDQSxzQkFBaUJBLEVBQUVBLENBQUNBO1lBQy9CQSxDQUFDQTtZQUVTTCxtQ0FBY0EsR0FBeEJBO2dCQUFBTSxpQkFFQ0E7Z0JBREdBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLEtBQUtBLEVBQUVBLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLFVBQUFBLFVBQVVBLElBQUlBLE9BQUFBLEtBQUlBLENBQUNBLGVBQWVBLENBQUNBLFVBQVVBLENBQUNBLEVBQWhDQSxDQUFnQ0EsQ0FBQ0EsQ0FBQ0E7WUFDaEhBLENBQUNBO1lBRVNOLG1DQUFjQSxHQUF4QkE7Z0JBQUFPLGlCQUVDQTtnQkFER0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsRUFBRUEsSUFBSUEsQ0FBQ0EsS0FBS0EsRUFBRUEsSUFBSUEsQ0FBQ0EsSUFBSUEsRUFBRUEsVUFBQUEsV0FBV0EsSUFBSUEsT0FBQUEsS0FBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsRUFBakNBLENBQWlDQSxDQUFDQSxDQUFDQTtZQUNsSEEsQ0FBQ0E7WUFJRFAsOEJBQVNBLEdBQVRBLFVBQVVBLE1BQWtCQTtnQkFDeEJRLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO29CQUNWQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQTt3QkFDbEJBLE1BQU1BLENBQUNBO29CQUNYQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQTtvQkFDeEJBLElBQUlBLENBQUNBLFVBQVVBLEVBQUVBLENBQUNBO2dCQUN0QkEsQ0FBQ0E7Z0JBQUNBLElBQUlBLENBQUNBLENBQUNBO29CQUNKQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxLQUFLQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQTt3QkFDNUJBLE1BQU1BLENBQUNBO29CQUNYQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQTtvQkFDeEJBLElBQUlBLENBQUNBLFVBQVVBLEVBQUVBLENBQUNBO29CQUNsQkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsTUFBTUEsQ0FBQ0E7b0JBQzFCQSxJQUFJQSxDQUFDQSxVQUFVQSxFQUFFQSxDQUFDQTtnQkFDdEJBLENBQUNBO1lBQ0xBLENBQUNBO1lBRVNSLCtCQUFVQSxHQUFwQkE7Z0JBQ0lTLElBQUlBLENBQUNBLGlCQUFpQkEsRUFBRUEsQ0FBQ0E7Z0JBQ3pCQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQTtvQkFDakJBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLGlCQUFpQkEsRUFBRUEsQ0FBQ0E7Z0JBQ3pDQSxXQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtZQUN0Q0EsQ0FBQ0E7WUFFU1QsK0JBQVVBLEdBQXBCQTtnQkFDSVUsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0E7Z0JBQ3ZCQSxXQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxpQkFBaUJBLENBQUNBLENBQUNBO2dCQUNwQ0EsV0FBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7Z0JBQzNCQSxJQUFJQSxDQUFDQSxpQkFBaUJBLEVBQUVBLENBQUNBO2dCQUN6QkEsSUFBSUEsQ0FBQ0EsaUJBQWlCQSxFQUFFQSxDQUFDQTtnQkFDekJBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLEdBQUdBLGdCQUFXQSxDQUFDQSxRQUFRQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxLQUFLQSxDQUFDQSxZQUFZQSxLQUFLQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDL0VBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLGdCQUFXQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtnQkFDcERBLENBQUNBO1lBQ0xBLENBQUNBO1lBRURWLDZCQUFRQSxHQUFSQSxVQUFTQSxPQUFpQkE7Z0JBQ3RCVyxJQUFJQSxJQUFJQSxHQUFlQSxTQUFTQSxDQUFDQTtnQkFDakNBLElBQUlBLFFBQVFBLEdBQWlCQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFFcENBLE1BQU1BLENBQUNBO29CQUNIQSxPQUFPQSxFQUFFQSxTQUFTQTtvQkFDbEJBLElBQUlBO3dCQUNBQyxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFDUEEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsU0FBU0EsR0FBR0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsRUFBRUEsU0FBU0EsQ0FBQ0EsSUFBSUEsRUFBRUEsR0FBR0EsQ0FBQ0E7Z0NBQzlEQSxRQUFRQSxDQUFDQSxPQUFPQSxDQUFDQSxTQUFTQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTs0QkFDeENBLENBQUNBO3dCQUNMQSxDQUFDQTt3QkFFREEsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsSUFBSUEsR0FBR0EsUUFBUUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0E7d0JBQ3ZDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxLQUFLQSxTQUFTQSxDQUFDQTtvQkFDdENBLENBQUNBO29CQUNERCxVQUFVQTt3QkFDTkUsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0E7b0JBQ3JCQSxDQUFDQTtpQkFDSkYsQ0FBQ0E7WUFDTkEsQ0FBQ0E7WUFJRFgsc0NBQWlCQSxHQUFqQkE7Z0JBQ0ljLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLElBQUlBLGdCQUFXQSxDQUFDQSxPQUFPQSxHQUFHQSxnQkFBV0EsQ0FBQ0EsV0FBV0EsQ0FBQ0E7Z0JBQ2xFQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxnQkFBV0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0E7WUFDdkRBLENBQUNBO1lBRURkLDhCQUFTQSxHQUFUQTtnQkFDSWUsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsY0FBY0EsRUFBRUEsQ0FBQ0E7WUFDakNBLENBQUNBO1lBRURmLDRCQUFPQSxHQUFQQSxVQUFRQSxhQUFvQkE7Z0JBQ3hCZ0IsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsQ0FBQ0E7WUFDekNBLENBQUNBO1lBRVNoQixvQ0FBZUEsR0FBekJBLFVBQTBCQSxVQUFpQkE7Z0JBQ3ZDaUIsSUFBSUEsT0FBT0EsR0FBR0EsSUFBSUEsV0FBSUEsRUFBRUEsQ0FBQ0E7Z0JBQ3pCQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxFQUFFQSxNQUFNQSxDQUFDQSxJQUFJQSxFQUFFQSxHQUFHQSxDQUFDQTtvQkFDakRBLE1BQU1BLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO29CQUNuQ0EsV0FBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsT0FBT0EsRUFBRUEsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3hEQSxDQUFDQTtnQkFDREEsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0E7WUFDbkJBLENBQUNBO1lBRURqQixzQ0FBaUJBLEdBQWpCQTtnQkFDSWtCLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLElBQUlBLGdCQUFXQSxDQUFDQSxPQUFPQSxHQUFHQSxnQkFBV0EsQ0FBQ0EsV0FBV0EsQ0FBQ0E7Z0JBQ2xFQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxnQkFBV0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0E7WUFDdkRBLENBQUNBO1lBRURsQiw4QkFBU0EsR0FBVEE7Z0JBQ0ltQixNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxjQUFjQSxFQUFFQSxDQUFDQTtZQUNqQ0EsQ0FBQ0E7WUFFRG5CLDRCQUFPQSxHQUFQQSxVQUFRQSxTQUFlQTtnQkFDbkJvQixNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtZQUNyQ0EsQ0FBQ0E7WUFFU3BCLG9DQUFlQSxHQUF6QkEsVUFBMEJBLFdBQWtCQTtnQkFDeENxQixJQUFJQSxRQUFRQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxXQUFXQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtnQkFDL0RBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLE1BQU1BLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLEVBQUVBLE1BQU1BLENBQUNBLElBQUlBLEVBQUVBLEdBQUdBLENBQUNBO29CQUNqREEsSUFBSUEsU0FBU0EsR0FBR0EsSUFBSUEsV0FBSUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsV0FBV0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7b0JBQ3RFQSxNQUFNQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtnQkFDdENBLENBQUNBO2dCQUNEQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQTtZQUNwQkEsQ0FBQ0E7WUFFRHJCLDJCQUFNQSxHQUFOQSxVQUFPQSxPQUFjQSxFQUFFQSxPQUFjQTtnQkFDakNzQixJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQTtnQkFDdkJBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLFlBQVlBLENBQUNBO29CQUNuQkEsV0FBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsWUFBWUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzdDQSxXQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQSxRQUFRQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtnQkFDckNBLEtBQUtBLENBQUNBLFlBQVlBLEdBQUdBLFNBQVNBLENBQUNBO2dCQUUvQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7WUFDaEJBLENBQUNBO1lBRUR0QixrQ0FBYUEsR0FBYkEsVUFBY0EsT0FBY0EsRUFBRUEsT0FBY0E7WUFFNUN1QixDQUFDQTtZQUNMdkIsaUJBQUNBO1FBQURBLENBeExBRCxBQXdMQ0MsSUFBQUQ7UUF4TFlBLGVBQVVBLGFBd0x0QkEsQ0FBQUE7SUFDTEEsQ0FBQ0EsRUF6TmdCVixJQUFJQSxHQUFKQSxXQUFJQSxLQUFKQSxXQUFJQSxRQXlOcEJBO0FBQURBLENBQUNBLEVBek5TLE1BQU0sS0FBTixNQUFNLFFBeU5mO0FDek5ELHdDQUF3Qzs7Ozs7O0FBRXhDLElBQVUsTUFBTSxDQTRHZjtBQTVHRCxXQUFVLE1BQU0sRUFBQyxDQUFDO0lBQ2RBO1FBQTJCbUMseUJBQWVBO1FBQTFDQTtZQUEyQkMsOEJBQWVBO1FBZ0UxQ0EsQ0FBQ0E7UUE3RGFELDBCQUFVQSxHQUFwQkE7WUFDSUUsTUFBTUEsQ0FBQ0EsWUFBWUEsRUFBRUEsQ0FBQ0E7UUFDMUJBLENBQUNBO1FBRVNGLCtCQUFlQSxHQUF6QkEsVUFBMEJBLFVBQWlCQTtZQUN2Q0csTUFBTUEsQ0FBQ0EsSUFBSUEsV0FBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsS0FBS0EsRUFBRUEsVUFBVUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFDekRBLENBQUNBO1FBRVNILCtCQUFlQSxHQUF6QkEsVUFBMEJBLFdBQWtCQTtZQUN4Q0ksTUFBTUEsQ0FBQ0EsSUFBSUEsV0FBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsV0FBV0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFDM0RBLENBQUNBO1FBRURKLHNCQUFJQSw2QkFBVUE7aUJBQWRBO2dCQUNJSyxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUNyQ0EsQ0FBQ0E7OztXQUFBTDtRQUVEQSwyQkFBV0EsR0FBWEEsVUFBWUEsS0FBc0JBLEVBQUVBLEtBQWFBO1lBQzdDTSxJQUFJQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQTtZQUNsQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsSUFBSUEsUUFBUUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzNCQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtZQUM1QkEsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3BCQSxJQUFJQSxDQUFDQSxZQUFZQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtZQUM3QkEsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ0pBLFFBQVFBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLEtBQUtBLENBQUNBLENBQUNBO2dCQUNqQ0EsS0FBS0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDMUJBLENBQUNBO1FBQ0xBLENBQUNBO1FBRUROLDRCQUFZQSxHQUFaQSxVQUFhQSxLQUFzQkE7WUFDL0JPLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1lBQ2xDQSxLQUFLQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMxQkEsQ0FBQ0E7UUFFRFAsMkJBQVdBLEdBQVhBLFVBQVlBLEtBQXNCQTtZQUM5QlEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7WUFDL0JBLEtBQUtBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQzFCQSxDQUFDQTtRQUVEUiwyQkFBV0EsR0FBWEEsVUFBWUEsS0FBc0JBO1lBQzlCUyxJQUFJQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQTtZQUNsQ0EsSUFBSUEsS0FBS0EsR0FBR0EsUUFBUUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7WUFDcENBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEdBQUdBLENBQUNBLENBQUNBO2dCQUNWQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQTtZQUNqQkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDcENBLEtBQUtBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQ3RCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtRQUNoQkEsQ0FBQ0E7UUFFRFQsNkJBQWFBLEdBQWJBLFVBQWNBLEtBQWFBO1lBQ3ZCVSxJQUFJQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQTtZQUNsQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsR0FBR0EsQ0FBQ0EsSUFBSUEsS0FBS0EsSUFBSUEsUUFBUUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7Z0JBQ3RDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtZQUNoQkEsSUFBSUEsT0FBT0EsR0FBR0EsUUFBUUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0NBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBO2dCQUNSQSxPQUFPQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUM1QkEsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0E7UUFDbkJBLENBQUNBO1FBRURWLDBCQUFVQSxHQUFWQSxVQUFXQSxLQUFhQTtZQUNwQlcsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7UUFDckNBLENBQUNBO1FBQ0xYLFlBQUNBO0lBQURBLENBaEVBbkMsQUFnRUNtQyxFQWhFMEJuQyxXQUFJQSxDQUFDQSxVQUFVQSxFQWdFekNBO0lBaEVZQSxZQUFLQSxRQWdFakJBLENBQUFBO0lBTURBO1FBQ0krQyxJQUFJQSxJQUFJQSxHQUFlQSxXQUFJQSxDQUFDQSxpQkFBaUJBLEVBQUVBLENBQUNBO1FBQ2hEQSxJQUFJQSxDQUFDQSxpQkFBaUJBLEdBQUdBLElBQUlBLENBQUNBO1FBQzlCQSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUNuQkEsSUFBSUEsQ0FBQ0EsSUFBSUEsR0FBR0EsVUFBQ0EsT0FBaUJBO1lBQzFCQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDWEEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ1hBLE1BQU1BLENBQUNBO29CQUNIQSxPQUFPQSxFQUFFQSxTQUFTQTtvQkFDbEJBLElBQUlBO3dCQUNBQyxDQUFDQSxFQUFFQSxDQUFDQTt3QkFDSkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBQzVCQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxTQUFTQSxDQUFDQTs0QkFDekJBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBO3dCQUNqQkEsQ0FBQ0E7d0JBQ0RBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO3dCQUNoQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7b0JBQ2hCQSxDQUFDQTtpQkFDSkQsQ0FBQ0E7WUFDTkEsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ0pBLElBQUlBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLE1BQU1BLENBQUNBO2dCQUM3QkEsTUFBTUEsQ0FBQ0E7b0JBQ0hBLE9BQU9BLEVBQUVBLFNBQVNBO29CQUNsQkEsSUFBSUE7d0JBQ0FDLENBQUNBLEVBQUVBLENBQUNBO3dCQUNKQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFDUkEsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsU0FBU0EsQ0FBQ0E7NEJBQ3pCQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQTt3QkFDakJBLENBQUNBO3dCQUNEQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDaENBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO29CQUNoQkEsQ0FBQ0E7aUJBQ0pELENBQUFBO1lBQ0xBLENBQUNBO1FBQ0xBLENBQUNBLENBQUNBO1FBQ0ZBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2hCQSxDQUFDQTtJQXBDZS9DLG1CQUFZQSxlQW9DM0JBLENBQUFBO0FBQ0xBLENBQUNBLEVBNUdTLE1BQU0sS0FBTixNQUFNLFFBNEdmO0FDOUdELElBQVUsTUFBTSxDQThCZjtBQTlCRCxXQUFVLE1BQU0sRUFBQyxDQUFDO0lBTWRBO1FBSUlpRCxlQUFZQSxDQUFVQSxFQUFFQSxDQUFVQTtZQUM5QkMsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDM0JBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBQy9CQSxDQUFDQTtRQUVNRCxhQUFPQSxHQUFkQSxVQUFlQSxFQUFVQSxFQUFFQSxFQUFVQTtZQUNqQ0UsTUFBTUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7bUJBQ2JBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1FBQ3pCQSxDQUFDQTtRQUVNRixZQUFNQSxHQUFiQSxVQUFjQSxHQUFXQSxFQUFFQSxJQUFZQTtZQUNuQ0csSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDZkEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDbkJBLENBQUNBO1FBRU1ILFdBQUtBLEdBQVpBLFVBQWFBLElBQVlBO1lBQ3JCSSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUM1QkEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDaENBLENBQUNBO1FBQ0xKLFlBQUNBO0lBQURBLENBdkJBakQsQUF1QkNpRCxJQUFBakQ7SUF2QllBLFlBQUtBLFFBdUJqQkEsQ0FBQUE7QUFDTEEsQ0FBQ0EsRUE5QlMsTUFBTSxLQUFOLE1BQU0sUUE4QmY7QUMxQkQsSUFBVSxNQUFNLENBMkJmO0FBM0JELFdBQVUsTUFBTSxFQUFDLENBQUM7SUFDZEEsSUFBSUEsZ0JBQThDQSxDQUFDQTtJQUVuREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsWUFBWUEsS0FBS0EsV0FBV0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDdENBLGdCQUFnQkEsR0FBR0EsVUFBVUEsTUFBY0E7WUFDdkMsTUFBTSxDQUFnQixJQUFJLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuRCxDQUFDLENBQUNBO0lBQ05BLENBQUNBO0lBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ0pBLGdCQUFnQkEsR0FBR0EsVUFBVUEsTUFBY0E7WUFDdkMsTUFBTSxDQUFXLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsQ0FBQ0E7SUFDTkEsQ0FBQ0E7SUFFVUEsV0FBSUEsR0FBbUJBO1FBQzlCQSxNQUFNQSxZQUFFQSxDQUFTQSxFQUFFQSxDQUFTQTtZQUN4QnNELElBQUlBLElBQUlBLEdBQUdBLGdCQUFnQkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDL0JBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ1pBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ1pBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO1FBQ2hCQSxDQUFDQTtRQUNEdEQsSUFBSUEsWUFBRUEsQ0FBU0EsRUFBRUEsQ0FBU0EsRUFBRUEsSUFBZUE7WUFDdkN1RCxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQTtnQkFBQ0EsSUFBSUEsR0FBR0EsZ0JBQWdCQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN0Q0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDWkEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDWkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLENBQUNBO0tBQ0p2RCxDQUFDQTtBQUNOQSxDQUFDQSxFQTNCUyxNQUFNLEtBQU4sTUFBTSxRQTJCZjtBQUVELElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7QUNqQ3ZCLGlDQUFpQztBQUVqQyxJQUFVLE1BQU0sQ0FtTmY7QUFuTkQsV0FBVSxNQUFNLEVBQUMsQ0FBQztJQUNkQSxXQUFZQSxXQUFXQTtRQUNuQndELDJDQUFHQSxDQUFBQTtRQUNIQSx5Q0FBRUEsQ0FBQUE7UUFDRkEsNkNBQUlBLENBQUFBO0lBQ1JBLENBQUNBLEVBSld4RCxrQkFBV0EsS0FBWEEsa0JBQVdBLFFBSXRCQTtJQUpEQSxJQUFZQSxXQUFXQSxHQUFYQSxrQkFJWEEsQ0FBQUE7SUFFREEsSUFBSUEsRUFBRUEsR0FBR0EsV0FBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDM0JBLElBQUlBLEVBQUVBLEdBQUdBLFdBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO0lBQzNCQSxJQUFJQSxFQUFFQSxHQUFHQSxXQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUMzQkEsSUFBSUEsRUFBRUEsR0FBR0EsV0FBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFFM0JBO1FBTUl5RCxjQUFhQSxDQUFVQSxFQUFFQSxDQUFVQSxFQUFFQSxLQUFjQSxFQUFFQSxNQUFlQTtZQUNoRUMsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDM0JBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQzNCQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxLQUFLQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQTtZQUN2Q0EsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsTUFBTUEsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsR0FBR0EsTUFBTUEsQ0FBQ0E7UUFDOUNBLENBQUNBO1FBRU1ELFVBQUtBLEdBQVpBLFVBQWNBLElBQVVBO1lBQ3BCRSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUNuREEsQ0FBQ0E7UUFFTUYsY0FBU0EsR0FBaEJBLFVBQWtCQSxJQUFVQTtZQUN4QkcsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFDaENBLENBQUNBO1FBRU1ILGFBQVFBLEdBQWZBLFVBQWlCQSxJQUFVQTtZQUN2QkksTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0E7UUFDL0JBLENBQUNBO1FBRU1KLFlBQU9BLEdBQWRBLFVBQWdCQSxLQUFXQSxFQUFFQSxLQUFXQTtZQUNwQ0ssTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7bUJBQ25CQSxLQUFLQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQTttQkFDbkJBLEtBQUtBLENBQUNBLEtBQUtBLEtBQUtBLEtBQUtBLENBQUNBLEtBQUtBO21CQUMzQkEsS0FBS0EsQ0FBQ0EsTUFBTUEsS0FBS0EsS0FBS0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFDekNBLENBQUNBO1FBRU1MLFlBQU9BLEdBQWRBLFVBQWdCQSxHQUFTQTtZQUNyQk0sTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0E7bUJBQ2ZBLEdBQUdBLENBQUNBLE1BQU1BLEtBQUtBLENBQUNBLENBQUNBO1FBQzVCQSxDQUFDQTtRQUVNTixXQUFNQSxHQUFiQSxVQUFlQSxHQUFTQSxFQUFFQSxJQUFVQTtZQUNoQ08sSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDZkEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDZkEsSUFBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0E7WUFDdkJBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLEdBQUdBLENBQUNBLE1BQU1BLENBQUNBO1FBQzdCQSxDQUFDQTtRQUVNUCxhQUFRQSxHQUFmQSxVQUFpQkEsSUFBVUE7WUFDdkJRLElBQUlBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQzNCQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzQkEsSUFBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDaERBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ2xEQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNYQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUNmQSxDQUFDQTtRQUVNUixZQUFPQSxHQUFkQSxVQUFnQkEsSUFBVUE7WUFDdEJTLElBQUlBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQzFCQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMxQkEsSUFBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDakVBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ25FQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNYQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNYQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtRQUNoQkEsQ0FBQ0E7UUFFTVQsaUJBQVlBLEdBQW5CQSxVQUFxQkEsSUFBVUEsRUFBRUEsS0FBV0E7WUFDeENVLElBQUlBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLEVBQUVBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xDQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxFQUFFQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNsQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsS0FBS0EsRUFBRUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkZBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLE1BQU1BLEVBQUVBLEtBQUtBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO1lBQ3RGQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNYQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUNmQSxDQUFDQTtRQUVNVixVQUFLQSxHQUFaQSxVQUFjQSxJQUFVQSxFQUFFQSxLQUFXQTtZQUNqQ1csRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsS0FBS0EsSUFBSUEsQ0FBQ0EsSUFBSUEsS0FBS0EsQ0FBQ0EsTUFBTUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3RDQSxNQUFNQSxDQUFDQTtZQUNYQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxNQUFNQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDdENBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO2dCQUN6QkEsTUFBTUEsQ0FBQ0E7WUFDWEEsQ0FBQ0E7WUFFREEsSUFBSUEsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbENBLElBQUlBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLEVBQUVBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xDQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxFQUFFQSxLQUFLQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0RUEsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsTUFBTUEsRUFBRUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDekVBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ1hBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBQ2ZBLENBQUNBO1FBRU1YLGtCQUFhQSxHQUFwQkEsVUFBc0JBLEdBQVNBLEVBQUVBLElBQVVBO1lBQ3ZDWSxJQUFJQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNmQSxJQUFJQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNmQSxJQUFJQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQTtZQUMzQkEsSUFBSUEsRUFBRUEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFFNUJBLElBQUlBLEVBQUVBLEdBQUdBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO1lBQ2hCQSxJQUFJQSxFQUFFQSxHQUFHQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNoQkEsSUFBSUEsRUFBRUEsR0FBR0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0E7WUFDN0JBLElBQUlBLEVBQUVBLEdBQUdBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBO1lBRTlCQSxFQUFFQSxDQUFDQSxDQUFDQSxFQUFFQSxHQUFHQSxFQUFFQSxJQUFJQSxFQUFFQSxHQUFHQSxFQUFFQSxJQUFJQSxFQUFFQSxHQUFHQSxFQUFFQSxJQUFJQSxFQUFFQSxHQUFHQSxFQUFFQSxDQUFDQTtnQkFDekNBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBO1lBQ2pCQSxFQUFFQSxDQUFDQSxDQUFDQSxFQUFFQSxHQUFHQSxFQUFFQSxJQUFJQSxFQUFFQSxHQUFHQSxFQUFFQSxJQUFJQSxFQUFFQSxHQUFHQSxFQUFFQSxJQUFJQSxFQUFFQSxHQUFHQSxFQUFFQSxDQUFDQTtnQkFDekNBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBO1lBQ2pCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtRQUNoQkEsQ0FBQ0E7UUFFTVosa0JBQWFBLEdBQXBCQSxVQUFzQkEsS0FBV0EsRUFBRUEsQ0FBUUE7WUFDdkNhLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO21CQUNkQSxLQUFLQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTttQkFDZEEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7bUJBQzlCQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUMzQ0EsQ0FBQ0E7UUFFTWIsYUFBUUEsR0FBZkEsVUFBaUJBLElBQVVBLEVBQUVBLENBQVNBLEVBQUVBLENBQVNBO1lBQzdDYyxJQUFJQSxFQUFFQSxHQUFHQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNoQkEsSUFBSUEsRUFBRUEsR0FBR0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDaEJBLElBQUlBLEVBQUVBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBO1lBQ3BCQSxJQUFJQSxFQUFFQSxHQUFHQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUVyQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3hCQSxFQUFFQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFFQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3hCQSxFQUFFQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFFQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUUzREEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDekJBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1lBQ3pCQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUNoQkEsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsRUFBRUEsQ0FBQ0E7UUFDckJBLENBQUNBO1FBRU1kLFNBQUlBLEdBQVhBLFVBQWFBLElBQVVBLEVBQUVBLElBQVlB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RXpCQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUNwQkEsV0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFDNUJBLFdBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLEVBQUVBLENBQUNBLEdBQUdBLE1BQU1BLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBO1lBQ3JDQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxNQUFNQSxFQUFFQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUU3QkEsV0FBSUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsR0FBR0EsRUFBRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFDNUJBLFdBQUlBLENBQUNBLGFBQWFBLENBQUNBLEdBQUdBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBO1lBQzVCQSxXQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxHQUFHQSxFQUFFQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUM1QkEsV0FBSUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsR0FBR0EsRUFBRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFFNUJBLElBQUlBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQzdDQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxFQUFF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QUlBLENBQUNBLE1BQU1BLENBQUNBO1lBRXpCQSxFQUFFQSxDQUFDQSxLQUFLQSxHQUFHQSxVQUFVQSxDQUFDQSxLQUFLQSxDQUFDQTtZQUM1QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JCQSxFQUFFQSxDQUFDQSxLQUFLQSxHQUFHQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQTtZQUM1QkEsRUFBRUEsQ0FBQ0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsS0FBS0EsRUFBRUEsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7WUFDL0NBLEVBQUVBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEtBQUtBLEVBQUVBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO1lBRS9DQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxFQUFFQSxNQUFNQSxDQUFDQSxJQUFJQSxFQUFFQSxHQUFHQSxDQUFDQTtnQkFDakRBLElBQUlBLEtBQUtBLEdBQUdBLE1BQU1BLENBQUNBLE9BQU9BLENBQUNBO2dCQUMzQkEsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7Z0JBRWxCQSxJQUFJQSxZQUFZQSxHQUFHQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxXQUFXQSxDQUFDQTtnQkFDM0NBLFFBQVFBLENBQUNBLE1BQU1BLElBQUlBLFlBQVlBLENBQUNBLE1BQU1BLENBQUNBO2dCQUN2Q0EsUUFBUUEsQ0FBQ0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsRUFBRUEsWUFBWUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7WUFDbEVBLENBQUNBO1lBRURBLE1B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Q0FBQ0EsR0FBR0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsRUFBRUEsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDekZBLElBQUlBLENBQUNBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLFNBQVNBLENBQUNBLEtBQUtBLEVBQUVBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1lBQzVGQSxJQUFJQSxDQUFDQSxXQUFXQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxXQUFXQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxTQUFTQSxDQUFDQSxLQUFLQSxFQUFFQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNyR0EsSUFBSUEsQ0FBQ0EsVUFBVUEsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsRUFBRUEsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDdEdBLENBQUNBO1FBRU1SLGtCQUFRQSxHQUFmQSxVQUFpQkEsU0FBb0JBLEVBQUVBLElBQVVBO1lBQzdDUyxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQTtZQUNuQkEsSUFBSUEsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFDcEJBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLE1BQU1BLENBQUNBLGlCQUFpQkEsQ0FBQ0E7Z0JBQzlCQSxDQUFDQSxJQUFJQSxTQUFTQSxDQUFDQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxLQUFLQSxDQUFDQTtZQUMxQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsTUFBTUEsQ0FBQ0EsaUJBQWlCQSxDQUFDQTtnQkFDOUJBLENBQUNBLElBQUlBLFNBQVNBLENBQUNBLEdBQUdBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQzFDQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUMzQkEsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDNUJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO1FBQ2hCQSxDQUFDQTtRQUVNVCxrQkFBUUEsR0FBZkEsVUFBaUJBLFNBQW9CQSxFQUFFQSxJQUFVQTtZQUM3Q1UsSUFBSUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0E7WUFDekJBLElBQUlBLENBQUNBLENBQUNBLElBQUlBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO1lBQ3hCQSxJQUFJQSxDQUFDQSxLQUFLQSxJQUFJQSxTQUFTQSxDQUFDQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxLQUFLQSxDQUFDQTtZQUMvQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsSUFBSUEsU0FBU0EsQ0FBQ0EsR0FBR0EsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFDaERBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLENBQUNBLENBQUNBO2dCQUNmQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNuQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2hCQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUN4QkEsQ0FBQ0E7UUFFTVYsMEJBQWdCQSxHQUF2QkEsVUFBeUJBLFNBQW9CQSxFQUFFQSxJQUFtQkE7WUFDOURXLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLEVBQUVBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQzVHQSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxTQUFTQSxDQUFDQSxLQUFLQSxFQUFFQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNoSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsR0FBR0EsSUFBSUEsQ0FBQ0EsV0FBV0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsV0FBV0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsS0FBS0EsRUFBRUEsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDNUhBLElBQUlBLENBQUNBLFVBQVVBLEdBQUdBLElBQUlBLENBQUNBLFVBQVVBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLEVBQUVBLFNBQVNBLENBQUNBLE1B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QUFDQSxDQUFDQTtZQUNyQkEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDYkEsQ0FBQ0E7UUFSZUwsYUFBTUEsU0FRckJBLENBQUFBO1FBS0RBLHNCQUE2QkEsQ0FBV0EsRUFBRUEsQ0FBV0E7WUFDakRNLElBQUlBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEVBQ1RBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEVBQ1RBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEVBQ1RBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2RBLElBQUlBLEdBQUdBLEdBQUdBLEVBQUVBLEdBQUdBLEVBQUVBLEdBQUdBLEVBQUVBLEdBQUdBLEVBQUVBLENBQUNBO1lBQzVCQSxJQUFJQSxHQUFHQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxHQUFHQSxFQUFFQSxHQUFHQSxFQUFFQSxHQUFHQSxFQUFFQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxHQUFHQSxFQUFFQSxHQUFHQSxFQUFFQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUN0RUEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFDaENBLENBQUNBO1FBUmVOLG1CQUFZQSxlQVEzQkEsQ0FBQUE7UUFHREEsdUJBQThCQSxFQUFZQSxFQUFFQSxFQUFZQTtZQUNwRE8sSUFBSUEsS0FBS0EsR0FBR0EsWUFBWUEsQ0FBQ0EsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFDakNBLElBQUlBLEdBQUdBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2pDQSxJQUFJQSxHQUFHQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNqQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsRUFBRUEsS0FBS0EsQ0FBQ0EsQ0FBQ0E7WUFDbkJBLElBQUlBLEVBQUVBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ25DQSxJQUFJQSxFQUFFQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuQ0EsTUFBTUEsQ0FBQ0EsRUFBRUEsR0FBR0EsT0FBT0E7bUJBQ1pBLEVBQUVBLEdBQUdBLE9BQU9BLENBQUNBO1FBQ3hCQSxDQUFDQTtRQVRlUCxvQkFBYUEsZ0JBUzVCQSxDQUFBQTtRQUdEQSxzQkFBNkJBLEVBQVlBLEVBQUVBLEVBQVlBLEVBQUVBLEVBQVlBLEVBQUVBLEVBQVlBO1lBQy9FUSxJQUFJQSxFQUFFQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNmQSxJQUFJQSxFQUFFQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNmQSxJQUFJQSxFQUFFQSxHQUFHQSxFQUFFQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNwQkEsSUFBSUEsRUFBRUEsR0FBR0EsRUFBRUEsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFFcEJBLElBQUlBLEVBQUVBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2ZBLElBQUlBLEVBQUVBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2ZBLElBQUlBLEVBQUVBLEdBQUdBLEVBQUVBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ3BCQSxJQUFJQSxFQUFFQSxHQUFHQSxFQUFFQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUdwQkEsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFDeERBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLENBQUNBO2dCQUNWQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtZQUVoQkEsSUFBSUEsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsR0FBR0EsRUFBRUEsR0FBR0EsRUFBRUEsR0FBR0EsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsR0FBR0EsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsRUFBRUEsR0FBR0EsRUFBRUEsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDL0VBLElBQUlBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLEdBQUdBLEVBQUVBLEdBQUdBLEVBQUVBLEdBQUdBLEVBQUVBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLEdBQUdBLEVBQUVBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEVBQUVBLEdBQUdBLEVBQUVBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1lBQy9FQSxNQUFNQSxDQUFDQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxFQUFFQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUNoQ0EsQ0FBQ0E7UUFuQmVSLG1CQUFZQSxlQW1CM0JBLENB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Q0FBQyxDQUFDO1FBQ25ELENBQUMsQ0FBQ0E7SUFDTkEsQ0FBQ0E7SUFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDSkEsZ0JBQWdCQSxHQUFHQSxVQUFVQSxNQUFjQTtZQUN2QyxNQUFNLENBQVcsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDQTtJQUNOQSxDQUFDQTtJQUVVQSxXQUFJQSxHQUFtQkE7UUFDOUJBLE1BQU1BLFlBQUVBLEdBQWNBO1lBQ2xCc0QsSUFBSUEsSUFBSUEsR0FBR0EsZ0JBQWdCQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUUvQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ05BLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUNqQkEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2pCQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDakJBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUNqQkEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2pCQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNyQkEsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ0pBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ2xFQSxDQUFDQTtZQUVEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtRQUNoQkEsQ0FBQ0E7UUFDRHRELE1BQU1BLFlBQUVBLEdBQWFBLEVBQUVBLElBQWNBO1lBQ2pDaUosSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDakJBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2pCQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNqQkEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDakJBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2pCQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNqQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLENBQUNBO1FBQ0RqSixJQUFJQSxZQUFFQSxJQUFjQSxFQUFFQSxHQUFXQSxFQUFFQSxHQUFXQSxFQUFFQSxHQUFXQSxFQUFFQSxHQUFXQSxFQUFFQSxFQUFVQSxFQUFFQSxFQUFVQTtZQUM1RnVELElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBO1lBQ2RBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBO1lBQ2RBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBO1lBQ2RBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBO1lBQ2RB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LENBQUNBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEVBQ3RCQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUUzQkEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFDaENBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBO1lBRWhDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUNoQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFFaENBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBO1lBQ3RDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUV0Q0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLENBQUNBO1FBQ0RwSixPQUFPQSxZQUFFQSxHQUFhQSxFQUFFQSxJQUFlQTtZQUNuQ3FKLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLGFBQWFBLElBQUlBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdB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QUNBO1lBQ2JBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ1pBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ1pBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO1FBQ2hCQSxDQUFDQTtRQUNEekosS0FBS0EsWUFBRUEsR0FBYUEsRUFBRUEsRUFBVUEsRUFBRUEsRUFBVUE7WUFDeEMwSixHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtZQUNiQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtZQUNiQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtZQUViQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtZQUNiQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtZQUNiQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtZQUNiQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQTtRQUNmQSxDQUFDQTtRQUNEMUosWUFBWUEsWUFBRUEsUUFBZ0JBLEVBQUVBLElBQWVBO1lBQzNDMkosRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0E7Z0JBQUNBLElBQUlBLEdBQUdBLFdBQUlBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO1lBQ2hDQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtZQUMzQkEsSUFBSUEsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7WUFDM0JBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ1pBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ1pBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO1lBQ2JBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ1pBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ1pBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ1pBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO1FBQ2hCQSxDQUFDQTtRQUNEM0osVUFBVUEsWUFBRUEsU0FBaUJBLEVBQUVBLFNBQWlCQSxFQUFFQSxJQUFlQTtZQUM3RDRKLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBO2dCQUFDQSxJQUFJQSxHQUFHQSxXQUFJQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQTtZQUNoQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDWkEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7WUFDOUJBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBO1lBQzlCQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNaQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNaQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNaQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtRQUNoQkEsQ0FBQ0E7UUFFRDVKLFFBQVFBLFlBQUVBLElBQWNBLEVBQUVBLEdBQWFBO1lBQ25DNkosTUFBTUEsQ0FBQ0EsV0FBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsR0FBR0EsRUFBRUEsSUFBSUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDMUNBLENBQUNBO1FBQ0Q3SixLQUFLQSxZQUFFQSxJQUFjQSxFQUFFQSxHQUFhQTtZQUNoQzhKLE1BQU1BLENBQUNBLFdBQUlBLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLEVBQUVBLEdBQUdBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzFDQSxDQUFDQTtLQUNKOUosQ0FBQ0E7SUFFRkEsd0JBQXlCQSxHQUFhQSxFQUFFQSxJQUFlQTtRQUNuRCtKLElBQUlBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQ2pCQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxhQUFhQSxDQUFDQTtZQUM5QkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7UUFFaEJBLElBQUlBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQ2pCQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxhQUFhQSxDQUFDQTtZQUM5QkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7UUFFaEJBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO1lBQ1JBLElBQUlBLEdBQUdBLEdBQUdBLENBQUNBO1FBQ2ZBLENBQUNBO1FBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQ0pBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2pCQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNyQkEsQ0FBQ0E7UUFFREEsSUFBSUEsRUFBRUEsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDakJBLElBQUlBLEVBQUVBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQ2pCQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxhQUFhQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNwQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFDZEEsRUFBRUEsSUFBSUEsR0FBR0EsQ0FBQ0E7UUFDZEEsQ0FBQ0E7UUFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsYUFBYUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDcENBLEdBQUdBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBO1lBQ2RBLEVBQUVBLElBQUlBLEdBQUdBLENBQUNBO1FBQ2RBLENBQUNBO1FBRURBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBO1FBQ2RBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBO1FBQ2RBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBO1FBQ2JBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBO1FBQ2JBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2hCQSxDQUFDQTtJQUVEL0oseUJBQTBCQSxHQUFhQSxFQUFFQSxJQUFlQTtRQUNwRGdLLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBO1lBQUNBLElBQUlBLEdBQUdBLEdBQUdBLENBQUNBO1FBRXRCQSxJQUFJQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUMxQkEsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7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QUlBLEdBQUdBLGdCQUFnQkEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFFaENBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO2dCQUNOQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtnQkFDckNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO2dCQUNyQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtnQkFDckNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO2dCQUNyQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtnQkFDckNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO2dCQUNyQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtnQkFDckNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO2dCQUNyQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtnQkFDN0NBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO2dCQUM3Q0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzdDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN6Q0EsQ0FBQ0E7WUFFREEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLENBQUNBO1FBQ0R0RCxNQUFNQSxZQUFFQSxHQUFhQSxFQUFFQSxJQUFjQTtZQUNqQ2lKLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3JDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNyQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDckNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3JDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNyQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDckNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3JDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNyQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDckNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3JDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNyQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDckNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1lBQzdDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtZQUM3Q0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7WUFDN0NBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3JDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtRQUNoQkEsQ0FBQ0E7UUFDRGpKLFFBQVFBLFlBQUVBLElBQWVBO1lBQ3JCa0osRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0E7Z0JBQUNBLElBQUlBLEdBQUdBLFdBQUlBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO1lBQ2hDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUMxQkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDMUJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQzFCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0QkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLENBQUNBO1FBQ0RsSixLQUFLQSxZQUFFQSxDQUFXQSxFQUFFQSxDQUFXQTtZQUMzQm1KLE1BQU1BLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLENBQ2RBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLGFBQWFBO2dCQUN6REEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsYUFBYUE7Z0JBQ3pEQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxhQUFhQTtnQkFDekRBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLGFBQWFBO2dCQUN6REEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsYUFBYUE7Z0JBQ3pEQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxhQUFhQTtnQkFDekRBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLGFBQWFBO2dCQUN6REEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsYUFBYUE7Z0JBQ3pEQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxhQUFhQTtnQkFDekRBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLGFBQWFBO2dCQUN6REEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsYUFBYUE7Z0JBQ3pEQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxhQUFhQTtnQkFDekRBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLEdBQUdBLGFBQWFBO2dCQUNqRUEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsYUFBYUE7Z0JBQ2pFQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxHQUFHQSxhQUFhQTtnQkFDakVBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLGFBQWFBLENBQ3hEQSxDQUFDQTtRQUNWQSxDQUFDQTtRQUNEbkosUUFBUUEsWUFBRUEsQ0FBV0EsRUFBRUEsQ0FBV0EsRUFBRUEsSUFBZUE7WUFDL0NvSixFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQTtnQkFBQ0EsSUFBSUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDcEJBLElBQUlBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQ3RGQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUN0RkEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFDdEZBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBRXZHQSxJQUFJQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUN0RkEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFDdEZBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQ3RGQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUV2R0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFDbEVBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBO1lBQ2xFQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUNsRUEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFDbEVBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBO1lBQ2xFQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUNsRUEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFDbEVBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBO1lBQ2xFQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUNsRUEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFDbEVBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBO1lBQ2xFQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUNsRUEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFDdEVBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBO1lBQ3RFQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUN0RUEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFDbEVBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO1FBQ2hCQSxDQUFDQTtRQUNEcEosT0FBT0EsWUFBRUEsR0FBYUEsRUFBRUEsSUFBZUE7WUFDbkNxSixFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQTtnQkFBQ0EsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFHdEJBLElBQUlBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQzlGQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUM5RkEsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFDOUZBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBRTFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxFQUMzQkEsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsRUFDM0JBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEVBQzNCQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxFQUMzQkEsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsRUFDM0JBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEVBQzNCQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxFQUMzQkEsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsRUFDM0JBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEVBQzNCQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxFQUMzQkEsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsRUFDM0JBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBO1lBRWhDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNoRkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ25CQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtZQUNoQkEsSUFBSUEsRUFBRUEsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFFZkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDN0RBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBO1lBQzlEQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUM3REEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDOURBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBO1lBQzlEQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUM3REEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDOURBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBO1lBQzdEQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUM3REEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDOURBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBO1lBQzdEQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUM5REEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDbEVBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBO1lBQ2pFQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUNsRUEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFFN0RBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO1FBQ2hCQSxDQUFDQTtRQUNEckosU0FBU0EsWUFBRUEsR0FBYUEsRUFBRUEsSUFBZUE7WUFDckNrSyxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQTtnQkFBQ0EsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFFdEJBLElBQUlBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQzlGQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUM5RkEsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFDOUZBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBRS9HQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUN2R0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFDdkdBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBO1lBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBO1lBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBO1lBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBO1lBQ3ZHQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUVuR0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLENBQUNBO1FBQ0RsSyxhQUFhQSxZQUFFQSxHQUFhQSxFQUFFQSxHQUFhQSxFQUFFQSxJQUFlQTtZQUN4RG1LLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBO2dCQUFDQSxJQUFJQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUV0QkEsSUFBSUEsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFFbkRBLElBQUlBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEVBQzlGQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUM5RkEsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFDOUZBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBRS9HQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNoREEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDaERBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBO1lBQ2hEQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUVoREEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLENBQUNBO1FBRURuSyxlQUFlQSxZQUFFQSxDQUFTQSxFQUFFQSxDQUFTQSxFQUFFQSxDQUFTQSxFQUFFQSxJQUFlQTtZQUM3RHVKLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBO2dCQUFDQSxJQUFJQSxHQUFHQSxXQUFJQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQTtZQUVoQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFFdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBRXRCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxH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QUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBRXRCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUV0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO1lBQ3ZCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFFdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQzFCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUMxQkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDMUJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBRXRCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtRQUNoQkEsQ0FBQ0E7UUFDRHBLLGFBQWFBLFlBQUVBLEtBQWFBLEVBQUVBLElBQWVBO1lBQ3pDcUssRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0E7Z0JBQUNBLElBQUlBLEdBQUdBLFdBQUlBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO1lBRWhDQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtZQUN4QkEsSUFBSUEsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7WUFFeEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDdkJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBRXRCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUV0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFFdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQzFCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUMxQkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDMUJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBRXRCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtRQUNoQkEsQ0FBQ0E7UUFDRHJLLGFBQWFBLFlBQUVBLEtBQWFBLEVBQUVBLElBQWVBO1lBQ3pDc0ssRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0E7Z0JBQUNBLElBQUlBLEdBQUdBLFdBQUlBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO1lBRWhDQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtZQUN4QkEsSUFBSUEsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7WUFFeEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBRXRCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN2QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUV0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFFdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQzFCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUMxQkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDMUJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBRXRCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtRQUNoQkEsQ0FBQ0E7UUFFRHRLLGlCQUFpQkEsWUFBRUEsWUFBb0JBLEVBQUVBLFdBQW1CQSxFQUFFQSxVQUFrQkEsRUFBRUEsU0FBaUJBLEVBQUVBLElBQWVBO1lBQ2hIdUssRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0E7Z0JBQUNBLElBQUlBLEdBQUdBLFdBQUlBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO1lBRWhDQSxJQUFJQSxNQUFNQSxHQUFHQSxHQUFHQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxZQUFZQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNoREEsSUFBSUEsS0FBS0EsR0FBR0EsTUFBTUEsR0FBR0EsV0FBV0EsQ0FBQ0E7WUFDakNBLElBQUlBLENBQUNBLEdBQUdBLFVBQVVBLEdBQUdBLFNBQVNBLENBQUNBO1lBRS9CQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQTtZQUMxQkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUV0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLE1BQU1BLENBQUNBO1lBQzNCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFFdEJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFD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SUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDWkEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDWkEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDWkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLENBQUNBO1FBQ0R0RCxJQUFJQSxZQUFFQSxDQUFTQSxFQUFFQSxDQUFTQSxFQUFFQSxDQUFTQSxFQUFFQSxDQUFTQSxFQUFFQSxJQUFlQTtZQUM3RHVELEVBQUVBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBO2dCQUFDQSxJQUFJQSxHQUFHQSxnQkFBZ0JBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ3RDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNaQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNaQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNaQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNaQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtRQUNoQkEsQ0FBQ0E7S0FDSnZELENBQUNBO0FBQ05BLENBQUNBLEVBL0JTLE1BQU0sS0FBTixNQUFNLFFBK0JmO0FBRUQsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyIsImZpbGUiOiJtaXJhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUgbWlyYWdlIHtcclxuICAgIGV4cG9ydCB2YXIgdmVyc2lvbiA9ICcwLjEuMCc7XHJcbn0iLCJuYW1lc3BhY2UgbWlyYWdlIHtcclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSUNvcm5lclJhZGl1cyB7XHJcbiAgICAgICAgdG9wTGVmdDogbnVtYmVyO1xyXG4gICAgICAgIHRvcFJpZ2h0OiBudW1iZXI7XHJcbiAgICAgICAgYm90dG9tUmlnaHQ6IG51bWJlcjtcclxuICAgICAgICBib3R0b21MZWZ0OiBudW1iZXI7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIENvcm5lclJhZGl1cyBpbXBsZW1lbnRzIElDb3JuZXJSYWRpdXMge1xyXG4gICAgICAgIHRvcExlZnQ6IG51bWJlcjtcclxuICAgICAgICB0b3BSaWdodDogbnVtYmVyO1xyXG4gICAgICAgIGJvdHRvbVJpZ2h0OiBudW1iZXI7XHJcbiAgICAgICAgYm90dG9tTGVmdDogbnVtYmVyO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvciAodG9wTGVmdD86IG51bWJlciwgdG9wUmlnaHQ/OiBudW1iZXIsIGJvdHRvbVJpZ2h0PzogbnVtYmVyLCBib3R0b21MZWZ0PzogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMudG9wTGVmdCA9IHRvcExlZnQgPT0gbnVsbCA/IDAgOiB0b3BMZWZ0O1xyXG4gICAgICAgICAgICB0aGlzLnRvcFJpZ2h0ID0gdG9wUmlnaHQgPT0gbnVsbCA/IDAgOiB0b3BSaWdodDtcclxuICAgICAgICAgICAgdGhpcy5ib3R0b21SaWdodCA9IGJvdHRvbVJpZ2h0ID09IG51bGwgPyAwIDogYm90dG9tUmlnaHQ7XHJcbiAgICAgICAgICAgIHRoaXMuYm90dG9tTGVmdCA9IGJvdHRvbUxlZnQgPT0gbnVsbCA/IDAgOiBib3R0b21MZWZ0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGlzRW1wdHkgKGNyOiBJQ29ybmVyUmFkaXVzKTogYm9vbGVhbiB7XHJcbiAgICAgICAgICAgIHJldHVybiBjci50b3BMZWZ0ID09PSAwXHJcbiAgICAgICAgICAgICAgICAmJiBjci50b3BSaWdodCA9PT0gMFxyXG4gICAgICAgICAgICAgICAgJiYgY3IuYm90dG9tUmlnaHQgPT09IDBcclxuICAgICAgICAgICAgICAgICYmIGNyLmJvdHRvbUxlZnQgPT09IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgaXNFcXVhbCAoY3IxOiBJQ29ybmVyUmFkaXVzLCBjcjI6IElDb3JuZXJSYWRpdXMpOiBib29sZWFuIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNyMS50b3BMZWZ0ID09PSBjcjIudG9wTGVmdFxyXG4gICAgICAgICAgICAgICAgJiYgY3IxLnRvcFJpZ2h0ID09PSBjcjIudG9wUmlnaHRcclxuICAgICAgICAgICAgICAgICYmIGNyMS5ib3R0b21SaWdodCA9PT0gY3IyLmJvdHRvbVJpZ2h0XHJcbiAgICAgICAgICAgICAgICAmJiBjcjEuYm90dG9tTGVmdCA9PT0gY3IyLmJvdHRvbUxlZnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgY2xlYXIgKGRlc3Q6IElDb3JuZXJSYWRpdXMpIHtcclxuICAgICAgICAgICAgZGVzdC50b3BMZWZ0ID0gZGVzdC50b3BSaWdodCA9IGRlc3QuYm90dG9tUmlnaHQgPSBkZXN0LmJvdHRvbUxlZnQgPSAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGNvcHlUbyAoY3IyOiBJQ29ybmVyUmFkaXVzLCBkZXN0OiBJQ29ybmVyUmFkaXVzKSB7XHJcbiAgICAgICAgICAgIGRlc3QudG9wTGVmdCA9IGNyMi50b3BMZWZ0O1xyXG4gICAgICAgICAgICBkZXN0LnRvcFJpZ2h0ID0gY3IyLnRvcFJpZ2h0O1xyXG4gICAgICAgICAgICBkZXN0LmJvdHRvbVJpZ2h0ID0gY3IyLmJvdHRvbVJpZ2h0O1xyXG4gICAgICAgICAgICBkZXN0LmJvdHRvbUxlZnQgPSBjcjIuYm90dG9tTGVmdDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJuYW1lc3BhY2UgbWlyYWdlIHtcbiAgICBleHBvcnQgZW51bSBIb3Jpem9udGFsQWxpZ25tZW50IHtcbiAgICAgICAgTGVmdCA9IDAsXG4gICAgICAgIENlbnRlciA9IDEsXG4gICAgICAgIFJpZ2h0ID0gMixcbiAgICAgICAgU3RyZXRjaCA9IDMsXG4gICAgfVxuICAgIGV4cG9ydCBlbnVtIFZlcnRpY2FsQWxpZ25tZW50IHtcbiAgICAgICAgVG9wID0gMCxcbiAgICAgICAgQ2VudGVyID0gMSxcbiAgICAgICAgQm90dG9tID0gMixcbiAgICAgICAgU3RyZXRjaCA9IDMsXG4gICAgfVxuICAgIGV4cG9ydCBlbnVtIE9yaWVudGF0aW9uIHtcbiAgICAgICAgSG9yaXpvbnRhbCA9IDAsXG4gICAgICAgIFZlcnRpY2FsID0gMSxcbiAgICB9XG59IiwibmFtZXNwYWNlIG1pcmFnZS5jb3JlIHtcbiAgICBleHBvcnQgaW50ZXJmYWNlIElMYXlvdXROb2RlSW5wdXRzIHtcbiAgICAgICAgdmlzaWJsZTogYm9vbGVhbjtcbiAgICAgICAgdXNlTGF5b3V0Um91bmRpbmc6IGJvb2xlYW47XG4gICAgICAgIG1hcmdpbjogVGhpY2tuZXNzO1xuICAgICAgICB3aWR0aDogbnVtYmVyO1xuICAgICAgICBoZWlnaHQ6IG51bWJlcjtcbiAgICAgICAgbWluV2lkdGg6IG51bWJlcjtcbiAgICAgICAgbWluSGVpZ2h0OiBudW1iZXI7XG4gICAgICAgIG1heFdpZHRoOiBudW1iZXI7XG4gICAgICAgIG1heEhlaWdodDogbnVtYmVyO1xuICAgICAgICBob3Jpem9udGFsQWxpZ25tZW50OiBIb3Jpem9udGFsQWxpZ25tZW50O1xuICAgICAgICB2ZXJ0aWNhbEFsaWdubWVudDogVmVydGljYWxBbGlnbm1lbnQ7XG4gICAgfVxuXG4gICAgZXhwb3J0IGludGVyZmFjZSBJTGF5b3V0Tm9kZVN0YXRlIHtcbiAgICAgICAgZmxhZ3M6IExheW91dEZsYWdzO1xuICAgICAgICBwcmV2aW91c0F2YWlsYWJsZTogSVNpemU7XG4gICAgICAgIGRlc2lyZWRTaXplOiBJU2l6ZTtcbiAgICAgICAgaGlkZGVuRGVzaXJlOiBJU2l6ZTtcbiAgICAgICAgbGF5b3V0U2xvdDogUmVjdDtcbiAgICAgICAgdmlzdWFsT2Zmc2V0OiBQb2ludDtcbiAgICAgICAgYXJyYW5nZWQ6IElTaXplO1xuICAgICAgICBsYXN0QXJyYW5nZWQ6IElTaXplO1xuICAgIH1cblxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSUxheW91dFRyZWVEZWVwV2Fsa2VyIHtcbiAgICAgICAgY3VycmVudDogTGF5b3V0Tm9kZTtcbiAgICAgICAgc3RlcCgpOiBib29sZWFuO1xuICAgICAgICBza2lwQnJhbmNoKCk7XG4gICAgfVxuXG4gICAgZXhwb3J0IGNsYXNzIExheW91dE5vZGUge1xuICAgICAgICBpbnB1dHM6IElMYXlvdXROb2RlSW5wdXRzO1xuICAgICAgICBzdGF0ZTogSUxheW91dE5vZGVTdGF0ZTtcbiAgICAgICAgdHJlZTogSUxheW91dFRyZWU7XG5cbiAgICAgICAgcHJpdmF0ZSAkbWVhc3VyZXI6IGNvcmUuSU1lYXN1cmVyO1xuICAgICAgICBwcml2YXRlICRhcnJhbmdlcjogY29yZS5JQXJyYW5nZXI7XG4gICAgICAgIHByaXZhdGUgJG1lYXN1cmVCaW5kZXI6IGNvcmUuSU1lYXN1cmVCaW5kZXI7XG4gICAgICAgIHByaXZhdGUgJGFycmFuZ2VCaW5kZXI6IGNvcmUuSUFycmFuZ2VCaW5kZXI7XG5cbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICB0aGlzLmluaXQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGluaXQoKSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICAgICAgICAgICAgXCJpbnB1dHNcIjoge3ZhbHVlOiB0aGlzLmNyZWF0ZUlucHV0cygpLCB3cml0YWJsZTogZmFsc2V9LFxuICAgICAgICAgICAgICAgIFwic3RhdGVcIjoge3ZhbHVlOiB0aGlzLmNyZWF0ZVN0YXRlKCksIHdyaXRhYmxlOiBmYWxzZX0sXG4gICAgICAgICAgICAgICAgXCJ0cmVlXCI6IHt2YWx1ZTogdGhpcy5jcmVhdGVUcmVlKCksIHdyaXRhYmxlOiBmYWxzZX0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuJG1lYXN1cmVyID0gdGhpcy5jcmVhdGVNZWFzdXJlcigpO1xuICAgICAgICAgICAgdGhpcy4kYXJyYW5nZXIgPSB0aGlzLmNyZWF0ZUFycmFuZ2VyKCk7XG4gICAgICAgICAgICB0aGlzLiRtZWFzdXJlQmluZGVyID0gTmV3TWVhc3VyZUJpbmRlcih0aGlzLnN0YXRlLCB0aGlzLnRyZWUsIHRoaXMuJG1lYXN1cmVyKTtcbiAgICAgICAgICAgIHRoaXMuJGFycmFuZ2VCaW5kZXIgPSBOZXdBcnJhbmdlQmluZGVyKHRoaXMuc3RhdGUsIHRoaXMudHJlZSwgdGhpcy4kYXJyYW5nZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvdGVjdGVkIGNyZWF0ZUlucHV0cygpOiBJTGF5b3V0Tm9kZUlucHV0cyB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHZpc2libGU6IHRydWUsXG4gICAgICAgICAgICAgICAgdXNlTGF5b3V0Um91bmRpbmc6IHRydWUsXG4gICAgICAgICAgICAgICAgbWFyZ2luOiBuZXcgVGhpY2tuZXNzKCksXG4gICAgICAgICAgICAgICAgd2lkdGg6IE5hTixcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IE5hTixcbiAgICAgICAgICAgICAgICBtaW5XaWR0aDogMC4wLFxuICAgICAgICAgICAgICAgIG1pbkhlaWdodDogMC4wLFxuICAgICAgICAgICAgICAgIG1heFdpZHRoOiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXG4gICAgICAgICAgICAgICAgbWF4SGVpZ2h0OiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXG4gICAgICAgICAgICAgICAgaG9yaXpvbnRhbEFsaWdubWVudDogSG9yaXpvbnRhbEFsaWdubWVudC5TdHJldGNoLFxuICAgICAgICAgICAgICAgIHZlcnRpY2FsQWxpZ25tZW50OiBWZXJ0aWNhbEFsaWdubWVudC5TdHJldGNoLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBjcmVhdGVTdGF0ZSgpOiBJTGF5b3V0Tm9kZVN0YXRlIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZmxhZ3M6IExheW91dEZsYWdzLk5vbmUsXG4gICAgICAgICAgICAgICAgcHJldmlvdXNBdmFpbGFibGU6IG5ldyBTaXplKCksXG4gICAgICAgICAgICAgICAgZGVzaXJlZFNpemU6IG5ldyBTaXplKCksXG4gICAgICAgICAgICAgICAgaGlkZGVuRGVzaXJlOiBuZXcgU2l6ZSgpLFxuICAgICAgICAgICAgICAgIGxheW91dFNsb3Q6IG5ldyBSZWN0KCksXG4gICAgICAgICAgICAgICAgdmlzdWFsT2Zmc2V0OiBuZXcgUG9pbnQoKSxcbiAgICAgICAgICAgICAgICBhcnJhbmdlZDogbmV3IFNpemUoKSxcbiAgICAgICAgICAgICAgICBsYXN0QXJyYW5nZWQ6IG5ldyBTaXplKCksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvdGVjdGVkIGNyZWF0ZVRyZWUoKTogSUxheW91dFRyZWUge1xuICAgICAgICAgICAgcmV0dXJuIERlZmF1bHRMYXlvdXRUcmVlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgY3JlYXRlTWVhc3VyZXIoKTogY29yZS5JTWVhc3VyZXIge1xuICAgICAgICAgICAgcmV0dXJuIGNvcmUuTmV3TWVhc3VyZXIodGhpcy5pbnB1dHMsIHRoaXMuc3RhdGUsIHRoaXMudHJlZSwgY29uc3RyYWludCA9PiB0aGlzLm1lYXN1cmVPdmVycmlkZShjb25zdHJhaW50KSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgY3JlYXRlQXJyYW5nZXIoKTogY29yZS5JQXJyYW5nZXIge1xuICAgICAgICAgICAgcmV0dXJuIGNvcmUuTmV3QXJyYW5nZXIodGhpcy5pbnB1dHMsIHRoaXMuc3RhdGUsIHRoaXMudHJlZSwgYXJyYW5nZVNpemUgPT4gdGhpcy5hcnJhbmdlT3ZlcnJpZGUoYXJyYW5nZVNpemUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRSRUVcblxuICAgICAgICBzZXRQYXJlbnQocGFyZW50OiBMYXlvdXROb2RlKSB7XG4gICAgICAgICAgICBpZiAoIXBhcmVudCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy50cmVlLnBhcmVudClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHRoaXMudHJlZS5wYXJlbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMub25EZXRhY2hlZCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50ID09PSB0aGlzLnRyZWUucGFyZW50KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgdGhpcy50cmVlLnBhcmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkRldGFjaGVkKCk7XG4gICAgICAgICAgICAgICAgdGhpcy50cmVlLnBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgICAgICAgICB0aGlzLm9uQXR0YWNoZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBvbkRldGFjaGVkKCkge1xuICAgICAgICAgICAgdGhpcy5pbnZhbGlkYXRlTWVhc3VyZSgpO1xuICAgICAgICAgICAgaWYgKHRoaXMudHJlZS5wYXJlbnQpXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlLnBhcmVudC5pbnZhbGlkYXRlTWVhc3VyZSgpO1xuICAgICAgICAgICAgUmVjdC5jbGVhcih0aGlzLnN0YXRlLmxheW91dFNsb3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvdGVjdGVkIG9uQXR0YWNoZWQoKSB7XG4gICAgICAgICAgICB2YXIgc3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgICAgICAgU2l6ZS51bmRlZihzdGF0ZS5wcmV2aW91c0F2YWlsYWJsZSk7XG4gICAgICAgICAgICBTaXplLmNsZWFyKHN0YXRlLmFycmFuZ2VkKTtcbiAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZU1lYXN1cmUoKTtcbiAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZUFycmFuZ2UoKTtcbiAgICAgICAgICAgIGlmICgoc3RhdGUuZmxhZ3MgJiBMYXlvdXRGbGFncy5TaXplSGludCkgPiAwIHx8IHN0YXRlLmxhc3RBcnJhbmdlZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50cmVlLnByb3BhZ2F0ZUZsYWdVcChMYXlvdXRGbGFncy5TaXplSGludCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB3YWxrRGVlcChyZXZlcnNlPzogYm9vbGVhbik6IElMYXlvdXRUcmVlRGVlcFdhbGtlciB7XG4gICAgICAgICAgICB2YXIgbGFzdDogTGF5b3V0Tm9kZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHZhciB3YWxrTGlzdDogTGF5b3V0Tm9kZVtdID0gW3RoaXNdO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBzdGVwKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGFzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgc3Vid2Fsa2VyID0gbGFzdC50cmVlLndhbGsocmV2ZXJzZSk7IHN1YndhbGtlci5zdGVwKCk7KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2Fsa0xpc3QudW5zaGlmdChzdWJ3YWxrZXIuY3VycmVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBsYXN0ID0gd2Fsa0xpc3Quc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudCAhPT0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2tpcEJyYW5jaCgpIHtcbiAgICAgICAgICAgICAgICAgICAgbGFzdCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExBWU9VVFxuXG4gICAgICAgIGludmFsaWRhdGVNZWFzdXJlKCkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5mbGFncyB8PSBMYXlvdXRGbGFncy5NZWFzdXJlIHwgTGF5b3V0RmxhZ3MuTWVhc3VyZUhpbnQ7XG4gICAgICAgICAgICB0aGlzLnRyZWUucHJvcGFnYXRlRmxhZ1VwKExheW91dEZsYWdzLk1lYXN1cmVIaW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRvTWVhc3VyZSgpOiBib29sZWFuIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLiRtZWFzdXJlQmluZGVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICBtZWFzdXJlKGF2YWlsYWJsZVNpemU6IElTaXplKTogYm9vbGVhbiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy4kbWVhc3VyZXIoYXZhaWxhYmxlU2l6ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgbWVhc3VyZU92ZXJyaWRlKGNvbnN0cmFpbnQ6IElTaXplKTogSVNpemUge1xuICAgICAgICAgICAgdmFyIGRlc2lyZWQgPSBuZXcgU2l6ZSgpO1xuICAgICAgICAgICAgZm9yICh2YXIgd2Fsa2VyID0gdGhpcy50cmVlLndhbGsoKTsgd2Fsa2VyLnN0ZXAoKTspIHtcbiAgICAgICAgICAgICAgICB3YWxrZXIuY3VycmVudC5tZWFzdXJlKGNvbnN0cmFpbnQpO1xuICAgICAgICAgICAgICAgIFNpemUubWF4KGRlc2lyZWQsIHdhbGtlci5jdXJyZW50LnN0YXRlLmRlc2lyZWRTaXplKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkZXNpcmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaW52YWxpZGF0ZUFycmFuZ2UoKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmZsYWdzIHw9IExheW91dEZsYWdzLkFycmFuZ2UgfCBMYXlvdXRGbGFncy5BcnJhbmdlSGludDtcbiAgICAgICAgICAgIHRoaXMudHJlZS5wcm9wYWdhdGVGbGFnVXAoTGF5b3V0RmxhZ3MuQXJyYW5nZUhpbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZG9BcnJhbmdlKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuJGFycmFuZ2VCaW5kZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFycmFuZ2UoZmluYWxSZWN0OiBSZWN0KTogYm9vbGVhbiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy4kYXJyYW5nZXIoZmluYWxSZWN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBhcnJhbmdlT3ZlcnJpZGUoYXJyYW5nZVNpemU6IElTaXplKTogSVNpemUge1xuICAgICAgICAgICAgdmFyIGFycmFuZ2VkID0gbmV3IFNpemUoYXJyYW5nZVNpemUud2lkdGgsIGFycmFuZ2VTaXplLmhlaWdodCk7XG4gICAgICAgICAgICBmb3IgKHZhciB3YWxrZXIgPSB0aGlzLnRyZWUud2FsaygpOyB3YWxrZXIuc3RlcCgpOykge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZFJlY3QgPSBuZXcgUmVjdCgwLCAwLCBhcnJhbmdlU2l6ZS53aWR0aCwgYXJyYW5nZVNpemUuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB3YWxrZXIuY3VycmVudC5hcnJhbmdlKGNoaWxkUmVjdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXJyYW5nZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBzaXppbmcob2xkU2l6ZTogSVNpemUsIG5ld1NpemU6IElTaXplKTogYm9vbGVhbiB7XG4gICAgICAgICAgICB2YXIgc3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgICAgICAgaWYgKHN0YXRlLmxhc3RBcnJhbmdlZClcbiAgICAgICAgICAgICAgICBTaXplLmNvcHlUbyhzdGF0ZS5sYXN0QXJyYW5nZWQsIG9sZFNpemUpO1xuICAgICAgICAgICAgU2l6ZS5jb3B5VG8oc3RhdGUuYXJyYW5nZWQsIG5ld1NpemUpO1xuICAgICAgICAgICAgc3RhdGUubGFzdEFycmFuZ2VkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgLy8gVE9ETzogU2V0IGFjdHVhbFdpZHRoLCBhY3R1YWxIZWlnaHRcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgb25TaXplQ2hhbmdlZChvbGRTaXplOiBJU2l6ZSwgbmV3U2l6ZTogSVNpemUpIHtcbiAgICAgICAgICAgIC8vIFBsYWNlaG9sZGVyIGZvciBzaXppbmcgbm90aWZpY2F0aW9uc1xuICAgICAgICB9XG4gICAgfVxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJjb3JlL0xheW91dE5vZGVcIiAvPlxuXG5uYW1lc3BhY2UgbWlyYWdlIHtcbiAgICBleHBvcnQgY2xhc3MgUGFuZWwgZXh0ZW5kcyBjb3JlLkxheW91dE5vZGUge1xuICAgICAgICB0cmVlOiBJUGFuZWxUcmVlO1xuXG4gICAgICAgIHByb3RlY3RlZCBjcmVhdGVUcmVlKCk6IGNvcmUuSUxheW91dFRyZWUge1xuICAgICAgICAgICAgcmV0dXJuIE5ld1BhbmVsVHJlZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvdGVjdGVkIG1lYXN1cmVPdmVycmlkZShjb25zdHJhaW50OiBJU2l6ZSk6IElTaXplIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgU2l6ZShjb25zdHJhaW50LndpZHRoLCBjb25zdHJhaW50LmhlaWdodCk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgYXJyYW5nZU92ZXJyaWRlKGFycmFuZ2VTaXplOiBJU2l6ZSk6IElTaXplIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgU2l6ZShhcnJhbmdlU2l6ZS53aWR0aCwgYXJyYW5nZVNpemUuaGVpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBjaGlsZENvdW50KCk6IG51bWJlciB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50cmVlLmNoaWxkcmVuLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGluc2VydENoaWxkKGNoaWxkOiBjb3JlLkxheW91dE5vZGUsIGluZGV4OiBudW1iZXIpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMudHJlZS5jaGlsZHJlbjtcbiAgICAgICAgICAgIGlmIChpbmRleCA+PSBjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5kZXggPD0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMucHJlcGVuZENoaWxkKGNoaWxkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2hpbGRyZW4uc3BsaWNlKGluZGV4LCAwLCBjaGlsZCk7XG4gICAgICAgICAgICAgICAgY2hpbGQuc2V0UGFyZW50KHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJlcGVuZENoaWxkKGNoaWxkOiBjb3JlLkxheW91dE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMudHJlZS5jaGlsZHJlbi51bnNoaWZ0KGNoaWxkKTtcbiAgICAgICAgICAgIGNoaWxkLnNldFBhcmVudCh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFwcGVuZENoaWxkKGNoaWxkOiBjb3JlLkxheW91dE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMudHJlZS5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcbiAgICAgICAgICAgIGNoaWxkLnNldFBhcmVudCh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlbW92ZUNoaWxkKGNoaWxkOiBjb3JlLkxheW91dE5vZGUpOiBib29sZWFuIHtcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMudHJlZS5jaGlsZHJlbjtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGNoaWxkcmVuLmluZGV4T2YoY2hpbGQpO1xuICAgICAgICAgICAgaWYgKGluZGV4IDwgMClcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnRyZWUuY2hpbGRyZW4uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIGNoaWxkLnNldFBhcmVudChudWxsKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVtb3ZlQ2hpbGRBdChpbmRleDogbnVtYmVyKTogY29yZS5MYXlvdXROb2RlIHtcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMudHJlZS5jaGlsZHJlbjtcbiAgICAgICAgICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gY2hpbGRyZW4ubGVuZ3RoKVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgdmFyIHJlbW92ZWQgPSBjaGlsZHJlbi5zcGxpY2UoaW5kZXgsIDEpWzBdO1xuICAgICAgICAgICAgaWYgKHJlbW92ZWQpXG4gICAgICAgICAgICAgICAgcmVtb3ZlZC5zZXRQYXJlbnQobnVsbCk7XG4gICAgICAgICAgICByZXR1cm4gcmVtb3ZlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldENoaWxkQXQoaW5kZXg6IG51bWJlcik6IGNvcmUuTGF5b3V0Tm9kZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50cmVlLmNoaWxkcmVuW2luZGV4XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSVBhbmVsVHJlZSBleHRlbmRzIGNvcmUuSUxheW91dFRyZWUge1xuICAgICAgICBjaGlsZHJlbjogY29yZS5MYXlvdXROb2RlW107XG4gICAgfVxuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIE5ld1BhbmVsVHJlZSgpOiBJUGFuZWxUcmVlIHtcbiAgICAgICAgdmFyIHRyZWUgPSA8SVBhbmVsVHJlZT5jb3JlLkRlZmF1bHRMYXlvdXRUcmVlKCk7XG4gICAgICAgIHRyZWUuaXNMYXlvdXRDb250YWluZXIgPSB0cnVlO1xuICAgICAgICB0cmVlLmNoaWxkcmVuID0gW107XG4gICAgICAgIHRyZWUud2FsayA9IChyZXZlcnNlPzogYm9vbGVhbik6IGNvcmUuSUxheW91dFRyZWVXYWxrZXIgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXZlcnNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSAtMTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50OiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIHN0ZXAoKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSA+PSB0cmVlLmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSB0cmVlLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSB0cmVlLmNoaWxkcmVuLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50OiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIHN0ZXAoKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpLS07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gdHJlZS5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHRyZWU7XG4gICAgfVxufSIsIm5hbWVzcGFjZSBtaXJhZ2Uge1xyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJUG9pbnQge1xyXG4gICAgICAgIHg6IG51bWJlcjtcclxuICAgICAgICB5OiBudW1iZXI7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFBvaW50IGltcGxlbWVudHMgSVBvaW50IHtcclxuICAgICAgICB4OiBudW1iZXI7XHJcbiAgICAgICAgeTogbnVtYmVyO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcih4PzogbnVtYmVyLCB5PzogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMueCA9IHggPT0gbnVsbCA/IDAgOiB4O1xyXG4gICAgICAgICAgICB0aGlzLnkgPSB5ID09IG51bGwgPyAwIDogeTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBpc0VxdWFsKHAxOiBJUG9pbnQsIHAyOiBJUG9pbnQpOiBib29sZWFuIHtcclxuICAgICAgICAgICAgcmV0dXJuIHAxLnggPT09IHAyLnhcclxuICAgICAgICAgICAgICAgICYmIHAxLnkgPT09IHAyLnk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgY29weVRvKHNyYzogSVBvaW50LCBkZXN0OiBJUG9pbnQpIHtcclxuICAgICAgICAgICAgZGVzdC54ID0gc3JjLng7XHJcbiAgICAgICAgICAgIGRlc3QueSA9IHNyYy55O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIHJvdW5kKGRlc3Q6IElQb2ludCkge1xyXG4gICAgICAgICAgICBkZXN0LnggPSBNYXRoLnJvdW5kKGRlc3QueCk7XHJcbiAgICAgICAgICAgIGRlc3QueSA9IE1hdGgucm91bmQoZGVzdC55KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbnRlcmZhY2UgSVZlY3RvcjJTdGF0aWMge1xyXG4gICAgY3JlYXRlKHg6IG51bWJlciwgeTogbnVtYmVyKTogbnVtYmVyW107XHJcbiAgICBpbml0KHg6IG51bWJlciwgeTogbnVtYmVyLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXTtcclxufVxyXG5uYW1lc3BhY2UgbWlyYWdlIHtcclxuICAgIHZhciBjcmVhdGVUeXBlZEFycmF5OiAobGVuZ3RoOiBudW1iZXIpID0+IG51bWJlcltdO1xyXG5cclxuICAgIGlmICh0eXBlb2YgRmxvYXQzMkFycmF5ICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgY3JlYXRlVHlwZWRBcnJheSA9IGZ1bmN0aW9uIChsZW5ndGg6IG51bWJlcik6IG51bWJlcltdIHtcclxuICAgICAgICAgICAgcmV0dXJuIDxudW1iZXJbXT48YW55Pm5ldyBGbG9hdDMyQXJyYXkobGVuZ3RoKTtcclxuICAgICAgICB9O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjcmVhdGVUeXBlZEFycmF5ID0gZnVuY3Rpb24gKGxlbmd0aDogbnVtYmVyKTogbnVtYmVyW10ge1xyXG4gICAgICAgICAgICByZXR1cm4gPG51bWJlcltdPm5ldyBBcnJheShsZW5ndGgpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IHZhciB2ZWMyOiBJVmVjdG9yMlN0YXRpYyA9IHtcclxuICAgICAgICBjcmVhdGUgKHg6IG51bWJlciwgeTogbnVtYmVyKTogbnVtYmVyW10ge1xyXG4gICAgICAgICAgICB2YXIgZGVzdCA9IGNyZWF0ZVR5cGVkQXJyYXkoMik7XHJcbiAgICAgICAgICAgIGRlc3RbMF0gPSB4O1xyXG4gICAgICAgICAgICBkZXN0WzFdID0geTtcclxuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpbml0ICh4OiBudW1iZXIsIHk6IG51bWJlciwgZGVzdD86IG51bWJlcltdKTogbnVtYmVyW10ge1xyXG4gICAgICAgICAgICBpZiAoIWRlc3QpIGRlc3QgPSBjcmVhdGVUeXBlZEFycmF5KDIpO1xyXG4gICAgICAgICAgICBkZXN0WzBdID0geDtcclxuICAgICAgICAgICAgZGVzdFsxXSA9IHk7XHJcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuXHJcbnZhciB2ZWMyID0gbWlyYWdlLnZlYzI7IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIm1hdC92ZWMyXCIgLz5cclxuXHJcbm5hbWVzcGFjZSBtaXJhZ2Uge1xyXG4gICAgZXhwb3J0IGVudW0gUmVjdE92ZXJsYXAge1xyXG4gICAgICAgIE91dCxcclxuICAgICAgICBJbixcclxuICAgICAgICBQYXJ0LFxyXG4gICAgfVxyXG5cclxuICAgIHZhciBwMSA9IHZlYzIuY3JlYXRlKDAsIDApO1xyXG4gICAgdmFyIHAyID0gdmVjMi5jcmVhdGUoMCwgMCk7XHJcbiAgICB2YXIgcDMgPSB2ZWMyLmNyZWF0ZSgwLCAwKTtcclxuICAgIHZhciBwNCA9IHZlYzIuY3JlYXRlKDAsIDApO1xyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBSZWN0IGltcGxlbWVudHMgSVBvaW50LCBJU2l6ZSB7XHJcbiAgICAgICAgeDogbnVtYmVyO1xyXG4gICAgICAgIHk6IG51bWJlcjtcclxuICAgICAgICB3aWR0aDogbnVtYmVyO1xyXG4gICAgICAgIGhlaWdodDogbnVtYmVyO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvciAoeD86IG51bWJlciwgeT86IG51bWJlciwgd2lkdGg/OiBudW1iZXIsIGhlaWdodD86IG51bWJlcikge1xyXG4gICAgICAgICAgICB0aGlzLnggPSB4ID09IG51bGwgPyAwIDogeDtcclxuICAgICAgICAgICAgdGhpcy55ID0geSA9PSBudWxsID8gMCA6IHk7XHJcbiAgICAgICAgICAgIHRoaXMud2lkdGggPSB3aWR0aCA9PSBudWxsID8gMCA6IHdpZHRoO1xyXG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodCA9PSBudWxsID8gMCA6IGhlaWdodDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBjbGVhciAocmVjdDogUmVjdCkge1xyXG4gICAgICAgICAgICByZWN0LnggPSByZWN0LnkgPSByZWN0LndpZHRoID0gcmVjdC5oZWlnaHQgPSAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGdldEJvdHRvbSAocmVjdDogUmVjdCk6IG51bWJlciB7XHJcbiAgICAgICAgICAgIHJldHVybiByZWN0LnkgKyByZWN0LmhlaWdodDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBnZXRSaWdodCAocmVjdDogUmVjdCk6IG51bWJlciB7XHJcbiAgICAgICAgICAgIHJldHVybiByZWN0LnggKyByZWN0LndpZHRoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGlzRXF1YWwgKHJlY3QxOiBSZWN0LCByZWN0MjogUmVjdCk6IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVjdDEueCA9PT0gcmVjdDIueFxyXG4gICAgICAgICAgICAgICAgJiYgcmVjdDEueSA9PT0gcmVjdDIueVxyXG4gICAgICAgICAgICAgICAgJiYgcmVjdDEud2lkdGggPT09IHJlY3QyLndpZHRoXHJcbiAgICAgICAgICAgICAgICAmJiByZWN0MS5oZWlnaHQgPT09IHJlY3QyLmhlaWdodDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBpc0VtcHR5IChzcmM6IFJlY3QpOiBib29sZWFuIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNyYy53aWR0aCA9PT0gMFxyXG4gICAgICAgICAgICAgICAgfHwgc3JjLmhlaWdodCA9PT0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBjb3B5VG8gKHNyYzogUmVjdCwgZGVzdDogUmVjdCkge1xyXG4gICAgICAgICAgICBkZXN0LnggPSBzcmMueDtcclxuICAgICAgICAgICAgZGVzdC55ID0gc3JjLnk7XHJcbiAgICAgICAgICAgIGRlc3Qud2lkdGggPSBzcmMud2lkdGg7XHJcbiAgICAgICAgICAgIGRlc3QuaGVpZ2h0ID0gc3JjLmhlaWdodDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyByb3VuZE91dCAoZGVzdDogUmVjdCkge1xyXG4gICAgICAgICAgICB2YXIgeCA9IE1hdGguZmxvb3IoZGVzdC54KTtcclxuICAgICAgICAgICAgdmFyIHkgPSBNYXRoLmZsb29yKGRlc3QueSk7XHJcbiAgICAgICAgICAgIGRlc3Qud2lkdGggPSBNYXRoLmNlaWwoZGVzdC54ICsgZGVzdC53aWR0aCkgLSB4O1xyXG4gICAgICAgICAgICBkZXN0LmhlaWdodCA9IE1hdGguY2VpbChkZXN0LnkgKyBkZXN0LmhlaWdodCkgLSB5O1xyXG4gICAgICAgICAgICBkZXN0LnggPSB4O1xyXG4gICAgICAgICAgICBkZXN0LnkgPSB5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIHJvdW5kSW4gKGRlc3Q6IFJlY3QpIHtcclxuICAgICAgICAgICAgdmFyIHggPSBNYXRoLmNlaWwoZGVzdC54KTtcclxuICAgICAgICAgICAgdmFyIHkgPSBNYXRoLmNlaWwoZGVzdC55KTtcclxuICAgICAgICAgICAgZGVzdC53aWR0aCA9IE1hdGguZmxvb3IoZGVzdC54ICsgZGVzdC53aWR0aCkgLSBNYXRoLmNlaWwoZGVzdC54KTtcclxuICAgICAgICAgICAgZGVzdC5oZWlnaHQgPSBNYXRoLmZsb29yKGRlc3QueSArIGRlc3QuaGVpZ2h0KSAtIE1hdGguY2VpbChkZXN0LnkpO1xyXG4gICAgICAgICAgICBkZXN0LnggPSB4O1xyXG4gICAgICAgICAgICBkZXN0LnkgPSB5O1xyXG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBpbnRlcnNlY3Rpb24gKGRlc3Q6IFJlY3QsIHJlY3QyOiBSZWN0KSB7XHJcbiAgICAgICAgICAgIHZhciB4ID0gTWF0aC5tYXgoZGVzdC54LCByZWN0Mi54KTtcclxuICAgICAgICAgICAgdmFyIHkgPSBNYXRoLm1heChkZXN0LnksIHJlY3QyLnkpO1xyXG4gICAgICAgICAgICBkZXN0LndpZHRoID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oZGVzdC54ICsgZGVzdC53aWR0aCwgcmVjdDIueCArIHJlY3QyLndpZHRoKSAtIHgpO1xyXG4gICAgICAgICAgICBkZXN0LmhlaWdodCA9IE1hdGgubWF4KDAsIE1hdGgubWluKGRlc3QueSArIGRlc3QuaGVpZ2h0LCByZWN0Mi55ICsgcmVjdDIuaGVpZ2h0KSAtIHkpO1xyXG4gICAgICAgICAgICBkZXN0LnggPSB4O1xyXG4gICAgICAgICAgICBkZXN0LnkgPSB5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIHVuaW9uIChkZXN0OiBSZWN0LCByZWN0MjogUmVjdCkge1xyXG4gICAgICAgICAgICBpZiAocmVjdDIud2lkdGggPD0gMCB8fCByZWN0Mi5oZWlnaHQgPD0gMClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKGRlc3Qud2lkdGggPD0gMCB8fCBkZXN0LmhlaWdodCA8PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBSZWN0LmNvcHlUbyhyZWN0MiwgZGVzdCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciB4ID0gTWF0aC5taW4oZGVzdC54LCByZWN0Mi54KTtcclxuICAgICAgICAgICAgdmFyIHkgPSBNYXRoLm1pbihkZXN0LnksIHJlY3QyLnkpO1xyXG4gICAgICAgICAgICBkZXN0LndpZHRoID0gTWF0aC5tYXgoZGVzdC54ICsgZGVzdC53aWR0aCwgcmVjdDIueCArIHJlY3QyLndpZHRoKSAtIHg7XHJcbiAgICAgICAgICAgIGRlc3QuaGVpZ2h0ID0gTWF0aC5tYXgoZGVzdC55ICsgZGVzdC5oZWlnaHQsIHJlY3QyLnkgKyByZWN0Mi5oZWlnaHQpIC0geTtcclxuICAgICAgICAgICAgZGVzdC54ID0geDtcclxuICAgICAgICAgICAgZGVzdC55ID0geTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBpc0NvbnRhaW5lZEluIChzcmM6IFJlY3QsIHRlc3Q6IFJlY3QpIHtcclxuICAgICAgICAgICAgdmFyIHNsID0gc3JjLng7XHJcbiAgICAgICAgICAgIHZhciBzdCA9IHNyYy55O1xyXG4gICAgICAgICAgICB2YXIgc3IgPSBzcmMueCArIHNyYy53aWR0aDtcclxuICAgICAgICAgICAgdmFyIHNiID0gc3JjLnkgKyBzcmMuaGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgdmFyIHRsID0gdGVzdC54O1xyXG4gICAgICAgICAgICB2YXIgdHQgPSB0ZXN0Lnk7XHJcbiAgICAgICAgICAgIHZhciB0ciA9IHRlc3QueCArIHRlc3Qud2lkdGg7XHJcbiAgICAgICAgICAgIHZhciB0YiA9IHRlc3QueSArIHRlc3QuaGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgaWYgKHNsIDwgdGwgfHwgc3QgPCB0dCB8fCBzbCA+IHRyIHx8IHN0ID4gdGIpIC8vc3JjIHRvcC1sZWZ0IGlzIG91dHNpZGUgdGVzdFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAoc3IgPCB0bCB8fCBzYiA8IHR0IHx8IHNyID4gdHIgfHwgc2IgPiB0YikgLy9zcmMgYm90dG9tLXJpZ2h0IGlzIG91dHNpZGUgdGVzdFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBjb250YWluc1BvaW50IChyZWN0MTogUmVjdCwgcDogUG9pbnQpOiBib29sZWFuIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlY3QxLnggPD0gcC54XHJcbiAgICAgICAgICAgICAgICAmJiByZWN0MS55IDw9IHAueVxyXG4gICAgICAgICAgICAgICAgJiYgKHJlY3QxLnggKyByZWN0MS53aWR0aCkgPj0gcC54XHJcbiAgICAgICAgICAgICAgICAmJiAocmVjdDEueSArIHJlY3QxLmhlaWdodCkgPj0gcC55O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGV4dGVuZFRvIChkZXN0OiBSZWN0LCB4OiBudW1iZXIsIHk6IG51bWJlcikge1xyXG4gICAgICAgICAgICB2YXIgcnggPSBkZXN0Lng7XHJcbiAgICAgICAgICAgIHZhciByeSA9IGRlc3QueTtcclxuICAgICAgICAgICAgdmFyIHJ3ID0gZGVzdC53aWR0aDtcclxuICAgICAgICAgICAgdmFyIHJoID0gZGVzdC5oZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoeCA8IHJ4IHx8IHggPiAocnggKyBydykpXHJcbiAgICAgICAgICAgICAgICBydyA9IE1hdGgubWF4KE1hdGguYWJzKHggLSByeCksIE1hdGguYWJzKHggLSByeCAtIHJ3KSk7XHJcbiAgICAgICAgICAgIGlmICh5IDwgcnkgfHwgeSA+IChyeSArIHJoKSlcclxuICAgICAgICAgICAgICAgIHJoID0gTWF0aC5tYXgoTWF0aC5hYnMoeSAtIHJ5KSwgTWF0aC5hYnMoeSAtIHJ5IC0gcmgpKTtcclxuXHJcbiAgICAgICAgICAgIGRlc3QueCA9IE1hdGgubWluKHJ4LCB4KTtcclxuICAgICAgICAgICAgZGVzdC55ID0gTWF0aC5taW4ocnksIHkpO1xyXG4gICAgICAgICAgICBkZXN0LndpZHRoID0gcnc7XHJcbiAgICAgICAgICAgIGRlc3QuaGVpZ2h0ID0gcmg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgZ3JvdyAoZGVzdDogUmVjdCwgbGVmdDogbnVtYmVyLCB0b3A6IG51bWJlciwgcmlnaHQ6IG51bWJlciwgYm90dG9tOiBudW1iZXIpIHtcclxuICAgICAgICAgICAgZGVzdC54IC09IGxlZnQ7XHJcbiAgICAgICAgICAgIGRlc3QueSAtPSB0b3A7XHJcbiAgICAgICAgICAgIGRlc3Qud2lkdGggKz0gbGVmdCArIHJpZ2h0O1xyXG4gICAgICAgICAgICBkZXN0LmhlaWdodCArPSB0b3AgKyBib3R0b207XHJcbiAgICAgICAgICAgIGlmIChkZXN0LndpZHRoIDwgMClcclxuICAgICAgICAgICAgICAgIGRlc3Qud2lkdGggPSAwO1xyXG4gICAgICAgICAgICBpZiAoZGVzdC5oZWlnaHQgPCAwKVxyXG4gICAgICAgICAgICAgICAgZGVzdC5oZWlnaHQgPSAwO1xyXG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBzaHJpbmsgKGRlc3Q6IFJlY3QsIGxlZnQ6IG51bWJlciwgdG9wOiBudW1iZXIsIHJpZ2h0OiBudW1iZXIsIGJvdHRvbTogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIGRlc3QueCArPSBsZWZ0O1xyXG4gICAgICAgICAgICBkZXN0LnkgKz0gdG9wO1xyXG4gICAgICAgICAgICBkZXN0LndpZHRoIC09IGxlZnQgKyByaWdodDtcclxuICAgICAgICAgICAgZGVzdC5oZWlnaHQgLT0gdG9wICsgYm90dG9tO1xyXG4gICAgICAgICAgICBpZiAoZGVzdC53aWR0aCA8IDApXHJcbiAgICAgICAgICAgICAgICBkZXN0LndpZHRoID0gMDtcclxuICAgICAgICAgICAgaWYgKGRlc3QuaGVpZ2h0IDwgMClcclxuICAgICAgICAgICAgICAgIGRlc3QuaGVpZ2h0ID0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyByZWN0SW4gKHJlY3QxOiBSZWN0LCByZWN0MjogUmVjdCkge1xyXG4gICAgICAgICAgICAvL1RPRE86IEltcGxlbWVudCB3aXRob3V0IGNyZWF0aW5nIFJlY3RcclxuICAgICAgICAgICAgdmFyIGNvcHkgPSBuZXcgUmVjdCgpO1xyXG4gICAgICAgICAgICBSZWN0LmNvcHlUbyhyZWN0MSwgY29weSk7XHJcbiAgICAgICAgICAgIFJlY3QuaW50ZXJzZWN0aW9uKGNvcHksIHJlY3QyKTtcclxuICAgICAgICAgICAgaWYgKFJlY3QuaXNFbXB0eShjb3B5KSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBSZWN0T3ZlcmxhcC5PdXQ7XHJcbiAgICAgICAgICAgIGlmIChSZWN0LmlzRXF1YWwoY29weSwgcmVjdDIpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFJlY3RPdmVybGFwLkluO1xyXG4gICAgICAgICAgICByZXR1cm4gUmVjdE92ZXJsYXAuUGFydDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyB0cmFuc2Zvcm0gKGRlc3Q6IFJlY3QsIG1hdDogbnVtYmVyW10pIHtcclxuICAgICAgICAgICAgaWYgKCFtYXQpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVzdDtcclxuICAgICAgICAgICAgdmFyIHggPSBkZXN0Lng7XHJcbiAgICAgICAgICAgIHZhciB5ID0gZGVzdC55O1xyXG4gICAgICAgICAgICB2YXIgd2lkdGggPSBkZXN0LndpZHRoO1xyXG4gICAgICAgICAgICB2YXIgaGVpZ2h0ID0gZGVzdC5oZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICB2ZWMyLmluaXQoeCwgeSwgcDEpO1xyXG4gICAgICAgICAgICB2ZWMyLmluaXQoeCArIHdpZHRoLCB5LCBwMik7XHJcbiAgICAgICAgICAgIHZlYzIuaW5pdCh4ICsgd2lkdGgsIHkgKyBoZWlnaHQsIHAzKTtcclxuICAgICAgICAgICAgdmVjMi5pbml0KHgsIHkgKyBoZWlnaHQsIHA0KTtcclxuXHJcbiAgICAgICAgICAgIG1hdDMudHJhbnNmb3JtVmVjMihtYXQsIHAxKTtcclxuICAgICAgICAgICAgbWF0My50cmFuc2Zvcm1WZWMyKG1hdCwgcDIpO1xyXG4gICAgICAgICAgICBtYXQzLnRyYW5zZm9ybVZlYzIobWF0LCBwMyk7XHJcbiAgICAgICAgICAgIG1hdDMudHJhbnNmb3JtVmVjMihtYXQsIHA0KTtcclxuXHJcbiAgICAgICAgICAgIHZhciBsID0gTWF0aC5taW4ocDFbMF0sIHAyWzBdLCBwM1swXSwgcDRbMF0pO1xyXG4gICAgICAgICAgICB2YXIgdCA9IE1hdGgubWluKHAxWzFdLCBwMlsxXSwgcDNbMV0sIHA0WzFdKTtcclxuICAgICAgICAgICAgdmFyIHIgPSBNYXRoLm1heChwMVswXSwgcDJbMF0sIHAzWzBdLCBwNFswXSk7XHJcbiAgICAgICAgICAgIHZhciBiID0gTWF0aC5tYXgocDFbMV0sIHAyWzFdLCBwM1sxXSwgcDRbMV0pO1xyXG5cclxuICAgICAgICAgICAgZGVzdC54ID0gbDtcclxuICAgICAgICAgICAgZGVzdC55ID0gdDtcclxuICAgICAgICAgICAgZGVzdC53aWR0aCA9IHIgLSBsO1xyXG4gICAgICAgICAgICBkZXN0LmhlaWdodCA9IGIgLSB0O1xyXG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyB0cmFuc2Zvcm00IChkZXN0OiBSZWN0LCBwcm9qZWN0aW9uOiBudW1iZXJbXSkge1xyXG4gICAgICAgICAgICAvL1NlZSBtYXQvdHJhbnNmb3JtNC50c1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIm5hbWVzcGFjZSBtaXJhZ2Uge1xyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJU2l6ZSB7XHJcbiAgICAgICAgd2lkdGg6IG51bWJlcjtcclxuICAgICAgICBoZWlnaHQ6IG51bWJlcjtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgU2l6ZSBpbXBsZW1lbnRzIElTaXplIHtcclxuICAgICAgICB3aWR0aDogbnVtYmVyO1xyXG4gICAgICAgIGhlaWdodDogbnVtYmVyO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvciAod2lkdGg/OiBudW1iZXIsIGhlaWdodD86IG51bWJlcikge1xyXG4gICAgICAgICAgICB0aGlzLndpZHRoID0gd2lkdGggPT0gbnVsbCA/IDAgOiB3aWR0aDtcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQgPT0gbnVsbCA/IDAgOiBoZWlnaHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgY29weVRvIChzcmM6IElTaXplLCBkZXN0OiBJU2l6ZSkge1xyXG4gICAgICAgICAgICBkZXN0LndpZHRoID0gc3JjLndpZHRoO1xyXG4gICAgICAgICAgICBkZXN0LmhlaWdodCA9IHNyYy5oZWlnaHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgaXNFcXVhbCAoc2l6ZTE6IElTaXplLCBzaXplMjogSVNpemUpOiBib29sZWFuIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNpemUxLndpZHRoID09PSBzaXplMi53aWR0aFxyXG4gICAgICAgICAgICAgICAgJiYgc2l6ZTEuaGVpZ2h0ID09PSBzaXplMi5oZWlnaHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgaXNFbXB0eSAoc2l6ZTogU2l6ZSk6IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICByZXR1cm4gc2l6ZS53aWR0aCA9PT0gMFxyXG4gICAgICAgICAgICAgICAgfHwgc2l6ZS5oZWlnaHQgPT09IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgbWF4IChkZXN0OiBJU2l6ZSwgc2l6ZTI6IElTaXplKSB7XHJcbiAgICAgICAgICAgIGRlc3Qud2lkdGggPSBNYXRoLm1heChkZXN0LndpZHRoLCBzaXplMi53aWR0aCk7XHJcbiAgICAgICAgICAgIGRlc3QuaGVpZ2h0ID0gTWF0aC5tYXgoZGVzdC5oZWlnaHQsIHNpemUyLmhlaWdodCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgbWluIChkZXN0OiBJU2l6ZSwgc2l6ZTI6IElTaXplKSB7XHJcbiAgICAgICAgICAgIGRlc3Qud2lkdGggPSBNYXRoLm1pbihkZXN0LndpZHRoLCBzaXplMi53aWR0aCk7XHJcbiAgICAgICAgICAgIGRlc3QuaGVpZ2h0ID0gTWF0aC5taW4oZGVzdC5oZWlnaHQsIHNpemUyLmhlaWdodCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgcm91bmQoc2l6ZTogSVNpemUpIHtcclxuICAgICAgICAgICAgc2l6ZS53aWR0aCA9IE1hdGgucm91bmQoc2l6ZS53aWR0aCk7XHJcbiAgICAgICAgICAgIHNpemUuaGVpZ2h0ID0gTWF0aC5yb3VuZChzaXplLmhlaWdodCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgaXNVbmRlZiAoc2l6ZTogSVNpemUpOiBib29sZWFuIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlzTmFOKHNpemUud2lkdGgpICYmIGlzTmFOKHNpemUuaGVpZ2h0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBjbGVhciAoc2l6ZTogSVNpemUpIHtcclxuICAgICAgICAgICAgc2l6ZS53aWR0aCA9IDA7XHJcbiAgICAgICAgICAgIHNpemUuaGVpZ2h0ID0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyB1bmRlZiAoc2l6ZTogSVNpemUpIHtcclxuICAgICAgICAgICAgc2l6ZS53aWR0aCA9IE5hTjtcclxuICAgICAgICAgICAgc2l6ZS5oZWlnaHQgPSBOYU47XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwibmFtZXNwYWNlIG1pcmFnZSB7XG4gICAgZXhwb3J0IGludGVyZmFjZSBJU3RhY2tQYW5lbElucHV0cyBleHRlbmRzIGNvcmUuSUxheW91dE5vZGVJbnB1dHMge1xuICAgICAgICBvcmllbnRhdGlvbjogT3JpZW50YXRpb247XG4gICAgfVxuXG4gICAgZXhwb3J0IGNsYXNzIFN0YWNrUGFuZWwgZXh0ZW5kcyBQYW5lbCB7XG4gICAgICAgIGlucHV0czogSVN0YWNrUGFuZWxJbnB1dHM7XG5cbiAgICAgICAgcHJvdGVjdGVkIGNyZWF0ZUlucHV0cygpOiBJU3RhY2tQYW5lbElucHV0cyB7XG4gICAgICAgICAgICB2YXIgaW5wdXRzID0gPElTdGFja1BhbmVsSW5wdXRzPnN1cGVyLmNyZWF0ZUlucHV0cygpO1xuICAgICAgICAgICAgaW5wdXRzLm9yaWVudGF0aW9uID0gT3JpZW50YXRpb24uSG9yaXpvbnRhbDtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dHM7XG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgbWVhc3VyZU92ZXJyaWRlKGNvbnN0cmFpbnQ6IElTaXplKTogSVNpemUge1xuICAgICAgICAgICAgaWYgKHRoaXMuaW5wdXRzLm9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5WZXJ0aWNhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1lYXN1cmVWZXJ0aWNhbChjb25zdHJhaW50KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWVhc3VyZUhvcml6b250YWwoY29uc3RyYWludCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIG1lYXN1cmVWZXJ0aWNhbChjb25zdHJhaW50OiBJU2l6ZSk6IElTaXplIHtcbiAgICAgICAgICAgIHZhciBjYSA9IG5ldyBTaXplKE51bWJlci5QT1NJVElWRV9JTkZJTklUWSwgTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZKTtcbiAgICAgICAgICAgIHZhciBtZWFzdXJlZCA9IG5ldyBTaXplKCk7XG4gICAgICAgICAgICB2YXIgaW5wdXRzID0gdGhpcy5pbnB1dHM7XG5cbiAgICAgICAgICAgIGNhLndpZHRoID0gY29uc3RyYWludC53aWR0aDtcbiAgICAgICAgICAgIGlmICghaXNOYU4oaW5wdXRzLndpZHRoKSlcbiAgICAgICAgICAgICAgICBjYS53aWR0aCA9IGlucHV0cy53aWR0aDtcbiAgICAgICAgICAgIGNhLndpZHRoID0gTWF0aC5taW4oY2Eud2lkdGgsIGlucHV0cy5tYXhXaWR0aCk7XG4gICAgICAgICAgICBjYS53aWR0aCA9IE1hdGgubWF4KGNhLndpZHRoLCBpbnB1dHMubWluV2lkdGgpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciB3YWxrZXIgPSB0aGlzLnRyZWUud2FsaygpOyB3YWxrZXIuc3RlcCgpOykge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IHdhbGtlci5jdXJyZW50O1xuICAgICAgICAgICAgICAgIGNoaWxkLm1lYXN1cmUoY2EpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkRGVzaXJlZCA9IGNoaWxkLnN0YXRlLmRlc2lyZWRTaXplO1xuICAgICAgICAgICAgICAgIG1lYXN1cmVkLmhlaWdodCArPSBjaGlsZERlc2lyZWQuaGVpZ2h0O1xuICAgICAgICAgICAgICAgIG1lYXN1cmVkLndpZHRoID0gTWF0aC5tYXgobWVhc3VyZWQud2lkdGgsIGNoaWxkRGVzaXJlZC53aWR0aCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBtZWFzdXJlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgbWVhc3VyZUhvcml6b250YWwoY29uc3RyYWludDogSVNpemUpOiBJU2l6ZSB7XG4gICAgICAgICAgICB2YXIgY2EgPSBuZXcgU2l6ZShOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksIE51bWJlci5QT1NJVElWRV9JTkZJTklUWSk7XG4gICAgICAgICAgICB2YXIgbWVhc3VyZWQgPSBuZXcgU2l6ZSgpO1xuICAgICAgICAgICAgdmFyIGlucHV0cyA9IHRoaXMuaW5wdXRzO1xuXG4gICAgICAgICAgICBjYS5oZWlnaHQgPSBjb25zdHJhaW50LmhlaWdodDtcbiAgICAgICAgICAgIGlmICghaXNOYU4oaW5wdXRzLmhlaWdodCkpXG4gICAgICAgICAgICAgICAgY2EuaGVpZ2h0ID0gaW5wdXRzLmhlaWdodDtcbiAgICAgICAgICAgIGNhLmhlaWdodCA9IE1hdGgubWluKGNhLmhlaWdodCwgaW5wdXRzLm1heEhlaWdodCk7XG4gICAgICAgICAgICBjYS5oZWlnaHQgPSBNYXRoLm1heChjYS5oZWlnaHQsIGlucHV0cy5taW5IZWlnaHQpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciB3YWxrZXIgPSB0aGlzLnRyZWUud2FsaygpOyB3YWxrZXIuc3RlcCgpOykge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IHdhbGtlci5jdXJyZW50O1xuICAgICAgICAgICAgICAgIGNoaWxkLm1lYXN1cmUoY2EpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkRGVzaXJlZCA9IGNoaWxkLnN0YXRlLmRlc2lyZWRTaXplO1xuICAgICAgICAgICAgICAgIG1lYXN1cmVkLndpZHRoICs9IGNoaWxkRGVzaXJlZC53aWR0aDtcbiAgICAgICAgICAgICAgICBtZWFzdXJlZC5oZWlnaHQgPSBNYXRoLm1heChtZWFzdXJlZC5oZWlnaHQsIGNoaWxkRGVzaXJlZC5oZWlnaHQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbWVhc3VyZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgYXJyYW5nZU92ZXJyaWRlKGFycmFuZ2VTaXplOiBJU2l6ZSk6IElTaXplIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlucHV0cy5vcmllbnRhdGlvbiA9PT0gT3JpZW50YXRpb24uVmVydGljYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hcnJhbmdlVmVydGljYWwoYXJyYW5nZVNpemUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hcnJhbmdlSG9yaXpvbnRhbChhcnJhbmdlU2l6ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGFycmFuZ2VWZXJ0aWNhbChhcnJhbmdlU2l6ZTogSVNpemUpOiBJU2l6ZSB7XG4gICAgICAgICAgICB2YXIgYXJyYW5nZWQgPSBuZXcgU2l6ZShhcnJhbmdlU2l6ZS53aWR0aCwgMCk7XG5cbiAgICAgICAgICAgIGZvciAodmFyIHdhbGtlciA9IHRoaXMudHJlZS53YWxrKCk7IHdhbGtlci5zdGVwKCk7KSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gd2Fsa2VyLmN1cnJlbnQ7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkRGVzaXJlZCA9IGNoaWxkLnN0YXRlLmRlc2lyZWRTaXplO1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZEZpbmFsID0gbmV3IFJlY3QoMCwgYXJyYW5nZWQuaGVpZ2h0LCBhcnJhbmdlU2l6ZS53aWR0aCwgY2hpbGREZXNpcmVkLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgaWYgKFJlY3QuaXNFbXB0eShjaGlsZEZpbmFsKSlcbiAgICAgICAgICAgICAgICAgICAgUmVjdC5jbGVhcihjaGlsZEZpbmFsKTtcblxuICAgICAgICAgICAgICAgIGNoaWxkLmFycmFuZ2UoY2hpbGRGaW5hbCk7XG5cbiAgICAgICAgICAgICAgICBhcnJhbmdlZC53aWR0aCA9IE1hdGgubWF4KGFycmFuZ2VkLndpZHRoLCBhcnJhbmdlU2l6ZS53aWR0aCk7XG4gICAgICAgICAgICAgICAgYXJyYW5nZWQuaGVpZ2h0ICs9IGNoaWxkRGVzaXJlZC5oZWlnaHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFycmFuZ2VkLmhlaWdodCA9IE1hdGgubWF4KGFycmFuZ2VkLmhlaWdodCwgYXJyYW5nZVNpemUuaGVpZ2h0KTtcblxuICAgICAgICAgICAgcmV0dXJuIGFycmFuZ2VkO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBhcnJhbmdlSG9yaXpvbnRhbChhcnJhbmdlU2l6ZTogSVNpemUpOiBJU2l6ZSB7XG4gICAgICAgICAgICB2YXIgYXJyYW5nZWQgPSBuZXcgU2l6ZSgwLCBhcnJhbmdlU2l6ZS5oZWlnaHQpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciB3YWxrZXIgPSB0aGlzLnRyZWUud2FsaygpOyB3YWxrZXIuc3RlcCgpOykge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IHdhbGtlci5jdXJyZW50O1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZERlc2lyZWQgPSBjaGlsZC5zdGF0ZS5kZXNpcmVkU2l6ZTtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGRGaW5hbCA9IG5ldyBSZWN0KGFycmFuZ2VkLndpZHRoLCAwLCBjaGlsZERlc2lyZWQud2lkdGgsIGFycmFuZ2VTaXplLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgaWYgKFJlY3QuaXNFbXB0eShjaGlsZEZpbmFsKSlcbiAgICAgICAgICAgICAgICAgICAgUmVjdC5jbGVhcihjaGlsZEZpbmFsKTtcblxuICAgICAgICAgICAgICAgIGNoaWxkLmFycmFuZ2UoY2hpbGRGaW5hbCk7XG5cbiAgICAgICAgICAgICAgICBhcnJhbmdlZC53aWR0aCArPSBjaGlsZERlc2lyZWQud2lkdGg7XG4gICAgICAgICAgICAgICAgYXJyYW5nZWQuaGVpZ2h0ID0gTWF0aC5tYXgoYXJyYW5nZWQuaGVpZ2h0LCBhcnJhbmdlU2l6ZS5oZWlnaHQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhcnJhbmdlZC53aWR0aCA9IE1hdGgubWF4KGFycmFuZ2VkLndpZHRoLCBhcnJhbmdlU2l6ZS53aWR0aCk7XG5cbiAgICAgICAgICAgIHJldHVybiBhcnJhbmdlZDtcbiAgICAgICAgfVxuICAgIH1cbn0iLCJuYW1lc3BhY2UgbWlyYWdlIHtcclxuICAgIGV4cG9ydCBjbGFzcyBUaGlja25lc3Mge1xyXG4gICAgICAgIGxlZnQ6IG51bWJlcjtcclxuICAgICAgICB0b3A6IG51bWJlcjtcclxuICAgICAgICByaWdodDogbnVtYmVyO1xyXG4gICAgICAgIGJvdHRvbTogbnVtYmVyO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvciAobGVmdD86IG51bWJlciwgdG9wPzogbnVtYmVyLCByaWdodD86IG51bWJlciwgYm90dG9tPzogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGVmdCA9IGxlZnQgPT0gbnVsbCA/IDAgOiBsZWZ0O1xyXG4gICAgICAgICAgICB0aGlzLnRvcCA9IHRvcCA9PSBudWxsID8gMCA6IHRvcDtcclxuICAgICAgICAgICAgdGhpcy5yaWdodCA9IHJpZ2h0ID09IG51bGwgPyAwIDogcmlnaHQ7XHJcbiAgICAgICAgICAgIHRoaXMuYm90dG9tID0gYm90dG9tID09IG51bGwgPyAwIDogYm90dG9tO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGFkZCAoZGVzdDogVGhpY2tuZXNzLCB0MjogVGhpY2tuZXNzKSB7XHJcbiAgICAgICAgICAgIGRlc3QubGVmdCArPSB0Mi5sZWZ0O1xyXG4gICAgICAgICAgICBkZXN0LnRvcCArPSB0Mi50b3A7XHJcbiAgICAgICAgICAgIGRlc3QucmlnaHQgKz0gdDIucmlnaHQ7XHJcbiAgICAgICAgICAgIGRlc3QuYm90dG9tICs9IHQyLmJvdHRvbTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBjb3B5VG8gKHRoaWNrbmVzczogVGhpY2tuZXNzLCBkZXN0OiBUaGlja25lc3MpIHtcclxuICAgICAgICAgICAgZGVzdC5sZWZ0ID0gdGhpY2tuZXNzLmxlZnQ7XHJcbiAgICAgICAgICAgIGRlc3QudG9wID0gdGhpY2tuZXNzLnRvcDtcclxuICAgICAgICAgICAgZGVzdC5yaWdodCA9IHRoaWNrbmVzcy5yaWdodDtcclxuICAgICAgICAgICAgZGVzdC5ib3R0b20gPSB0aGlja25lc3MuYm90dG9tO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGlzRW1wdHkgKHRoaWNrbmVzczogVGhpY2tuZXNzKTogYm9vbGVhbiB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlja25lc3MubGVmdCA9PT0gMCAmJiB0aGlja25lc3MudG9wID09PSAwICYmIHRoaWNrbmVzcy5yaWdodCA9PT0gMCAmJiB0aGlja25lc3MuYm90dG9tID09PSAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGlzQmFsYW5jZWQgKHRoaWNrbmVzczogVGhpY2tuZXNzKTogYm9vbGVhbiB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlja25lc3MubGVmdCA9PT0gdGhpY2tuZXNzLnRvcFxyXG4gICAgICAgICAgICAgICAgJiYgdGhpY2tuZXNzLmxlZnQgPT09IHRoaWNrbmVzcy5yaWdodFxyXG4gICAgICAgICAgICAgICAgJiYgdGhpY2tuZXNzLmxlZnQgPT09IHRoaWNrbmVzcy5ib3R0b207XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgc2hyaW5rU2l6ZSAodGhpY2tuZXNzOiBUaGlja25lc3MsIGRlc3Q6IFNpemUpIHtcclxuICAgICAgICAgICAgdmFyIHcgPSBkZXN0LndpZHRoO1xyXG4gICAgICAgICAgICB2YXIgaCA9IGRlc3QuaGVpZ2h0O1xyXG4gICAgICAgICAgICBpZiAodyAhPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkpXHJcbiAgICAgICAgICAgICAgICB3IC09IHRoaWNrbmVzcy5sZWZ0ICsgdGhpY2tuZXNzLnJpZ2h0O1xyXG4gICAgICAgICAgICBpZiAoaCAhPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkpXHJcbiAgICAgICAgICAgICAgICBoIC09IHRoaWNrbmVzcy50b3AgKyB0aGlja25lc3MuYm90dG9tO1xyXG4gICAgICAgICAgICBkZXN0LndpZHRoID0gdyA+IDAgPyB3IDogMDtcclxuICAgICAgICAgICAgZGVzdC5oZWlnaHQgPSBoID4gMCA/IGggOiAwO1xyXG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBzaHJpbmtSZWN0ICh0aGlja25lc3M6IFRoaWNrbmVzcywgZGVzdDogUmVjdCkge1xyXG4gICAgICAgICAgICBkZXN0LnggKz0gdGhpY2tuZXNzLmxlZnQ7XHJcbiAgICAgICAgICAgIGRlc3QueSArPSB0aGlja25lc3MudG9wO1xyXG4gICAgICAgICAgICBkZXN0LndpZHRoIC09IHRoaWNrbmVzcy5sZWZ0ICsgdGhpY2tuZXNzLnJpZ2h0O1xyXG4gICAgICAgICAgICBkZXN0LmhlaWdodCAtPSB0aGlja25lc3MudG9wICsgdGhpY2tuZXNzLmJvdHRvbTtcclxuICAgICAgICAgICAgaWYgKGRlc3Qud2lkdGggPCAwKVxyXG4gICAgICAgICAgICAgICAgZGVzdC53aWR0aCA9IDA7XHJcbiAgICAgICAgICAgIGlmIChkZXN0LmhlaWdodCA8IDApXHJcbiAgICAgICAgICAgICAgICBkZXN0LmhlaWdodCA9IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgc2hyaW5rQ29ybmVyUmFkaXVzICh0aGlja25lc3M6IFRoaWNrbmVzcywgZGVzdDogSUNvcm5lclJhZGl1cykge1xyXG4gICAgICAgICAgICBkZXN0LnRvcExlZnQgPSBNYXRoLm1heChkZXN0LnRvcExlZnQgLSBNYXRoLm1heCh0aGlja25lc3MubGVmdCwgdGhpY2tuZXNzLnRvcCkgKiAwLjUsIDApO1xyXG4gICAgICAgICAgICBkZXN0LnRvcFJpZ2h0ID0gTWF0aC5tYXgoZGVzdC50b3BSaWdodCAtIE1hdGgubWF4KHRoaWNrbmVzcy5yaWdodCwgdGhpY2tuZXNzLnRvcCkgKiAwLjUsIDApO1xyXG4gICAgICAgICAgICBkZXN0LmJvdHRvbVJpZ2h0ID0gTWF0aC5tYXgoZGVzdC5ib3R0b21SaWdodCAtIE1hdGgubWF4KHRoaWNrbmVzcy5yaWdodCwgdGhpY2tuZXNzLmJvdHRvbSkgKiAwLjUsIDApO1xyXG4gICAgICAgICAgICBkZXN0LmJvdHRvbUxlZnQgPSBNYXRoLm1heChkZXN0LmJvdHRvbUxlZnQgLSBNYXRoLm1heCh0aGlja25lc3MubGVmdCwgdGhpY2tuZXNzLmJvdHRvbSkgKiAwLjUsIDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGdyb3dTaXplICh0aGlja25lc3M6IFRoaWNrbmVzcywgZGVzdDogU2l6ZSkge1xyXG4gICAgICAgICAgICB2YXIgdyA9IGRlc3Qud2lkdGg7XHJcbiAgICAgICAgICAgIHZhciBoID0gZGVzdC5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGlmICh3ICE9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSlcclxuICAgICAgICAgICAgICAgIHcgKz0gdGhpY2tuZXNzLmxlZnQgKyB0aGlja25lc3MucmlnaHQ7XHJcbiAgICAgICAgICAgIGlmIChoICE9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSlcclxuICAgICAgICAgICAgICAgIGggKz0gdGhpY2tuZXNzLnRvcCArIHRoaWNrbmVzcy5ib3R0b207XHJcbiAgICAgICAgICAgIGRlc3Qud2lkdGggPSB3ID4gMCA/IHcgOiAwO1xyXG4gICAgICAgICAgICBkZXN0LmhlaWdodCA9IGggPiAwID8gaCA6IDA7XHJcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGdyb3dSZWN0ICh0aGlja25lc3M6IFRoaWNrbmVzcywgZGVzdDogUmVjdCkge1xyXG4gICAgICAgICAgICBkZXN0LnggLT0gdGhpY2tuZXNzLmxlZnQ7XHJcbiAgICAgICAgICAgIGRlc3QueSAtPSB0aGlja25lc3MudG9wO1xyXG4gICAgICAgICAgICBkZXN0LndpZHRoICs9IHRoaWNrbmVzcy5sZWZ0ICsgdGhpY2tuZXNzLnJpZ2h0O1xyXG4gICAgICAgICAgICBkZXN0LmhlaWdodCArPSB0aGlja25lc3MudG9wICsgdGhpY2tuZXNzLmJvdHRvbTtcclxuICAgICAgICAgICAgaWYgKGRlc3Qud2lkdGggPCAwKVxyXG4gICAgICAgICAgICAgICAgZGVzdC53aWR0aCA9IDA7XHJcbiAgICAgICAgICAgIGlmIChkZXN0LmhlaWdodCA8IDApXHJcbiAgICAgICAgICAgICAgICBkZXN0LmhlaWdodCA9IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgZ3Jvd0Nvcm5lclJhZGl1cyAodGhpY2tuZXNzOiBUaGlja25lc3MsIGRlc3Q6IElDb3JuZXJSYWRpdXMpIHtcclxuICAgICAgICAgICAgZGVzdC50b3BMZWZ0ID0gZGVzdC50b3BMZWZ0ID8gTWF0aC5tYXgoZGVzdC50b3BMZWZ0ICsgTWF0aC5tYXgodGhpY2tuZXNzLmxlZnQsIHRoaWNrbmVzcy50b3ApICogMC41LCAwKSA6IDA7XHJcbiAgICAgICAgICAgIGRlc3QudG9wUmlnaHQgPSBkZXN0LnRvcFJpZ2h0ID8gTWF0aC5tYXgoZGVzdC50b3BSaWdodCArIE1hdGgubWF4KHRoaWNrbmVzcy5yaWdodCwgdGhpY2tuZXNzLnRvcCkgKiAwLjUsIDApIDogMDtcclxuICAgICAgICAgICAgZGVzdC5ib3R0b21SaWdodCA9IGRlc3QuYm90dG9tUmlnaHQgPyBNYXRoLm1heChkZXN0LmJvdHRvbVJpZ2h0ICsgTWF0aC5tYXgodGhpY2tuZXNzLnJpZ2h0LCB0aGlja25lc3MuYm90dG9tKSAqIDAuNSwgMCkgOiAwO1xyXG4gICAgICAgICAgICBkZXN0LmJvdHRvbUxlZnQgPSBkZXN0LmJvdHRvbUxlZnQgPyBNYXRoLm1heChkZXN0LmJvdHRvbUxlZnQgKyBNYXRoLm1heCh0aGlja25lc3MubGVmdCwgdGhpY2tuZXNzLmJvdHRvbSkgKiAwLjUsIDApIDogMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJuYW1lc3BhY2UgbWlyYWdlLlZlY3RvciB7XHJcbiAgICB2YXIgRVBTSUxPTiA9IDFlLTEwO1xyXG5cclxuICAgIGV4cG9ydCBmdW5jdGlvbiBjcmVhdGUoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBudW1iZXJbXSB7XHJcbiAgICAgICAgcmV0dXJuIFt4LCB5XTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgZnVuY3Rpb24gcmV2ZXJzZSh2OiBudW1iZXJbXSkge1xyXG4gICAgICAgIHZbMF0gPSAtdlswXTtcclxuICAgICAgICB2WzFdID0gLXZbMV07XHJcbiAgICAgICAgcmV0dXJuIHY7XHJcbiAgICB9XHJcblxyXG4gICAgLy8vIEVxdWl2YWxlbnQgb2Ygcm90YXRpbmcgOTAgZGVncmVlcyBjbG9ja3dpc2UgKHNjcmVlbiBzcGFjZSlcclxuICAgIGV4cG9ydCBmdW5jdGlvbiBvcnRob2dvbmFsKHY6IG51bWJlcltdKSB7XHJcbiAgICAgICAgdmFyIHggPSB2WzBdLFxyXG4gICAgICAgICAgICB5ID0gdlsxXTtcclxuICAgICAgICB2WzBdID0gLXk7XHJcbiAgICAgICAgdlsxXSA9IHg7XHJcbiAgICAgICAgcmV0dXJuIHY7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZSh2OiBudW1iZXJbXSkge1xyXG4gICAgICAgIHZhciB4ID0gdlswXSxcclxuICAgICAgICAgICAgeSA9IHZbMV07XHJcbiAgICAgICAgdmFyIGxlbiA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5KTtcclxuICAgICAgICB2WzBdID0geCAvIGxlbjtcclxuICAgICAgICB2WzFdID0geSAvIGxlbjtcclxuICAgICAgICByZXR1cm4gdjtcclxuICAgIH1cclxuXHJcbiAgICAvLy8gUm90YXRlcyBhIHZlY3Rvcih2KSBieSBhbmdsZSh0aGV0YSkgY2xvY2t3aXNlKHNjcmVlbiBzcGFjZSkgLi4ud2hpY2ggaXMgY291bnRlci1jbG9ja3dpc2UgaW4gY29vcmRpbmF0ZSBzcGFjZVxyXG4gICAgZXhwb3J0IGZ1bmN0aW9uIHJvdGF0ZSh2OiBudW1iZXJbXSwgdGhldGE6IG51bWJlcikge1xyXG4gICAgICAgIHZhciBjID0gTWF0aC5jb3ModGhldGEpO1xyXG4gICAgICAgIHZhciBzID0gTWF0aC5zaW4odGhldGEpO1xyXG4gICAgICAgIHZhciB4ID0gdlswXTtcclxuICAgICAgICB2YXIgeSA9IHZbMV07XHJcbiAgICAgICAgdlswXSA9IHggKiBjIC0geSAqIHM7XHJcbiAgICAgICAgdlsxXSA9IHggKiBzICsgeSAqIGM7XHJcbiAgICAgICAgcmV0dXJuIHY7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvLy8gUmV0dXJucyBzbWFsbGVzdCBhbmdsZSAoaW4gcmFkaWFucykgYmV0d2VlbiAyIHZlY3RvcnNcclxuICAgIGV4cG9ydCBmdW5jdGlvbiBhbmdsZUJldHdlZW4odTogbnVtYmVyW10sIHY6IG51bWJlcltdKTogbnVtYmVyIHtcclxuICAgICAgICB2YXIgdXggPSB1WzBdLFxyXG4gICAgICAgICAgICB1eSA9IHVbMV0sXHJcbiAgICAgICAgICAgIHZ4ID0gdlswXSxcclxuICAgICAgICAgICAgdnkgPSB2WzFdO1xyXG4gICAgICAgIHZhciBudW0gPSB1eCAqIHZ4ICsgdXkgKiB2eTtcclxuICAgICAgICB2YXIgZGVuID0gTWF0aC5zcXJ0KHV4ICogdXggKyB1eSAqIHV5KSAqIE1hdGguc3FydCh2eCAqIHZ4ICsgdnkgKiB2eSk7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguYWNvcyhudW0gLyBkZW4pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vLyBCeSByb3RhdGluZyBmcm9tIHZlY3Rvcih2MSkgdG8gdmVjdG9yKHYyKSwgdGVzdHMgd2hldGhlciB0aGF0IGFuZ2xlIGlzIGNsb2Nrd2lzZSAoc2NyZWVuIHNwYWNlKVxyXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGlzQ2xvY2t3aXNlVG8odjE6IG51bWJlcltdLCB2MjogbnVtYmVyW10pIHtcclxuICAgICAgICB2YXIgdGhldGEgPSBhbmdsZUJldHdlZW4odjEsIHYyKTtcclxuICAgICAgICB2YXIgbnYxID0gbm9ybWFsaXplKHYxLnNsaWNlKDApKTtcclxuICAgICAgICB2YXIgbnYyID0gbm9ybWFsaXplKHYyLnNsaWNlKDApKTtcclxuICAgICAgICByb3RhdGUobnYxLCB0aGV0YSk7XHJcbiAgICAgICAgdmFyIG54ID0gTWF0aC5hYnMobnYxWzBdIC0gbnYyWzBdKTtcclxuICAgICAgICB2YXIgbnkgPSBNYXRoLmFicyhudjFbMV0gLSBudjJbMV0pO1xyXG4gICAgICAgIHJldHVybiBueCA8IEVQU0lMT05cclxuICAgICAgICAgICAgJiYgbnkgPCBFUFNJTE9OO1xyXG4gICAgfVxyXG5cclxuICAgIC8vLyBGaW5kcyBpbnRlcnNlY3Rpb24gb2YgdjEoczEgKyB0KGQxKSkgYW5kIHYyKHMyICsgdChkMikpXHJcbiAgICBleHBvcnQgZnVuY3Rpb24gaW50ZXJzZWN0aW9uKHMxOiBudW1iZXJbXSwgZDE6IG51bWJlcltdLCBzMjogbnVtYmVyW10sIGQyOiBudW1iZXJbXSk6IG51bWJlcltdIHtcclxuICAgICAgICB2YXIgeDEgPSBzMVswXTtcclxuICAgICAgICB2YXIgeTEgPSBzMVsxXTtcclxuICAgICAgICB2YXIgeDIgPSB4MSArIGQxWzBdO1xyXG4gICAgICAgIHZhciB5MiA9IHkxICsgZDFbMV07XHJcblxyXG4gICAgICAgIHZhciB4MyA9IHMyWzBdO1xyXG4gICAgICAgIHZhciB5MyA9IHMyWzFdO1xyXG4gICAgICAgIHZhciB4NCA9IHgzICsgZDJbMF07XHJcbiAgICAgICAgdmFyIHk0ID0geTMgKyBkMlsxXTtcclxuXHJcblxyXG4gICAgICAgIHZhciBkZXQgPSAoeDEgLSB4MikgKiAoeTMgLSB5NCkgLSAoeTEgLSB5MikgKiAoeDMgLSB4NCk7XHJcbiAgICAgICAgaWYgKGRldCA9PT0gMClcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIHZhciB4biA9ICgoeDEgKiB5MiAtIHkxICogeDIpICogKHgzIC0geDQpKSAtICgoeDEgLSB4MikgKiAoeDMgKiB5NCAtIHkzICogeDQpKTtcclxuICAgICAgICB2YXIgeW4gPSAoKHgxICogeTIgLSB5MSAqIHgyKSAqICh5MyAtIHk0KSkgLSAoKHkxIC0geTIpICogKHgzICogeTQgLSB5MyAqIHg0KSk7XHJcbiAgICAgICAgcmV0dXJuIFt4biAvIGRldCwgeW4gLyBkZXRdO1xyXG4gICAgfVxyXG59IiwibmFtZXNwYWNlIG1pcmFnZSB7XHJcbiAgICBleHBvcnQgZW51bSBWaXNpYmlsaXR5IHtcclxuICAgICAgICBWaXNpYmxlID0gMCxcclxuICAgICAgICBDb2xsYXBzZWQgPSAxXHJcbiAgICB9XHJcbn0iLCJuYW1lc3BhY2UgbWlyYWdlLmNvcmUge1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgSUFycmFuZ2VJbnB1dHMge1xuICAgICAgICB2aXNpYmxlOiBib29sZWFuO1xuICAgICAgICBtYXJnaW46IFRoaWNrbmVzcztcbiAgICAgICAgd2lkdGg6IG51bWJlcjtcbiAgICAgICAgaGVpZ2h0OiBudW1iZXI7XG4gICAgICAgIG1pbldpZHRoOiBudW1iZXI7XG4gICAgICAgIG1pbkhlaWdodDogbnVtYmVyO1xuICAgICAgICBtYXhXaWR0aDogbnVtYmVyO1xuICAgICAgICBtYXhIZWlnaHQ6IG51bWJlcjtcbiAgICAgICAgdXNlTGF5b3V0Um91bmRpbmc6IGJvb2xlYW47XG4gICAgICAgIGhvcml6b250YWxBbGlnbm1lbnQ6IEhvcml6b250YWxBbGlnbm1lbnQ7XG4gICAgICAgIHZlcnRpY2FsQWxpZ25tZW50OiBWZXJ0aWNhbEFsaWdubWVudDtcbiAgICB9XG5cbiAgICBleHBvcnQgaW50ZXJmYWNlIElBcnJhbmdlU3RhdGUge1xuICAgICAgICBmbGFnczogTGF5b3V0RmxhZ3M7XG4gICAgICAgIHByZXZpb3VzQXZhaWxhYmxlOiBJU2l6ZTtcbiAgICAgICAgZGVzaXJlZFNpemU6IElTaXplO1xuICAgICAgICBoaWRkZW5EZXNpcmU6IElTaXplO1xuICAgICAgICBsYXlvdXRTbG90OiBSZWN0O1xuICAgICAgICB2aXN1YWxPZmZzZXQ6IFBvaW50O1xuICAgICAgICBhcnJhbmdlZDogSVNpemU7XG4gICAgICAgIGxhc3RBcnJhbmdlZDogSVNpemU7XG4gICAgfVxuXG4gICAgZXhwb3J0IGludGVyZmFjZSBJQXJyYW5nZUJpbmRlciB7XG4gICAgICAgICgpOiBib29sZWFuO1xuICAgIH1cblxuICAgIGV4cG9ydCBmdW5jdGlvbiBOZXdBcnJhbmdlQmluZGVyKHN0YXRlOiBJQXJyYW5nZVN0YXRlLCB0cmVlOiBJTGF5b3V0VHJlZSwgYXJyYW5nZXI6IElBcnJhbmdlcik6IElBcnJhbmdlQmluZGVyIHtcbiAgICAgICAgLypcbiAgICAgICAgIGZ1bmN0aW9uIGV4cGFuZFZpZXdwb3J0ICh2aWV3cG9ydDogUmVjdCkge1xuICAgICAgICAgaWYgKHRyZWUuaXNMYXlvdXRDb250YWluZXIpIHtcbiAgICAgICAgIFNpemUuY29weVRvKHN0YXRlLmRlc2lyZWRTaXplLCB2aWV3cG9ydCk7XG4gICAgICAgICBpZiAodHJlZS5zdXJmYWNlKSB7XG4gICAgICAgICB2YXIgbWVhc3VyZSA9IHN0YXRlLnByZXZpb3VzQXZhaWxhYmxlO1xuICAgICAgICAgaWYgKCFTaXplLmlzVW5kZWYobWVhc3VyZSkpIHtcbiAgICAgICAgIHZpZXdwb3J0LndpZHRoID0gTWF0aC5tYXgodmlld3BvcnQud2lkdGgsIG1lYXN1cmUud2lkdGgpO1xuICAgICAgICAgdmlld3BvcnQuaGVpZ2h0ID0gTWF0aC5tYXgodmlld3BvcnQuaGVpZ2h0LCBtZWFzdXJlLmhlaWdodCk7XG4gICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgdmlld3BvcnQud2lkdGggPSB0cmVlLnN1cmZhY2Uud2lkdGg7XG4gICAgICAgICB2aWV3cG9ydC5oZWlnaHQgPSB0cmVlLnN1cmZhY2UuaGVpZ2h0O1xuICAgICAgICAgfVxuICAgICAgICAgfVxuICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgIHZpZXdwb3J0LndpZHRoID0gYXNzZXRzLmFjdHVhbFdpZHRoO1xuICAgICAgICAgdmlld3BvcnQuaGVpZ2h0ID0gYXNzZXRzLmFjdHVhbEhlaWdodDtcbiAgICAgICAgIH1cbiAgICAgICAgIH1cbiAgICAgICAgIGZ1bmN0aW9uIHNoaWZ0Vmlld3BvcnQgKHZpZXdwb3J0OiBSZWN0KSB7XG4gICAgICAgICAvL05PVEU6IENvZXJjaW5nIHVuZGVmaW5lZCwgbnVsbCwgTmFOLCBhbmQgMCB0byAwXG4gICAgICAgICB2aWV3cG9ydC54ID0gdXBkYXRlci5nZXRBdHRhY2hlZFZhbHVlKFwiQ2FudmFzLkxlZnRcIikgfHwgMDtcbiAgICAgICAgIHZpZXdwb3J0LnkgPSB1cGRhdGVyLmdldEF0dGFjaGVkVmFsdWUoXCJDYW52YXMuVG9wXCIpIHx8IDA7XG4gICAgICAgICB9XG4gICAgICAgICAqL1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKTogYm9vbGVhbiB7XG4gICAgICAgICAgICB2YXIgbGFzdCA9IHN0YXRlLmxheW91dFNsb3QgfHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICBUT0RPOiBUaGlzIGlzIGludGVuZGVkIHRvIGV4cGFuZCBhIHRvcC1sZXZlbCBub2RlIHRvIGNvbnN1bWUgZW50aXJlIHN1cmZhY2UgYXJlYVxuICAgICAgICAgICAgIC0gRG8gd2UgbmVlZCB0aGlzP1xuICAgICAgICAgICAgIC0gQ2FuIHdlIGRvIHRoaXMgb3RoZXIgd2F5cz9cbiAgICAgICAgICAgICBpZiAoIXRyZWUucGFyZW50KSB7XG4gICAgICAgICAgICAgbGFzdCA9IG5ldyBSZWN0KCk7XG4gICAgICAgICAgICAgZXhwYW5kVmlld3BvcnQobGFzdCk7XG4gICAgICAgICAgICAgc2hpZnRWaWV3cG9ydChsYXN0KTtcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgaWYgKGxhc3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJyYW5nZXIobGFzdCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRyZWUucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgdHJlZS5wYXJlbnQuaW52YWxpZGF0ZUFycmFuZ2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBleHBvcnQgaW50ZXJmYWNlIElBcnJhbmdlciB7XG4gICAgICAgIChmaW5hbFJlY3Q6IFJlY3QpOiBib29sZWFuO1xuICAgIH1cbiAgICBleHBvcnQgaW50ZXJmYWNlIElBcnJhbmdlT3ZlcnJpZGUge1xuICAgICAgICAoZmluYWxTaXplOiBJU2l6ZSk6IElTaXplO1xuICAgIH1cblxuICAgIGV4cG9ydCBmdW5jdGlvbiBOZXdBcnJhbmdlcihpbnB1dHM6IElBcnJhbmdlSW5wdXRzLCBzdGF0ZTogSUFycmFuZ2VTdGF0ZSwgdHJlZTogSUxheW91dFRyZWUsIG92ZXJyaWRlOiBJQXJyYW5nZU92ZXJyaWRlKTogSUFycmFuZ2VyIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmaW5hbFJlY3Q6IFJlY3QpOiBib29sZWFuIHtcbiAgICAgICAgICAgIGlmIChpbnB1dHMudmlzaWJsZSAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQXBwbHkgcm91bmRpbmdcbiAgICAgICAgICAgIHZhciBjaGlsZFJlY3QgPSBuZXcgUmVjdCgpO1xuICAgICAgICAgICAgaWYgKGlucHV0cy51c2VMYXlvdXRSb3VuZGluZykge1xuICAgICAgICAgICAgICAgIGNoaWxkUmVjdC54ID0gTWF0aC5yb3VuZChmaW5hbFJlY3QueCk7XG4gICAgICAgICAgICAgICAgY2hpbGRSZWN0LnkgPSBNYXRoLnJvdW5kKGZpbmFsUmVjdC55KTtcbiAgICAgICAgICAgICAgICBjaGlsZFJlY3Qud2lkdGggPSBNYXRoLnJvdW5kKGZpbmFsUmVjdC53aWR0aCk7XG4gICAgICAgICAgICAgICAgY2hpbGRSZWN0LmhlaWdodCA9IE1hdGgucm91bmQoZmluYWxSZWN0LmhlaWdodCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIFJlY3QuY29weVRvKGZpbmFsUmVjdCwgY2hpbGRSZWN0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVmFsaWRhdGVcbiAgICAgICAgICAgIGlmIChjaGlsZFJlY3Qud2lkdGggPCAwIHx8IGNoaWxkUmVjdC5oZWlnaHQgPCAwXG4gICAgICAgICAgICAgICAgfHwgIWlzRmluaXRlKGNoaWxkUmVjdC53aWR0aCkgfHwgIWlzRmluaXRlKGNoaWxkUmVjdC5oZWlnaHQpXG4gICAgICAgICAgICAgICAgfHwgaXNOYU4oY2hpbGRSZWN0LngpIHx8IGlzTmFOKGNoaWxkUmVjdC55KVxuICAgICAgICAgICAgICAgIHx8IGlzTmFOKGNoaWxkUmVjdC53aWR0aCkgfHwgaXNOYU4oY2hpbGRSZWN0LmhlaWdodCkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJbbWlyYWdlXSBjYW5ub3QgY2FsbCBhcnJhbmdlIHVzaW5nIHJlY3Qgd2l0aCBOYU4vaW5maW5pdGUgdmFsdWVzLlwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIENoZWNrIG5lZWQgdG8gYXJyYW5nZVxuICAgICAgICAgICAgaWYgKChzdGF0ZS5mbGFncyAmIExheW91dEZsYWdzLkFycmFuZ2UpIDw9IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoUmVjdC5pc0VxdWFsKHN0YXRlLmxheW91dFNsb3QsIGNoaWxkUmVjdCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBSZWN0LmNvcHlUbyhjaGlsZFJlY3QsIHN0YXRlLmxheW91dFNsb3QpO1xuXG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgc3RyZXRjaGVkXG4gICAgICAgICAgICBUaGlja25lc3Muc2hyaW5rUmVjdChpbnB1dHMubWFyZ2luLCBjaGlsZFJlY3QpO1xuICAgICAgICAgICAgdmFyIHN0cmV0Y2hlZCA9IG5ldyBTaXplKGNoaWxkUmVjdC53aWR0aCwgY2hpbGRSZWN0LmhlaWdodCk7XG4gICAgICAgICAgICBjb2VyY2VTaXplKHN0cmV0Y2hlZCwgaW5wdXRzKTtcblxuICAgICAgICAgICAgLy8gUHJlcGFyZSBvdmVycmlkZVxuICAgICAgICAgICAgdmFyIGZyYW1ld29yayA9IG5ldyBTaXplKCk7XG4gICAgICAgICAgICBjb2VyY2VTaXplKGZyYW1ld29yaywgaW5wdXRzKTtcbiAgICAgICAgICAgIGlmIChpbnB1dHMuaG9yaXpvbnRhbEFsaWdubWVudCA9PT0gSG9yaXpvbnRhbEFsaWdubWVudC5TdHJldGNoKSB7XG4gICAgICAgICAgICAgICAgZnJhbWV3b3JrLndpZHRoID0gTWF0aC5tYXgoZnJhbWV3b3JrLndpZHRoLCBzdHJldGNoZWQud2lkdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlucHV0cy52ZXJ0aWNhbEFsaWdubWVudCA9PT0gVmVydGljYWxBbGlnbm1lbnQuU3RyZXRjaCkge1xuICAgICAgICAgICAgICAgIGZyYW1ld29yay5oZWlnaHQgPSBNYXRoLm1heChmcmFtZXdvcmsuaGVpZ2h0LCBzdHJldGNoZWQuaGVpZ2h0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBvZmZlciA9IG5ldyBTaXplKHN0YXRlLmhpZGRlbkRlc2lyZS53aWR0aCwgc3RhdGUuaGlkZGVuRGVzaXJlLmhlaWdodCk7XG4gICAgICAgICAgICBTaXplLm1heChvZmZlciwgZnJhbWV3b3JrKTtcblxuICAgICAgICAgICAgLy8gRG8gb3ZlcnJpZGVcbiAgICAgICAgICAgIHZhciBhcnJhbmdlZCA9IG92ZXJyaWRlKG9mZmVyKTtcblxuICAgICAgICAgICAgLy8gQ29tcGxldGUgb3ZlcnJpZGVcbiAgICAgICAgICAgIHN0YXRlLmZsYWdzICY9IH5MYXlvdXRGbGFncy5BcnJhbmdlO1xuICAgICAgICAgICAgaWYgKGlucHV0cy51c2VMYXlvdXRSb3VuZGluZykge1xuICAgICAgICAgICAgICAgIFNpemUucm91bmQoYXJyYW5nZWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDb25zdHJhaW5cbiAgICAgICAgICAgIHZhciBjb25zdHJhaW5lZCA9IG5ldyBTaXplKGFycmFuZ2VkLndpZHRoLCBhcnJhbmdlZC5oZWlnaHQpO1xuICAgICAgICAgICAgY29lcmNlU2l6ZShjb25zdHJhaW5lZCwgaW5wdXRzKTtcbiAgICAgICAgICAgIFNpemUubWluKGNvbnN0cmFpbmVkLCBhcnJhbmdlZCk7XG5cbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB2aXN1YWwgb2Zmc2V0XG4gICAgICAgICAgICB2YXIgdm8gPSBzdGF0ZS52aXN1YWxPZmZzZXQ7XG4gICAgICAgICAgICBQb2ludC5jb3B5VG8oY2hpbGRSZWN0LCB2byk7XG4gICAgICAgICAgICBzd2l0Y2ggKGlucHV0cy5ob3Jpem9udGFsQWxpZ25tZW50KSB7XG4gICAgICAgICAgICAgICAgY2FzZSBIb3Jpem9udGFsQWxpZ25tZW50LkxlZnQ6XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgSG9yaXpvbnRhbEFsaWdubWVudC5SaWdodDpcbiAgICAgICAgICAgICAgICAgICAgdm8ueCArPSBjaGlsZFJlY3Qud2lkdGggLSBjb25zdHJhaW5lZC53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBIb3Jpem9udGFsQWxpZ25tZW50LkNlbnRlcjpcbiAgICAgICAgICAgICAgICAgICAgdm8ueCArPSAoY2hpbGRSZWN0LndpZHRoIC0gY29uc3RyYWluZWQud2lkdGgpICogMC41O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICB2by54ICs9IE1hdGgubWF4KChjaGlsZFJlY3Qud2lkdGggLSBjb25zdHJhaW5lZC53aWR0aCkgKiAwLjUsIDApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAoaW5wdXRzLnZlcnRpY2FsQWxpZ25tZW50KSB7XG4gICAgICAgICAgICAgICAgY2FzZSBWZXJ0aWNhbEFsaWdubWVudC5Ub3A6XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgVmVydGljYWxBbGlnbm1lbnQuQm90dG9tOlxuICAgICAgICAgICAgICAgICAgICB2by55ICs9IGNoaWxkUmVjdC5oZWlnaHQgLSBjb25zdHJhaW5lZC5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgVmVydGljYWxBbGlnbm1lbnQuQ2VudGVyOlxuICAgICAgICAgICAgICAgICAgICB2by55ICs9IChjaGlsZFJlY3QuaGVpZ2h0IC0gY29uc3RyYWluZWQuaGVpZ2h0KSAqIDAuNTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgdm8ueSArPSBNYXRoLm1heCgoY2hpbGRSZWN0LmhlaWdodCAtIGNvbnN0cmFpbmVkLmhlaWdodCkgKiAwLjUsIDApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpbnB1dHMudXNlTGF5b3V0Um91bmRpbmcpIHtcbiAgICAgICAgICAgICAgICBQb2ludC5yb3VuZCh2byk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEN5Y2xlIG9sZCArIGN1cnJlbnQgYXJyYW5nZWQgZm9yIHNpemluZ1xuICAgICAgICAgICAgdmFyIG9sZEFycmFuZ2UgPSBzdGF0ZS5hcnJhbmdlZDtcbiAgICAgICAgICAgIGlmICghU2l6ZS5pc0VxdWFsKG9sZEFycmFuZ2UsIGFycmFuZ2VkKSkge1xuICAgICAgICAgICAgICAgIFNpemUuY29weVRvKG9sZEFycmFuZ2UsIHN0YXRlLmxhc3RBcnJhbmdlZCk7XG4gICAgICAgICAgICAgICAgc3RhdGUuZmxhZ3MgfD0gTGF5b3V0RmxhZ3MuU2l6ZUhpbnQ7XG4gICAgICAgICAgICAgICAgdHJlZS5wcm9wYWdhdGVGbGFnVXAoTGF5b3V0RmxhZ3MuU2l6ZUhpbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgU2l6ZS5jb3B5VG8oYXJyYW5nZWQsIHN0YXRlLmFycmFuZ2VkKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG59IiwibmFtZXNwYWNlIG1pcmFnZS5jb3JlIHtcbiAgICBleHBvcnQgZnVuY3Rpb24gRGVmYXVsdExheW91dFRyZWUoKTogSUxheW91dFRyZWUge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaXNDb250YWluZXI6IHRydWUsXG4gICAgICAgICAgICBpc0xheW91dENvbnRhaW5lcjogZmFsc2UsXG4gICAgICAgICAgICBwYXJlbnQ6IG51bGwsXG4gICAgICAgICAgICBhcHBseVRlbXBsYXRlKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb3BhZ2F0ZUZsYWdVcChmbGFnOiBMYXlvdXRGbGFncykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGN1cjogTGF5b3V0Tm9kZSA9IHRoaXMucGFyZW50OyAhIWN1ciAmJiAoY3VyLnN0YXRlLmZsYWdzICYgZmxhZykgPD0gMDsgY3VyID0gY3VyLnRyZWUucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGN1ci5zdGF0ZS5mbGFncyB8PSBmbGFnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB3YWxrKHJldmVyc2U/OiBib29sZWFuKTogSUxheW91dFRyZWVXYWxrZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgc3RlcCgpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgIH1cbn0iLCJuYW1lc3BhY2UgbWlyYWdlLmNvcmUge1xuICAgIGV4cG9ydCBlbnVtIExheW91dEZsYWdzIHtcbiAgICAgICAgTm9uZSA9IDAsXG5cbiAgICAgICAgTWVhc3VyZSA9IDEgPDwgMSxcbiAgICAgICAgQXJyYW5nZSA9IDEgPDwgMixcblxuICAgICAgICBNZWFzdXJlSGludCA9IDEgPDwgMyxcbiAgICAgICAgQXJyYW5nZUhpbnQgPSAxIDw8IDQsXG4gICAgICAgIFNpemVIaW50ICAgID0gMSA8PCA1LFxuICAgICAgICBIaW50cyAgICAgICA9IE1lYXN1cmVIaW50IHwgQXJyYW5nZUhpbnQgfCBTaXplSGludCxcbiAgICB9XG59XG4iLCJuYW1lc3BhY2UgbWlyYWdlLmNvcmUge1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgSU1lYXN1cmVJbnB1dHMge1xuICAgICAgICB2aXNpYmxlOiBib29sZWFuO1xuICAgICAgICBtYXJnaW46IFRoaWNrbmVzcztcbiAgICAgICAgd2lkdGg6IG51bWJlcjtcbiAgICAgICAgaGVpZ2h0OiBudW1iZXI7XG4gICAgICAgIG1pbldpZHRoOiBudW1iZXI7XG4gICAgICAgIG1pbkhlaWdodDogbnVtYmVyO1xuICAgICAgICBtYXhXaWR0aDogbnVtYmVyO1xuICAgICAgICBtYXhIZWlnaHQ6IG51bWJlcjtcbiAgICAgICAgdXNlTGF5b3V0Um91bmRpbmc6IGJvb2xlYW47XG4gICAgfVxuXG4gICAgZXhwb3J0IGludGVyZmFjZSBJTWVhc3VyZVN0YXRlIHtcbiAgICAgICAgZmxhZ3M6IExheW91dEZsYWdzO1xuICAgICAgICBwcmV2aW91c0F2YWlsYWJsZTogSVNpemU7XG4gICAgICAgIGRlc2lyZWRTaXplOiBJU2l6ZTtcbiAgICAgICAgaGlkZGVuRGVzaXJlOiBJU2l6ZTtcbiAgICB9XG5cbiAgICBleHBvcnQgaW50ZXJmYWNlIElNZWFzdXJlQmluZGVyIHtcbiAgICAgICAgKCk6IGJvb2xlYW47XG4gICAgfVxuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIE5ld01lYXN1cmVCaW5kZXIoc3RhdGU6IElNZWFzdXJlU3RhdGUsIHRyZWU6IElMYXlvdXRUcmVlLCBtZWFzdXJlcjogSU1lYXN1cmVyKTogSU1lYXN1cmVCaW5kZXIge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgdmFyIGxhc3QgPSBzdGF0ZS5wcmV2aW91c0F2YWlsYWJsZTtcblxuICAgICAgICAgICAgaWYgKFNpemUuaXNVbmRlZihsYXN0KSAmJiAhdHJlZS5wYXJlbnQgJiYgdHJlZS5pc0xheW91dENvbnRhaW5lcilcbiAgICAgICAgICAgICAgICBsYXN0LndpZHRoID0gbGFzdC5oZWlnaHQgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG5cbiAgICAgICAgICAgIHZhciBzdWNjZXNzID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAoIVNpemUuaXNVbmRlZihsYXN0KSkge1xuICAgICAgICAgICAgICAgIHZhciBvbGQgPSBuZXcgU2l6ZSgpO1xuICAgICAgICAgICAgICAgIFNpemUuY29weVRvKHN0YXRlLmRlc2lyZWRTaXplLCBvbGQpO1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3MgPSBtZWFzdXJlcihsYXN0KTtcbiAgICAgICAgICAgICAgICBpZiAoU2l6ZS5pc0VxdWFsKG9sZCwgc3RhdGUuZGVzaXJlZFNpemUpKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VzcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRyZWUucGFyZW50KVxuICAgICAgICAgICAgICAgIHRyZWUucGFyZW50LmludmFsaWRhdGVNZWFzdXJlKCk7XG5cbiAgICAgICAgICAgIHN0YXRlLmZsYWdzICY9IH5MYXlvdXRGbGFncy5NZWFzdXJlO1xuICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3M7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZXhwb3J0IGludGVyZmFjZSBJTWVhc3VyZXIge1xuICAgICAgICAoYXZhaWxhYmxlU2l6ZTogSVNpemUpOiBib29sZWFuO1xuICAgIH1cbiAgICBleHBvcnQgaW50ZXJmYWNlIElNZWFzdXJlT3ZlcnJpZGUge1xuICAgICAgICAoY29yZVNpemU6IElTaXplKTogU2l6ZTtcbiAgICB9XG5cbiAgICBleHBvcnQgZnVuY3Rpb24gTmV3TWVhc3VyZXIoaW5wdXRzOiBJTWVhc3VyZUlucHV0cywgc3RhdGU6IElNZWFzdXJlU3RhdGUsIHRyZWU6IElMYXlvdXRUcmVlLCBvdmVycmlkZTogSU1lYXN1cmVPdmVycmlkZSk6IElNZWFzdXJlciB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoYXZhaWxhYmxlU2l6ZTogSVNpemUpOiBib29sZWFuIHtcbiAgICAgICAgICAgIC8vIFZhbGlkYXRlXG4gICAgICAgICAgICBpZiAoaXNOYU4oYXZhaWxhYmxlU2l6ZS53aWR0aCkgfHwgaXNOYU4oYXZhaWxhYmxlU2l6ZS5oZWlnaHQpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiW21pcmFnZV0gY2Fubm90IGNhbGwgbWVhc3VyZSB1c2luZyBhIHNpemUgd2l0aCBOYU4gdmFsdWVzLlwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaW5wdXRzLnZpc2libGUgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEFwcGx5IFRlbXBsYXRlXG4gICAgICAgICAgICB0cmVlLmFwcGx5VGVtcGxhdGUoKTtcblxuICAgICAgICAgICAgLy8gQ2hlY2sgbmVlZCB0byBtZWFzdXJlXG4gICAgICAgICAgICBpZiAoKHN0YXRlLmZsYWdzICYgTGF5b3V0RmxhZ3MuTWVhc3VyZSkgPD0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBwYyA9IHN0YXRlLnByZXZpb3VzQXZhaWxhYmxlO1xuICAgICAgICAgICAgaWYgKCFTaXplLmlzVW5kZWYocGMpICYmIHBjLndpZHRoID09PSBhdmFpbGFibGVTaXplLndpZHRoICYmIHBjLmhlaWdodCA9PT0gYXZhaWxhYmxlU2l6ZS5oZWlnaHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEludmFsaWRhdGUgZG93bnN0cmVhbVxuICAgICAgICAgICAgc3RhdGUuZmxhZ3MgfD0gKExheW91dEZsYWdzLkFycmFuZ2UgfCBMYXlvdXRGbGFncy5BcnJhbmdlSGludCk7XG5cbiAgICAgICAgICAgIC8vIFByZXBhcmUgZm9yIG92ZXJyaWRlXG4gICAgICAgICAgICB2YXIgZnJhbWVkU2l6ZSA9IG5ldyBTaXplKGF2YWlsYWJsZVNpemUud2lkdGgsIGF2YWlsYWJsZVNpemUuaGVpZ2h0KTtcbiAgICAgICAgICAgIFRoaWNrbmVzcy5zaHJpbmtTaXplKGlucHV0cy5tYXJnaW4sIGZyYW1lZFNpemUpO1xuICAgICAgICAgICAgY29lcmNlU2l6ZShmcmFtZWRTaXplLCBpbnB1dHMpO1xuXG4gICAgICAgICAgICAvLyBEbyBvdmVycmlkZVxuICAgICAgICAgICAgdmFyIGRlc2lyZWQgPSBvdmVycmlkZShmcmFtZWRTaXplKTtcblxuICAgICAgICAgICAgLy8gQ29tcGxldGUgb3ZlcnJpZGVcbiAgICAgICAgICAgIHN0YXRlLmZsYWdzICY9IH5MYXlvdXRGbGFncy5NZWFzdXJlO1xuICAgICAgICAgICAgU2l6ZS5jb3B5VG8oZGVzaXJlZCwgc3RhdGUuaGlkZGVuRGVzaXJlKTtcblxuICAgICAgICAgICAgLy8gRmluaXNoIGRlc2lyZWRcbiAgICAgICAgICAgIGNvZXJjZVNpemUoZGVzaXJlZCwgaW5wdXRzKTtcbiAgICAgICAgICAgIFRoaWNrbmVzcy5ncm93U2l6ZShpbnB1dHMubWFyZ2luLCBkZXNpcmVkKTtcblxuICAgICAgICAgICAgZGVzaXJlZC53aWR0aCA9IE1hdGgubWluKGRlc2lyZWQud2lkdGgsIGF2YWlsYWJsZVNpemUud2lkdGgpO1xuICAgICAgICAgICAgZGVzaXJlZC5oZWlnaHQgPSBNYXRoLm1pbihkZXNpcmVkLmhlaWdodCwgYXZhaWxhYmxlU2l6ZS5oZWlnaHQpO1xuICAgICAgICAgICAgaWYgKGlucHV0cy51c2VMYXlvdXRSb3VuZGluZykge1xuICAgICAgICAgICAgICAgIFNpemUucm91bmQoZGVzaXJlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBTaXplLmNvcHlUbyhkZXNpcmVkLCBzdGF0ZS5kZXNpcmVkU2l6ZSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuICAgIH1cbn0iLCJuYW1lc3BhY2UgbWlyYWdlLmNvcmUge1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgSVNpemVkIHtcbiAgICAgICAgd2lkdGg6IG51bWJlcjtcbiAgICAgICAgaGVpZ2h0OiBudW1iZXI7XG4gICAgICAgIG1pbldpZHRoOiBudW1iZXI7XG4gICAgICAgIG1pbkhlaWdodDogbnVtYmVyO1xuICAgICAgICBtYXhXaWR0aDogbnVtYmVyO1xuICAgICAgICBtYXhIZWlnaHQ6IG51bWJlcjtcbiAgICAgICAgdXNlTGF5b3V0Um91bmRpbmc6IGJvb2xlYW47XG4gICAgfVxuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGNvZXJjZVNpemUoc2l6ZTogSVNpemUsIGlucHV0czogSVNpemVkKSB7XG4gICAgICAgIHZhciBjdyA9IE1hdGgubWF4KGlucHV0cy5taW5XaWR0aCwgc2l6ZS53aWR0aCk7XG4gICAgICAgIHZhciBjaCA9IE1hdGgubWF4KGlucHV0cy5taW5IZWlnaHQsIHNpemUuaGVpZ2h0KTtcblxuICAgICAgICBpZiAoIWlzTmFOKGlucHV0cy53aWR0aCkpXG4gICAgICAgICAgICBjdyA9IGlucHV0cy53aWR0aDtcblxuICAgICAgICBpZiAoIWlzTmFOKGlucHV0cy5oZWlnaHQpKVxuICAgICAgICAgICAgY2ggPSBpbnB1dHMuaGVpZ2h0O1xuXG4gICAgICAgIGN3ID0gTWF0aC5tYXgoTWF0aC5taW4oY3csIGlucHV0cy5tYXhXaWR0aCksIGlucHV0cy5taW5XaWR0aCk7XG4gICAgICAgIGNoID0gTWF0aC5tYXgoTWF0aC5taW4oY2gsIGlucHV0cy5tYXhIZWlnaHQpLCBpbnB1dHMubWluSGVpZ2h0KTtcblxuICAgICAgICBpZiAoaW5wdXRzLnVzZUxheW91dFJvdW5kaW5nKSB7XG4gICAgICAgICAgICBjdyA9IE1hdGgucm91bmQoY3cpO1xuICAgICAgICAgICAgY2ggPSBNYXRoLnJvdW5kKGNoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNpemUud2lkdGggPSBjdztcbiAgICAgICAgc2l6ZS5oZWlnaHQgPSBjaDtcbiAgICB9XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2NvcmUvTGF5b3V0RmxhZ3NcIiAvPlxuXG5uYW1lc3BhY2UgbWlyYWdlLmRyYWZ0IHtcbiAgICBpbXBvcnQgTGF5b3V0RmxhZ3MgPSBtaXJhZ2UuY29yZS5MYXlvdXRGbGFncztcblxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSUFycmFuZ2VEcmFmdGVyIHtcbiAgICAgICAgZmx1c2goKTtcbiAgICAgICAgcHJlcGFyZSgpOiBib29sZWFuO1xuICAgICAgICBkcmFmdCgpOiBib29sZWFuO1xuICAgIH1cblxuICAgIGV4cG9ydCBmdW5jdGlvbiBOZXdBcnJhbmdlRHJhZnRlcihub2RlOiBjb3JlLkxheW91dE5vZGUpOiBJQXJyYW5nZURyYWZ0ZXIge1xuICAgICAgICB2YXIgYXJyYW5nZUxpc3Q6IGNvcmUuTGF5b3V0Tm9kZVtdID0gW107XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZsdXNoKCkge1xuICAgICAgICAgICAgICAgIHZhciBjdXI6IGNvcmUuTGF5b3V0Tm9kZTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoKGN1ciA9IGFycmFuZ2VMaXN0LnNoaWZ0KCkpICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VyLnRyZWUucHJvcGFnYXRlRmxhZ1VwKExheW91dEZsYWdzLkFycmFuZ2VIaW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJlcGFyZSgpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciB3YWxrZXIgPSBub2RlLndhbGtEZWVwKCk7IHdhbGtlci5zdGVwKCk7KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXIgPSB3YWxrZXIuY3VycmVudDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdXIuaW5wdXRzLnZpc2libGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhbGtlci5za2lwQnJhbmNoKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICgoY3VyLnN0YXRlLmZsYWdzICYgTGF5b3V0RmxhZ3MuQXJyYW5nZUhpbnQpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YWxrZXIuc2tpcEJyYW5jaCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjdXIuc3RhdGUuZmxhZ3MgJj0gfkxheW91dEZsYWdzLkFycmFuZ2VIaW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAoKGN1ci5zdGF0ZS5mbGFncyAmIExheW91dEZsYWdzLkFycmFuZ2UpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyYW5nZUxpc3QucHVzaChjdXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhcnJhbmdlTGlzdC5sZW5ndGggPiAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRyYWZ0KCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHZhciBjdXI6IGNvcmUuTGF5b3V0Tm9kZTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoKGN1ciA9IGFycmFuZ2VMaXN0LnNoaWZ0KCkpICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VyLmRvQXJyYW5nZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2NvcmUvTGF5b3V0RmxhZ3NcIiAvPlxuXG5uYW1lc3BhY2UgbWlyYWdlLmRyYWZ0IHtcbiAgICBpbXBvcnQgTGF5b3V0RmxhZ3MgPSBtaXJhZ2UuY29yZS5MYXlvdXRGbGFncztcblxuICAgIHZhciBNQVhfQ09VTlQgPSAyNTU7XG5cbiAgICBleHBvcnQgaW50ZXJmYWNlIElEcmFmdGVyIHtcbiAgICAgICAgKCk6IGJvb2xlYW47XG4gICAgfVxuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIE5ld0RyYWZ0ZXIobm9kZTogY29yZS5MYXlvdXROb2RlLCByb290U2l6ZTogSVNpemUpOiBJRHJhZnRlciB7XG4gICAgICAgIHZhciBtZWFzdXJlID0gTmV3TWVhc3VyZURyYWZ0ZXIobm9kZSwgcm9vdFNpemUpO1xuICAgICAgICB2YXIgYXJyYW5nZSA9IE5ld0FycmFuZ2VEcmFmdGVyKG5vZGUpO1xuICAgICAgICB2YXIgc2l6ZSA9IE5ld1NpemVEcmFmdGVyKG5vZGUpO1xuXG4gICAgICAgIC8vLyBFdmVyeSBwYXNzIGF0IHJ1bkRyYWZ0IHdpbGwgZXhjbHVzaXZlbHkgcnVuIG1lYXN1cmUsIGFycmFuZ2UsIG9yIHNpemVcbiAgICAgICAgLy8vIHRydWUgc2hvdWxkIGJlIHJldHVybmVkIGlmIGFueSB1cGRhdGVzIHdlcmUgbWFkZVxuICAgICAgICBmdW5jdGlvbiBydW5EcmFmdCgpOiBib29sZWFuIHtcbiAgICAgICAgICAgIGlmICghbm9kZS5pbnB1dHMudmlzaWJsZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgIGFycmFuZ2UuZmx1c2goKTtcbiAgICAgICAgICAgIHNpemUuZmx1c2goKTtcblxuICAgICAgICAgICAgdmFyIGZsYWdzID0gbm9kZS5zdGF0ZS5mbGFncztcbiAgICAgICAgICAgIGlmICgoZmxhZ3MgJiBMYXlvdXRGbGFncy5NZWFzdXJlSGludCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1lYXN1cmUucHJlcGFyZSgpXG4gICAgICAgICAgICAgICAgICAgICYmIG1lYXN1cmUuZHJhZnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgoZmxhZ3MgJiBMYXlvdXRGbGFncy5BcnJhbmdlSGludCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFycmFuZ2UucHJlcGFyZSgpXG4gICAgICAgICAgICAgICAgICAgICYmIGFycmFuZ2UuZHJhZnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgoZmxhZ3MgJiBMYXlvdXRGbGFncy5TaXplSGludCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpemUucHJlcGFyZSgpXG4gICAgICAgICAgICAgICAgICAgICYmIHNpemUuZHJhZnQoKVxuICAgICAgICAgICAgICAgICAgICAmJiBzaXplLm5vdGlmeSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgaWYgKChub2RlLnN0YXRlLmZsYWdzICYgTGF5b3V0RmxhZ3MuSGludHMpID09PSAwKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIHZhciB1cGRhdGVkID0gZmFsc2U7XG4gICAgICAgICAgICBmb3IgKHZhciBjb3VudCA9IDA7IGNvdW50IDwgTUFYX0NPVU5UOyBjb3VudCsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFydW5EcmFmdCgpKVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB1cGRhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjb3VudCA+PSBNQVhfQ09VTlQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW21pcmFnZV0gYWJvcnRpbmcgaW5maW5pdGUgZHJhZnRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdXBkYXRlZDtcbiAgICAgICAgfTtcbiAgICB9XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2NvcmUvTGF5b3V0RmxhZ3NcIiAvPlxuXG5uYW1lc3BhY2UgbWlyYWdlLmRyYWZ0IHtcbiAgICBpbXBvcnQgTGF5b3V0RmxhZ3MgPSBtaXJhZ2UuY29yZS5MYXlvdXRGbGFncztcblxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSU1lYXN1cmVEcmFmdGVyIHtcbiAgICAgICAgcHJlcGFyZSgpOiBib29sZWFuO1xuICAgICAgICBkcmFmdCgpOiBib29sZWFuO1xuICAgIH1cblxuICAgIGV4cG9ydCBmdW5jdGlvbiBOZXdNZWFzdXJlRHJhZnRlcihub2RlOiBjb3JlLkxheW91dE5vZGUsIHJvb3RTaXplOiBJU2l6ZSk6IElNZWFzdXJlRHJhZnRlciB7XG4gICAgICAgIHZhciBtZWFzdXJlTGlzdDogY29yZS5MYXlvdXROb2RlW10gPSBbXTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcHJlcGFyZSgpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICB2YXIgbGFzdCA9IG5vZGUuc3RhdGUucHJldmlvdXNBdmFpbGFibGU7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUudHJlZS5pc0NvbnRhaW5lciAmJiAoU2l6ZS5pc1VuZGVmKGxhc3QpIHx8ICFTaXplLmlzRXF1YWwobGFzdCwgcm9vdFNpemUpKSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLnN0YXRlLmZsYWdzIHw9IExheW91dEZsYWdzLk1lYXN1cmU7XG4gICAgICAgICAgICAgICAgICAgIFNpemUuY29weVRvKHJvb3RTaXplLCBub2RlLnN0YXRlLnByZXZpb3VzQXZhaWxhYmxlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBMb2FkIHVwIG1lYXN1cmUgbGlzdFxuICAgICAgICAgICAgICAgIGZvciAodmFyIHdhbGtlciA9IG5vZGUud2Fsa0RlZXAoKTsgd2Fsa2VyLnN0ZXAoKTspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1ciA9IHdhbGtlci5jdXJyZW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWN1ci5pbnB1dHMudmlzaWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2Fsa2VyLnNraXBCcmFuY2goKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKChjdXIuc3RhdGUuZmxhZ3MgJiBMYXlvdXRGbGFncy5NZWFzdXJlSGludCkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhbGtlci5za2lwQnJhbmNoKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGN1ci5zdGF0ZS5mbGFncyAmPSB+TGF5b3V0RmxhZ3MuTWVhc3VyZUhpbnQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICgoY3VyLnN0YXRlLmZsYWdzICYgTGF5b3V0RmxhZ3MuTWVhc3VyZSkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZWFzdXJlTGlzdC5wdXNoKGN1cik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbWVhc3VyZUxpc3QubGVuZ3RoID4gMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkcmFmdCgpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VyOiBjb3JlLkxheW91dE5vZGU7XG4gICAgICAgICAgICAgICAgd2hpbGUgKChjdXIgPSBtZWFzdXJlTGlzdC5zaGlmdCgpKSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1ci5kb01lYXN1cmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgIH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vY29yZS9MYXlvdXRGbGFnc1wiIC8+XG5cbm5hbWVzcGFjZSBtaXJhZ2UuZHJhZnQge1xuICAgIGltcG9ydCBMYXlvdXRGbGFncyA9IG1pcmFnZS5jb3JlLkxheW91dEZsYWdzO1xuXG4gICAgZXhwb3J0IGludGVyZmFjZSBJU2l6ZURyYWZ0ZXIge1xuICAgICAgICBmbHVzaCgpO1xuICAgICAgICBwcmVwYXJlKCk6IGJvb2xlYW47XG4gICAgICAgIGRyYWZ0KCk6IGJvb2xlYW47XG4gICAgICAgIG5vdGlmeSgpOiBib29sZWFuO1xuICAgIH1cblxuICAgIGludGVyZmFjZSBJU2l6aW5nVXBkYXRlIHtcbiAgICAgICAgbm9kZTogY29yZS5MYXlvdXROb2RlO1xuICAgICAgICBvbGRTaXplOiBJU2l6ZTtcbiAgICAgICAgbmV3U2l6ZTogSVNpemU7XG4gICAgfVxuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIE5ld1NpemVEcmFmdGVyKG5vZGU6IGNvcmUuTGF5b3V0Tm9kZSk6IElTaXplRHJhZnRlciB7XG4gICAgICAgIHZhciBzaXppbmdMaXN0OiBjb3JlLkxheW91dE5vZGVbXSA9IFtdO1xuICAgICAgICB2YXIgc2l6aW5nVXBkYXRlczogSVNpemluZ1VwZGF0ZVtdID0gW107XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZsdXNoKCkge1xuICAgICAgICAgICAgICAgIHZhciBjdXI6IGNvcmUuTGF5b3V0Tm9kZTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoKGN1ciA9IHNpemluZ0xpc3Quc2hpZnQoKSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjdXIudHJlZS5wcm9wYWdhdGVGbGFnVXAoTGF5b3V0RmxhZ3MuU2l6ZUhpbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmVwYXJlKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHdhbGtlciA9IG5vZGUud2Fsa0RlZXAoKTsgd2Fsa2VyLnN0ZXAoKTspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1ciA9IHdhbGtlci5jdXJyZW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWN1ci5pbnB1dHMudmlzaWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2Fsa2VyLnNraXBCcmFuY2goKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKChjdXIuc3RhdGUuZmxhZ3MgJiBMYXlvdXRGbGFncy5TaXplSGludCkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhbGtlci5za2lwQnJhbmNoKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGN1ci5zdGF0ZS5mbGFncyAmPSB+TGF5b3V0RmxhZ3MuU2l6ZUhpbnQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXIuc3RhdGUubGFzdEFycmFuZ2VkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpemluZ0xpc3QucHVzaChjdXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBzaXppbmdMaXN0Lmxlbmd0aCA+IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHJhZnQoKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgdmFyIG9sZFNpemUgPSBuZXcgU2l6ZSgpO1xuICAgICAgICAgICAgICAgIHZhciBuZXdTaXplID0gbmV3IFNpemUoKTtcbiAgICAgICAgICAgICAgICB2YXIgY3VyOiBjb3JlLkxheW91dE5vZGU7XG4gICAgICAgICAgICAgICAgd2hpbGUgKChjdXIgPSBzaXppbmdMaXN0LnBvcCgpKSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1ci5zaXppbmcob2xkU2l6ZSwgbmV3U2l6ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghU2l6ZS5pc0VxdWFsKG9sZFNpemUsIG5ld1NpemUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaXppbmdVcGRhdGVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGU6IGN1cixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRTaXplOiBvbGRTaXplLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1NpemU6IG5ld1NpemUsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sZFNpemUgPSBuZXcgU2l6ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3U2l6ZSA9IG5ldyBTaXplKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpemluZ1VwZGF0ZXMubGVuZ3RoID4gMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBub3RpZnkoKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgdmFyIHVwZGF0ZTogSVNpemluZ1VwZGF0ZTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoKHVwZGF0ZSA9IHNpemluZ1VwZGF0ZXMucG9wKCkpICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlLm5vZGUub25TaXplQ2hhbmdlZCh1cGRhdGUub2xkU2l6ZSwgdXBkYXRlLm5ld1NpemUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG59IiwiaW50ZXJmYWNlIElNYXRyaXgzU3RhdGljIHtcclxuICAgIGNyZWF0ZSAoc3JjPzogbnVtYmVyW10pOiBudW1iZXJbXTtcclxuICAgIGNvcHlUbyAoc3JjOiBudW1iZXJbXSwgZGVzdDogbnVtYmVyW10pOiBudW1iZXJbXTtcclxuICAgIGluaXQgKGRlc3Q6IG51bWJlcltdLCBtMTE6IG51bWJlciwgbTEyOiBudW1iZXIsIG0yMTogbnVtYmVyLCBtMjI6IG51bWJlciwgeDA6IG51bWJlciwgeTA6IG51bWJlcik6IG51bWJlcltdO1xyXG4gICAgaWRlbnRpdHkgKGRlc3Q/OiBudW1iZXJbXSk6IG51bWJlcltdO1xyXG4gICAgZXF1YWwgKGE6IG51bWJlcltdLCBiOiBudW1iZXJbXSk6IGJvb2xlYW47XHJcbiAgICAvLyBkZXN0ID0gYSAqIGJcclxuICAgIG11bHRpcGx5IChhOiBudW1iZXJbXSwgYjogbnVtYmVyW10sIGRlc3Q/OiBudW1iZXJbXSk6IG51bWJlcltdO1xyXG4gICAgaW52ZXJzZShtYXQ6IG51bWJlcltdLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXTtcclxuICAgIHRyYW5zZm9ybVZlYzIobWF0OiBudW1iZXJbXSwgdmVjOiBudW1iZXJbXSwgZGVzdD86IG51bWJlcltdKTogbnVtYmVyW107XHJcblxyXG4gICAgY3JlYXRlVHJhbnNsYXRlKHg6IG51bWJlciwgeTogbnVtYmVyLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXTtcclxuICAgIHRyYW5zbGF0ZShtYXQ6IG51bWJlcltdLCB4OiBudW1iZXIsIHk6IG51bWJlcik6IG51bWJlcltdO1xyXG4gICAgY3JlYXRlU2NhbGUgKHN4OiBudW1iZXIsIHN5OiBudW1iZXIsIGRlc3Q/OiBudW1iZXJbXSk6IG51bWJlcltdO1xyXG4gICAgc2NhbGUgKG1hdDogbnVtYmVyW10sIHN4OiBudW1iZXIsIHN5OiBudW1iZXIpOiBudW1iZXJbXTtcclxuICAgIGNyZWF0ZVJvdGF0ZSAoYW5nbGVSYWQ6IG51bWJlciwgZGVzdD86IG51bWJlcltdKTogbnVtYmVyW107XHJcbiAgICBjcmVhdGVTa2V3IChhbmdsZVJhZFg6IG51bWJlciwgYW5nbGVSYWRZOiBudW1iZXIsIGRlc3Q/OiBudW1iZXJbXSk6IG51bWJlcltdO1xyXG5cclxuICAgIHByZWFwcGx5KGRlc3Q6IG51bWJlcltdLCBtYXQ6IG51bWJlcltdKTogbnVtYmVyW107XHJcbiAgICBhcHBseShkZXN0OiBudW1iZXJbXSwgbWF0OiBudW1iZXJbXSk6IG51bWJlcltdO1xyXG59XHJcbm5hbWVzcGFjZSBtaXJhZ2Uge1xyXG4gICAgLy8vIE5PVEU6XHJcbiAgICAvLy8gICAgIFJvdy1tYWpvciBvcmRlclxyXG4gICAgLy8vICAgICBbbTExLCBtMTIsIG0yMSwgbTIyLCB4MCwgeTBdXHJcbiAgICB2YXIgRkxPQVRfRVBTSUxPTiA9IDAuMDAwMDAxO1xyXG4gICAgdmFyIGNyZWF0ZVR5cGVkQXJyYXk6IChsZW5ndGg6IG51bWJlcikgPT4gbnVtYmVyW107XHJcblxyXG4gICAgaWYgKHR5cGVvZiBGbG9hdDMyQXJyYXkgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICBjcmVhdGVUeXBlZEFycmF5ID0gZnVuY3Rpb24gKGxlbmd0aDogbnVtYmVyKTogbnVtYmVyW10ge1xyXG4gICAgICAgICAgICByZXR1cm4gPG51bWJlcltdPjxhbnk+bmV3IEZsb2F0MzJBcnJheShsZW5ndGgpO1xyXG4gICAgICAgIH07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNyZWF0ZVR5cGVkQXJyYXkgPSBmdW5jdGlvbiAobGVuZ3RoOiBudW1iZXIpOiBudW1iZXJbXSB7XHJcbiAgICAgICAgICAgIHJldHVybiA8bnVtYmVyW10+bmV3IEFycmF5KGxlbmd0aCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgdmFyIG1hdDM6IElNYXRyaXgzU3RhdGljID0ge1xyXG4gICAgICAgIGNyZWF0ZSAoc3JjPzogbnVtYmVyW10pOiBudW1iZXJbXSB7XHJcbiAgICAgICAgICAgIHZhciBkZXN0ID0gY3JlYXRlVHlwZWRBcnJheSg2KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzcmMpIHtcclxuICAgICAgICAgICAgICAgIGRlc3RbMF0gPSBzcmNbMF07XHJcbiAgICAgICAgICAgICAgICBkZXN0WzFdID0gc3JjWzFdO1xyXG4gICAgICAgICAgICAgICAgZGVzdFsyXSA9IHNyY1syXTtcclxuICAgICAgICAgICAgICAgIGRlc3RbM10gPSBzcmNbM107XHJcbiAgICAgICAgICAgICAgICBkZXN0WzRdID0gc3JjWzRdO1xyXG4gICAgICAgICAgICAgICAgZGVzdFs1XSA9IHNyY1s1XTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGRlc3RbMF0gPSBkZXN0WzFdID0gZGVzdFsyXSA9IGRlc3RbM10gPSBkZXN0WzRdID0gZGVzdFs1XSA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY29weVRvIChzcmM6IG51bWJlcltdLCBkZXN0OiBudW1iZXJbXSk6IG51bWJlcltdIHtcclxuICAgICAgICAgICAgZGVzdFswXSA9IHNyY1swXTtcclxuICAgICAgICAgICAgZGVzdFsxXSA9IHNyY1sxXTtcclxuICAgICAgICAgICAgZGVzdFsyXSA9IHNyY1syXTtcclxuICAgICAgICAgICAgZGVzdFszXSA9IHNyY1szXTtcclxuICAgICAgICAgICAgZGVzdFs0XSA9IHNyY1s0XTtcclxuICAgICAgICAgICAgZGVzdFs1XSA9IHNyY1s1XTtcclxuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpbml0IChkZXN0OiBudW1iZXJbXSwgbTExOiBudW1iZXIsIG0xMjogbnVtYmVyLCBtMjE6IG51bWJlciwgbTIyOiBudW1iZXIsIHgwOiBudW1iZXIsIHkwOiBudW1iZXIpOiBudW1iZXJbXSB7XHJcbiAgICAgICAgICAgIGRlc3RbMF0gPSBtMTE7XHJcbiAgICAgICAgICAgIGRlc3RbMV0gPSBtMTI7XHJcbiAgICAgICAgICAgIGRlc3RbMl0gPSBtMjE7XHJcbiAgICAgICAgICAgIGRlc3RbM10gPSBtMjI7XHJcbiAgICAgICAgICAgIGRlc3RbNF0gPSB4MDtcclxuICAgICAgICAgICAgZGVzdFs1XSA9IHkwO1xyXG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGlkZW50aXR5IChkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXSB7XHJcbiAgICAgICAgICAgIGlmICghZGVzdCkgZGVzdCA9IG1hdDMuY3JlYXRlKCk7XHJcbiAgICAgICAgICAgIGRlc3RbMF0gPSAxO1xyXG4gICAgICAgICAgICBkZXN0WzFdID0gMDtcclxuICAgICAgICAgICAgZGVzdFsyXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbM10gPSAxO1xyXG4gICAgICAgICAgICBkZXN0WzRdID0gMDtcclxuICAgICAgICAgICAgZGVzdFs1XSA9IDA7XHJcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZXF1YWwgKGE6IG51bWJlcltdLCBiOiBudW1iZXJbXSk6IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICByZXR1cm4gYSA9PT0gYiB8fCAoXHJcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5hYnMoYVswXSAtIGJbMF0pIDwgRkxPQVRfRVBTSUxPTiAmJlxyXG4gICAgICAgICAgICAgICAgICAgIE1hdGguYWJzKGFbMV0gLSBiWzFdKSA8IEZMT0FUX0VQU0lMT04gJiZcclxuICAgICAgICAgICAgICAgICAgICBNYXRoLmFicyhhWzJdIC0gYlsyXSkgPCBGTE9BVF9FUFNJTE9OICYmXHJcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5hYnMoYVszXSAtIGJbM10pIDwgRkxPQVRfRVBTSUxPTiAmJlxyXG4gICAgICAgICAgICAgICAgICAgIE1hdGguYWJzKGFbNF0gLSBiWzRdKSA8IEZMT0FUX0VQU0lMT04gJiZcclxuICAgICAgICAgICAgICAgICAgICBNYXRoLmFicyhhWzVdIC0gYls1XSkgPCBGTE9BVF9FUFNJTE9OXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbXVsdGlwbHkgKGE6IG51bWJlcltdLCBiOiBudW1iZXJbXSwgZGVzdD86IG51bWJlcltdKTogbnVtYmVyW10ge1xyXG4gICAgICAgICAgICBpZiAoIWRlc3QpIGRlc3QgPSBhO1xyXG4gICAgICAgICAgICB2YXIgYTExID0gYVswXSwgYTEyID0gYVsxXSxcclxuICAgICAgICAgICAgICAgIGEyMSA9IGFbMl0sIGEyMiA9IGFbM10sXHJcbiAgICAgICAgICAgICAgICBheDAgPSBhWzRdLCBheTAgPSBhWzVdLFxyXG4gICAgICAgICAgICAgICAgYjExID0gYlswXSwgYjEyID0gYlsxXSxcclxuICAgICAgICAgICAgICAgIGIyMSA9IGJbMl0sIGIyMiA9IGJbM10sXHJcbiAgICAgICAgICAgICAgICBieDAgPSBiWzRdLCBieTAgPSBiWzVdO1xyXG5cclxuICAgICAgICAgICAgZGVzdFswXSA9IGExMSAqIGIxMSArIGExMiAqIGIyMTtcclxuICAgICAgICAgICAgZGVzdFsxXSA9IGExMSAqIGIxMiArIGExMiAqIGIyMjtcclxuXHJcbiAgICAgICAgICAgIGRlc3RbMl0gPSBhMjEgKiBiMTEgKyBhMjIgKiBiMjE7XHJcbiAgICAgICAgICAgIGRlc3RbM10gPSBhMjEgKiBiMTIgKyBhMjIgKiBiMjI7XHJcblxyXG4gICAgICAgICAgICBkZXN0WzRdID0gYXgwICogYjExICsgYXkwICogYjIxICsgYngwO1xyXG4gICAgICAgICAgICBkZXN0WzVdID0gYXgwICogYjEyICsgYXkwICogYjIyICsgYnkwO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpbnZlcnNlIChtYXQ6IG51bWJlcltdLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXSB7XHJcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhtYXRbMV0pIDwgRkxPQVRfRVBTSUxPTiAmJiBNYXRoLmFicyhtYXRbMl0pIDwgRkxPQVRfRVBTSUxPTikgLy9TaW1wbGUgc2NhbGluZy90cmFuc2xhdGlvbiBtYXRyaXhcclxuICAgICAgICAgICAgICAgIHJldHVybiBzaW1wbGVfaW52ZXJzZShtYXQsIGRlc3QpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29tcGxleF9pbnZlcnNlKG1hdCwgZGVzdCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0cmFuc2Zvcm1WZWMyIChtYXQ6IG51bWJlcltdLCB2ZWM6IG51bWJlcltdLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXSB7XHJcbiAgICAgICAgICAgIGlmICghZGVzdCkgZGVzdCA9IHZlYztcclxuICAgICAgICAgICAgdmFyIHggPSB2ZWNbMF0sXHJcbiAgICAgICAgICAgICAgICB5ID0gdmVjWzFdO1xyXG4gICAgICAgICAgICBkZXN0WzBdID0gKG1hdFswXSAqIHgpICsgKG1hdFsyXSAqIHkpICsgbWF0WzRdO1xyXG4gICAgICAgICAgICBkZXN0WzFdID0gKG1hdFsxXSAqIHgpICsgKG1hdFszXSAqIHkpICsgbWF0WzVdO1xyXG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBjcmVhdGVUcmFuc2xhdGUgKHg6IG51bWJlciwgeTogbnVtYmVyLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXSB7XHJcbiAgICAgICAgICAgIGlmICghZGVzdCkgZGVzdCA9IG1hdDMuY3JlYXRlKCk7XHJcbiAgICAgICAgICAgIGRlc3RbMF0gPSAxO1xyXG4gICAgICAgICAgICBkZXN0WzFdID0gMDtcclxuICAgICAgICAgICAgZGVzdFsyXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbM10gPSAxO1xyXG4gICAgICAgICAgICBkZXN0WzRdID0geDtcclxuICAgICAgICAgICAgZGVzdFs1XSA9IHk7XHJcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdHJhbnNsYXRlIChtYXQ6IG51bWJlcltdLCB4OiBudW1iZXIsIHk6IG51bWJlcik6IG51bWJlcltdIHtcclxuICAgICAgICAgICAgbWF0WzRdICs9IHg7XHJcbiAgICAgICAgICAgIG1hdFs1XSArPSB5O1xyXG4gICAgICAgICAgICByZXR1cm4gbWF0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY3JlYXRlU2NhbGUgKHN4OiBudW1iZXIsIHN5OiBudW1iZXIsIGRlc3Q/OiBudW1iZXJbXSk6IG51bWJlcltdIHtcclxuICAgICAgICAgICAgaWYgKCFkZXN0KSBkZXN0ID0gbWF0My5jcmVhdGUoKTtcclxuICAgICAgICAgICAgZGVzdFswXSA9IHN4O1xyXG4gICAgICAgICAgICBkZXN0WzFdID0gMDtcclxuICAgICAgICAgICAgZGVzdFsyXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbM10gPSBzeTtcclxuICAgICAgICAgICAgZGVzdFs0XSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbNV0gPSAwO1xyXG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNjYWxlIChtYXQ6IG51bWJlcltdLCBzeDogbnVtYmVyLCBzeTogbnVtYmVyKTogbnVtYmVyW10ge1xyXG4gICAgICAgICAgICBtYXRbMF0gKj0gc3g7XHJcbiAgICAgICAgICAgIG1hdFsyXSAqPSBzeDtcclxuICAgICAgICAgICAgbWF0WzRdICo9IHN4O1xyXG5cclxuICAgICAgICAgICAgbWF0WzFdICo9IHN5O1xyXG4gICAgICAgICAgICBtYXRbM10gKj0gc3k7XHJcbiAgICAgICAgICAgIG1hdFs1XSAqPSBzeTtcclxuICAgICAgICAgICAgcmV0dXJuIG1hdDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNyZWF0ZVJvdGF0ZSAoYW5nbGVSYWQ6IG51bWJlciwgZGVzdD86IG51bWJlcltdKTogbnVtYmVyW10ge1xyXG4gICAgICAgICAgICBpZiAoIWRlc3QpIGRlc3QgPSBtYXQzLmNyZWF0ZSgpO1xyXG4gICAgICAgICAgICB2YXIgYyA9IE1hdGguY29zKGFuZ2xlUmFkKTtcclxuICAgICAgICAgICAgdmFyIHMgPSBNYXRoLnNpbihhbmdsZVJhZCk7XHJcbiAgICAgICAgICAgIGRlc3RbMF0gPSBjO1xyXG4gICAgICAgICAgICBkZXN0WzFdID0gcztcclxuICAgICAgICAgICAgZGVzdFsyXSA9IC1zO1xyXG4gICAgICAgICAgICBkZXN0WzNdID0gYztcclxuICAgICAgICAgICAgZGVzdFs0XSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbNV0gPSAwO1xyXG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNyZWF0ZVNrZXcgKGFuZ2xlUmFkWDogbnVtYmVyLCBhbmdsZVJhZFk6IG51bWJlciwgZGVzdD86IG51bWJlcltdKTogbnVtYmVyW10ge1xyXG4gICAgICAgICAgICBpZiAoIWRlc3QpIGRlc3QgPSBtYXQzLmNyZWF0ZSgpO1xyXG4gICAgICAgICAgICBkZXN0WzBdID0gMTtcclxuICAgICAgICAgICAgZGVzdFsxXSA9IE1hdGgudGFuKGFuZ2xlUmFkWSk7XHJcbiAgICAgICAgICAgIGRlc3RbMl0gPSBNYXRoLnRhbihhbmdsZVJhZFgpO1xyXG4gICAgICAgICAgICBkZXN0WzNdID0gMTtcclxuICAgICAgICAgICAgZGVzdFs0XSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbNV0gPSAwO1xyXG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBwcmVhcHBseSAoZGVzdDogbnVtYmVyW10sIG1hdDogbnVtYmVyW10pOiBudW1iZXJbXSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtYXQzLm11bHRpcGx5KG1hdCwgZGVzdCwgZGVzdCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBhcHBseSAoZGVzdDogbnVtYmVyW10sIG1hdDogbnVtYmVyW10pOiBudW1iZXJbXSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtYXQzLm11bHRpcGx5KGRlc3QsIG1hdCwgZGVzdCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBzaW1wbGVfaW52ZXJzZSAobWF0OiBudW1iZXJbXSwgZGVzdD86IG51bWJlcltdKTogbnVtYmVyW10ge1xyXG4gICAgICAgIHZhciBtMTEgPSBtYXRbMF07XHJcbiAgICAgICAgaWYgKE1hdGguYWJzKG0xMSkgPCBGTE9BVF9FUFNJTE9OKVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgdmFyIG0yMiA9IG1hdFszXTtcclxuICAgICAgICBpZiAoTWF0aC5hYnMobTIyKSA8IEZMT0FUX0VQU0lMT04pXHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBpZiAoIWRlc3QpIHtcclxuICAgICAgICAgICAgZGVzdCA9IG1hdDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBkZXN0WzFdID0gbWF0WzFdO1xyXG4gICAgICAgICAgICBkZXN0WzJdID0gbWF0WzJdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHgwID0gLW1hdFs0XTtcclxuICAgICAgICB2YXIgeTAgPSAtbWF0WzVdO1xyXG4gICAgICAgIGlmIChNYXRoLmFicyhtMTEgLSAxKSA+IEZMT0FUX0VQU0lMT04pIHtcclxuICAgICAgICAgICAgbTExID0gMSAvIG0xMTtcclxuICAgICAgICAgICAgeDAgKj0gbTExO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoTWF0aC5hYnMobTIyIC0gMSkgPiBGTE9BVF9FUFNJTE9OKSB7XHJcbiAgICAgICAgICAgIG0yMiA9IDEgLyBtMjI7XHJcbiAgICAgICAgICAgIHkwICo9IG0yMjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRlc3RbMF0gPSBtMTE7XHJcbiAgICAgICAgZGVzdFszXSA9IG0yMjtcclxuICAgICAgICBkZXN0WzRdID0geDA7XHJcbiAgICAgICAgZGVzdFs1XSA9IHkwO1xyXG4gICAgICAgIHJldHVybiBkZXN0O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNvbXBsZXhfaW52ZXJzZSAobWF0OiBudW1iZXJbXSwgZGVzdD86IG51bWJlcltdKTogbnVtYmVyW10ge1xyXG4gICAgICAgIGlmICghZGVzdCkgZGVzdCA9IG1hdDtcclxuXHJcbiAgICAgICAgdmFyIG0xMSA9IG1hdFswXSwgbTEyID0gbWF0WzFdLFxyXG4gICAgICAgICAgICBtMjEgPSBtYXRbMl0sIG0yMiA9IG1hdFszXTtcclxuXHJcbiAgICAgICAgLy9pbnYoQSkgPSAxL2RldChBKSAqIGFkaihBKVxyXG4gICAgICAgIHZhciBkZXQgPSBtMTEgKiBtMjIgLSBtMTIgKiBtMjE7XHJcbiAgICAgICAgaWYgKGRldCA9PT0gMCB8fCAhaXNGaW5pdGUoZGV0KSlcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgdmFyIGlkID0gMSAvIGRldDtcclxuXHJcbiAgICAgICAgdmFyIHgwID0gbWF0WzRdLCB5MCA9IG1hdFs1XTtcclxuXHJcbiAgICAgICAgZGVzdFswXSA9IG0yMiAqIGlkO1xyXG4gICAgICAgIGRlc3RbMV0gPSAtbTEyICogaWQ7XHJcbiAgICAgICAgZGVzdFsyXSA9IC1tMjEgKiBpZDtcclxuICAgICAgICBkZXN0WzNdID0gbTExICogaWQ7XHJcbiAgICAgICAgZGVzdFs0XSA9IChtMjEgKiB5MCAtIG0yMiAqIHgwKSAqIGlkO1xyXG4gICAgICAgIGRlc3RbNV0gPSAobTEyICogeDAgLSBtMTEgKiB5MCkgKiBpZDtcclxuICAgICAgICByZXR1cm4gZGVzdDtcclxuICAgIH1cclxufVxyXG52YXIgbWF0MyA9IG1pcmFnZS5tYXQzO1xyXG4iLCJpbnRlcmZhY2UgSU1hdHJpeDRTdGF0aWMge1xyXG4gICAgY3JlYXRlIChzcmM/OiBudW1iZXJbXSk6IG51bWJlcltdO1xyXG4gICAgY29weVRvIChzcmM6IG51bWJlcltdLCBkZXN0OiBudW1iZXJbXSk6IG51bWJlcltdO1xyXG4gICAgaWRlbnRpdHkoZGVzdD86IG51bWJlcltdKTogbnVtYmVyW107XHJcbiAgICBlcXVhbChhOiBudW1iZXJbXSwgYjogbnVtYmVyW10pOiBib29sZWFuO1xyXG4gICAgLy8gZGVzdCA9IGEgKiBiXHJcbiAgICBtdWx0aXBseSAoYTogbnVtYmVyW10sIGI6IG51bWJlcltdLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXTtcclxuICAgIGludmVyc2UgKG1hdDogbnVtYmVyW10sIGRlc3Q/OiBudW1iZXJbXSk6IG51bWJlcltdO1xyXG4gICAgdHJhbnNwb3NlIChtYXQ6IG51bWJlcltdLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXTtcclxuICAgIHRyYW5zZm9ybVZlYzQgKG1hdDogbnVtYmVyW10sIHZlYzogbnVtYmVyW10sIGRlc3Q/OiBudW1iZXJbXSk6IG51bWJlcltdO1xyXG4gICAgY3JlYXRlVHJhbnNsYXRlICh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXTtcclxuICAgIGNyZWF0ZVNjYWxlICh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXTtcclxuICAgIGNyZWF0ZVJvdGF0ZVggKHRoZXRhOiBudW1iZXIsIGRlc3Q/OiBudW1iZXJbXSk6IG51bWJlcltdO1xyXG4gICAgY3JlYXRlUm90YXRlWSAodGhldGE6IG51bWJlciwgZGVzdD86IG51bWJlcltdKTogbnVtYmVyW107XHJcbiAgICBjcmVhdGVSb3RhdGVaICh0aGV0YTogbnVtYmVyLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXTtcclxuICAgIGNyZWF0ZVBlcnNwZWN0aXZlIChmaWVsZE9mVmlld1k6IG51bWJlciwgYXNwZWN0UmF0aW86IG51bWJlciwgek5lYXJQbGFuZTogbnVtYmVyLCB6RmFyUGxhbmU6IG51bWJlciwgZGVzdD86IG51bWJlcltdKTogbnVtYmVyW107XHJcbiAgICBjcmVhdGVWaWV3cG9ydCAod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGRlc3Q/OiBudW1iZXJbXSk6IG51bWJlcltdO1xyXG59XHJcblxyXG5uYW1lc3BhY2UgbWlyYWdlIHtcclxuICAgIGVudW0gSW5kZXhlcyB7XHJcbiAgICAgICAgTTExID0gMCxcclxuICAgICAgICBNMTIgPSAxLFxyXG4gICAgICAgIE0xMyA9IDIsXHJcbiAgICAgICAgTTE0ID0gMyxcclxuICAgICAgICBNMjEgPSA0LFxyXG4gICAgICAgIE0yMiA9IDUsXHJcbiAgICAgICAgTTIzID0gNixcclxuICAgICAgICBNMjQgPSA3LFxyXG4gICAgICAgIE0zMSA9IDgsXHJcbiAgICAgICAgTTMyID0gOSxcclxuICAgICAgICBNMzMgPSAxMCxcclxuICAgICAgICBNMzQgPSAxMSxcclxuICAgICAgICBPZmZzZXRYID0gMTIsXHJcbiAgICAgICAgT2Zmc2V0WSA9IDEzLFxyXG4gICAgICAgIE9mZnNldFogPSAxNCxcclxuICAgICAgICBNNDQgPSAxNVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBGTE9BVF9FUFNJTE9OID0gMC4wMDAwMDE7XHJcbiAgICB2YXIgY3JlYXRlVHlwZWRBcnJheTogKGxlbmd0aDogbnVtYmVyKSA9PiBudW1iZXJbXTtcclxuXHJcbiAgICBpZiAodHlwZW9mIEZsb2F0MzJBcnJheSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgIGNyZWF0ZVR5cGVkQXJyYXkgPSBmdW5jdGlvbiAobGVuZ3RoOiBudW1iZXIpOiBudW1iZXJbXSB7XHJcbiAgICAgICAgICAgIHJldHVybiA8bnVtYmVyW10+PGFueT5uZXcgRmxvYXQzMkFycmF5KGxlbmd0aCk7XHJcbiAgICAgICAgfTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY3JlYXRlVHlwZWRBcnJheSA9IGZ1bmN0aW9uIChsZW5ndGg6IG51bWJlcik6IG51bWJlcltdIHtcclxuICAgICAgICAgICAgcmV0dXJuIDxudW1iZXJbXT5uZXcgQXJyYXkobGVuZ3RoKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCB2YXIgbWF0NDogSU1hdHJpeDRTdGF0aWMgPSB7XHJcbiAgICAgICAgY3JlYXRlIChzcmM/OiBudW1iZXJbXSk6IG51bWJlcltdIHtcclxuICAgICAgICAgICAgdmFyIGRlc3QgPSBjcmVhdGVUeXBlZEFycmF5KDE2KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzcmMpIHtcclxuICAgICAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTFdID0gc3JjW0luZGV4ZXMuTTExXTtcclxuICAgICAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTJdID0gc3JjW0luZGV4ZXMuTTEyXTtcclxuICAgICAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTNdID0gc3JjW0luZGV4ZXMuTTEzXTtcclxuICAgICAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTRdID0gc3JjW0luZGV4ZXMuTTE0XTtcclxuICAgICAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMjFdID0gc3JjW0luZGV4ZXMuTTIxXTtcclxuICAgICAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMjJdID0gc3JjW0luZGV4ZXMuTTIyXTtcclxuICAgICAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMjNdID0gc3JjW0luZGV4ZXMuTTIzXTtcclxuICAgICAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMjRdID0gc3JjW0luZGV4ZXMuTTI0XTtcclxuICAgICAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzFdID0gc3JjW0luZGV4ZXMuTTMxXTtcclxuICAgICAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzJdID0gc3JjW0luZGV4ZXMuTTMyXTtcclxuICAgICAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzNdID0gc3JjW0luZGV4ZXMuTTMzXTtcclxuICAgICAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzRdID0gc3JjW0luZGV4ZXMuTTM0XTtcclxuICAgICAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5PZmZzZXRYXSA9IHNyY1tJbmRleGVzLk9mZnNldFhdO1xyXG4gICAgICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFldID0gc3JjW0luZGV4ZXMuT2Zmc2V0WV07XHJcbiAgICAgICAgICAgICAgICBkZXN0W0luZGV4ZXMuT2Zmc2V0Wl0gPSBzcmNbSW5kZXhlcy5PZmZzZXRaXTtcclxuICAgICAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NNDRdID0gc3JjW0luZGV4ZXMuTTQ0XTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb3B5VG8gKHNyYzogbnVtYmVyW10sIGRlc3Q6IG51bWJlcltdKTogbnVtYmVyW10ge1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTExXSA9IHNyY1tJbmRleGVzLk0xMV07XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTJdID0gc3JjW0luZGV4ZXMuTTEyXTtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xM10gPSBzcmNbSW5kZXhlcy5NMTNdO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTE0XSA9IHNyY1tJbmRleGVzLk0xNF07XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMjFdID0gc3JjW0luZGV4ZXMuTTIxXTtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0yMl0gPSBzcmNbSW5kZXhlcy5NMjJdO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTIzXSA9IHNyY1tJbmRleGVzLk0yM107XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMjRdID0gc3JjW0luZGV4ZXMuTTI0XTtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0zMV0gPSBzcmNbSW5kZXhlcy5NMzFdO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTMyXSA9IHNyY1tJbmRleGVzLk0zMl07XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzNdID0gc3JjW0luZGV4ZXMuTTMzXTtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0zNF0gPSBzcmNbSW5kZXhlcy5NMzRdO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuT2Zmc2V0WF0gPSBzcmNbSW5kZXhlcy5PZmZzZXRYXTtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFldID0gc3JjW0luZGV4ZXMuT2Zmc2V0WV07XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5PZmZzZXRaXSA9IHNyY1tJbmRleGVzLk9mZnNldFpdO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTQ0XSA9IHNyY1tJbmRleGVzLk00NF07XHJcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaWRlbnRpdHkgKGRlc3Q/OiBudW1iZXJbXSk6IG51bWJlcltdIHtcclxuICAgICAgICAgICAgaWYgKCFkZXN0KSBkZXN0ID0gbWF0NC5jcmVhdGUoKTtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xMV0gPSAxO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTEyXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTNdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xNF0gPSAwO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTIxXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMjJdID0gMTtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0yM10gPSAwO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTI0XSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzFdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0zMl0gPSAwO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTMzXSA9IDE7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzRdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFhdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFldID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFpdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk00NF0gPSAxO1xyXG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVxdWFsIChhOiBudW1iZXJbXSwgYjogbnVtYmVyW10pOiBib29sZWFuIHtcclxuICAgICAgICAgICAgcmV0dXJuIGEgPT09IGIgfHwgKFxyXG4gICAgICAgICAgICAgICAgTWF0aC5hYnMoYVtJbmRleGVzLk0xMV0gLSBiW0luZGV4ZXMuTTExXSkgPCBGTE9BVF9FUFNJTE9OICYmXHJcbiAgICAgICAgICAgICAgICBNYXRoLmFicyhhW0luZGV4ZXMuTTEyXSAtIGJbSW5kZXhlcy5NMTJdKSA8IEZMT0FUX0VQU0lMT04gJiZcclxuICAgICAgICAgICAgICAgIE1hdGguYWJzKGFbSW5kZXhlcy5NMTNdIC0gYltJbmRleGVzLk0xM10pIDwgRkxPQVRfRVBTSUxPTiAmJlxyXG4gICAgICAgICAgICAgICAgTWF0aC5hYnMoYVtJbmRleGVzLk0xNF0gLSBiW0luZGV4ZXMuTTE0XSkgPCBGTE9BVF9FUFNJTE9OICYmXHJcbiAgICAgICAgICAgICAgICBNYXRoLmFicyhhW0luZGV4ZXMuTTIxXSAtIGJbSW5kZXhlcy5NMjFdKSA8IEZMT0FUX0VQU0lMT04gJiZcclxuICAgICAgICAgICAgICAgIE1hdGguYWJzKGFbSW5kZXhlcy5NMjJdIC0gYltJbmRleGVzLk0yMl0pIDwgRkxPQVRfRVBTSUxPTiAmJlxyXG4gICAgICAgICAgICAgICAgTWF0aC5hYnMoYVtJbmRleGVzLk0yM10gLSBiW0luZGV4ZXMuTTIzXSkgPCBGTE9BVF9FUFNJTE9OICYmXHJcbiAgICAgICAgICAgICAgICBNYXRoLmFicyhhW0luZGV4ZXMuTTI0XSAtIGJbSW5kZXhlcy5NMjRdKSA8IEZMT0FUX0VQU0lMT04gJiZcclxuICAgICAgICAgICAgICAgIE1hdGguYWJzKGFbSW5kZXhlcy5NMzFdIC0gYltJbmRleGVzLk0zMV0pIDwgRkxPQVRfRVBTSUxPTiAmJlxyXG4gICAgICAgICAgICAgICAgTWF0aC5hYnMoYVtJbmRleGVzLk0zMl0gLSBiW0luZGV4ZXMuTTMyXSkgPCBGTE9BVF9FUFNJTE9OICYmXHJcbiAgICAgICAgICAgICAgICBNYXRoLmFicyhhW0luZGV4ZXMuTTMzXSAtIGJbSW5kZXhlcy5NMzNdKSA8IEZMT0FUX0VQU0lMT04gJiZcclxuICAgICAgICAgICAgICAgIE1hdGguYWJzKGFbSW5kZXhlcy5NMzRdIC0gYltJbmRleGVzLk0zNF0pIDwgRkxPQVRfRVBTSUxPTiAmJlxyXG4gICAgICAgICAgICAgICAgTWF0aC5hYnMoYVtJbmRleGVzLk9mZnNldFhdIC0gYltJbmRleGVzLk9mZnNldFhdKSA8IEZMT0FUX0VQU0lMT04gJiZcclxuICAgICAgICAgICAgICAgIE1hdGguYWJzKGFbSW5kZXhlcy5PZmZzZXRZXSAtIGJbSW5kZXhlcy5PZmZzZXRZXSkgPCBGTE9BVF9FUFNJTE9OICYmXHJcbiAgICAgICAgICAgICAgICBNYXRoLmFicyhhW0luZGV4ZXMuT2Zmc2V0Wl0gLSBiW0luZGV4ZXMuT2Zmc2V0Wl0pIDwgRkxPQVRfRVBTSUxPTiAmJlxyXG4gICAgICAgICAgICAgICAgTWF0aC5hYnMoYVtJbmRleGVzLk00NF0gLSBiW0luZGV4ZXMuTTQ0XSkgPCBGTE9BVF9FUFNJTE9OXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbXVsdGlwbHkgKGE6IG51bWJlcltdLCBiOiBudW1iZXJbXSwgZGVzdD86IG51bWJlcltdKTogbnVtYmVyW10ge1xyXG4gICAgICAgICAgICBpZiAoIWRlc3QpIGRlc3QgPSBhO1xyXG4gICAgICAgICAgICB2YXIgbTExID0gYVtJbmRleGVzLk0xMV0sIG0xMiA9IGFbSW5kZXhlcy5NMTJdLCBtMTMgPSBhW0luZGV4ZXMuTTEzXSwgbTE0ID0gYVtJbmRleGVzLk0xNF0sXHJcbiAgICAgICAgICAgICAgICBtMjEgPSBhW0luZGV4ZXMuTTIxXSwgbTIyID0gYVtJbmRleGVzLk0yMl0sIG0yMyA9IGFbSW5kZXhlcy5NMjNdLCBtMjQgPSBhW0luZGV4ZXMuTTI0XSxcclxuICAgICAgICAgICAgICAgIG0zMSA9IGFbSW5kZXhlcy5NMzFdLCBtMzIgPSBhW0luZGV4ZXMuTTMyXSwgbTMzID0gYVtJbmRleGVzLk0zM10sIG0zNCA9IGFbSW5kZXhlcy5NMzRdLFxyXG4gICAgICAgICAgICAgICAgbXgwID0gYVtJbmRleGVzLk9mZnNldFhdLCBteTAgPSBhW0luZGV4ZXMuT2Zmc2V0WV0sIG16MCA9IGFbSW5kZXhlcy5PZmZzZXRaXSwgbTQ0ID0gYVtJbmRleGVzLk00NF07XHJcblxyXG4gICAgICAgICAgICB2YXIgbjExID0gYltJbmRleGVzLk0xMV0sIG4xMiA9IGJbSW5kZXhlcy5NMTJdLCBuMTMgPSBiW0luZGV4ZXMuTTEzXSwgbjE0ID0gYltJbmRleGVzLk0xNF0sXHJcbiAgICAgICAgICAgICAgICBuMjEgPSBiW0luZGV4ZXMuTTIxXSwgbjIyID0gYltJbmRleGVzLk0yMl0sIG4yMyA9IGJbSW5kZXhlcy5NMjNdLCBuMjQgPSBiW0luZGV4ZXMuTTI0XSxcclxuICAgICAgICAgICAgICAgIG4zMSA9IGJbSW5kZXhlcy5NMzFdLCBuMzIgPSBiW0luZGV4ZXMuTTMyXSwgbjMzID0gYltJbmRleGVzLk0zM10sIG4zNCA9IGJbSW5kZXhlcy5NMzRdLFxyXG4gICAgICAgICAgICAgICAgbngwID0gYltJbmRleGVzLk9mZnNldFhdLCBueTAgPSBiW0luZGV4ZXMuT2Zmc2V0WV0sIG56MCA9IGJbSW5kZXhlcy5PZmZzZXRaXSwgbjQ0ID0gYltJbmRleGVzLk00NF07XHJcblxyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTExXSA9IG0xMSAqIG4xMSArIG0xMiAqIG4yMSArIG0xMyAqIG4zMSArIG0xNCAqIG54MDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xMl0gPSBtMTEgKiBuMTIgKyBtMTIgKiBuMjIgKyBtMTMgKiBuMzIgKyBtMTQgKiBueTA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTNdID0gbTExICogbjEzICsgbTEyICogbjIzICsgbTEzICogbjMzICsgbTE0ICogbnowO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTE0XSA9IG0xMSAqIG4xNCArIG0xMiAqIG4yNCArIG0xMyAqIG4zNCArIG0xNCAqIG40NDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0yMV0gPSBtMjEgKiBuMTEgKyBtMjIgKiBuMjEgKyBtMjMgKiBuMzEgKyBtMjQgKiBueDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMjJdID0gbTIxICogbjEyICsgbTIyICogbjIyICsgbTIzICogbjMyICsgbTI0ICogbnkwO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTIzXSA9IG0yMSAqIG4xMyArIG0yMiAqIG4yMyArIG0yMyAqIG4zMyArIG0yNCAqIG56MDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0yNF0gPSBtMjEgKiBuMTQgKyBtMjIgKiBuMjQgKyBtMjMgKiBuMzQgKyBtMjQgKiBuNDQ7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzFdID0gbTMxICogbjExICsgbTMyICogbjIxICsgbTMzICogbjMxICsgbTM0ICogbngwO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTMyXSA9IG0zMSAqIG4xMiArIG0zMiAqIG4yMiArIG0zMyAqIG4zMiArIG0zNCAqIG55MDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0zM10gPSBtMzEgKiBuMTMgKyBtMzIgKiBuMjMgKyBtMzMgKiBuMzMgKyBtMzQgKiBuejA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzRdID0gbTMxICogbjE0ICsgbTMyICogbjI0ICsgbTMzICogbjM0ICsgbTM0ICogbjQ0O1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuT2Zmc2V0WF0gPSBteDAgKiBuMTEgKyBteTAgKiBuMjEgKyBtejAgKiBuMzEgKyBtNDQgKiBueDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5PZmZzZXRZXSA9IG14MCAqIG4xMiArIG15MCAqIG4yMiArIG16MCAqIG4zMiArIG00NCAqIG55MDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFpdID0gbXgwICogbjEzICsgbXkwICogbjIzICsgbXowICogbjMzICsgbTQ0ICogbnowO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTQ0XSA9IG14MCAqIG4xNCArIG15MCAqIG4yNCArIG16MCAqIG4zNCArIG00NCAqIG40NDtcclxuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpbnZlcnNlIChtYXQ6IG51bWJlcltdLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXSB7XHJcbiAgICAgICAgICAgIGlmICghZGVzdCkgZGVzdCA9IG1hdDtcclxuXHJcbiAgICAgICAgICAgIC8vIENhY2hlIHRoZSBtYXRyaXggdmFsdWVzIChtYWtlcyBmb3IgaHVnZSBzcGVlZCBpbmNyZWFzZXMhKVxyXG4gICAgICAgICAgICB2YXIgYTAwID0gbWF0W0luZGV4ZXMuTTExXSwgYTAxID0gbWF0W0luZGV4ZXMuTTEyXSwgYTAyID0gbWF0W0luZGV4ZXMuTTEzXSwgYTAzID0gbWF0W0luZGV4ZXMuTTE0XSxcclxuICAgICAgICAgICAgICAgIGExMCA9IG1hdFtJbmRleGVzLk0yMV0sIGExMSA9IG1hdFtJbmRleGVzLk0yMl0sIGExMiA9IG1hdFtJbmRleGVzLk0yM10sIGExMyA9IG1hdFtJbmRleGVzLk0yNF0sXHJcbiAgICAgICAgICAgICAgICBhMjAgPSBtYXRbSW5kZXhlcy5NMzFdLCBhMjEgPSBtYXRbSW5kZXhlcy5NMzJdLCBhMjIgPSBtYXRbSW5kZXhlcy5NMzNdLCBhMjMgPSBtYXRbSW5kZXhlcy5NMzRdLFxyXG4gICAgICAgICAgICAgICAgYTMwID0gbWF0W0luZGV4ZXMuT2Zmc2V0WF0sIGEzMSA9IG1hdFtJbmRleGVzLk9mZnNldFldLCBhMzIgPSBtYXRbSW5kZXhlcy5PZmZzZXRaXSwgYTMzID0gbWF0W0luZGV4ZXMuTTQ0XSxcclxuXHJcbiAgICAgICAgICAgICAgICBiMDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTAsXHJcbiAgICAgICAgICAgICAgICBiMDEgPSBhMDAgKiBhMTIgLSBhMDIgKiBhMTAsXHJcbiAgICAgICAgICAgICAgICBiMDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTAsXHJcbiAgICAgICAgICAgICAgICBiMDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTEsXHJcbiAgICAgICAgICAgICAgICBiMDQgPSBhMDEgKiBhMTMgLSBhMDMgKiBhMTEsXHJcbiAgICAgICAgICAgICAgICBiMDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTIsXHJcbiAgICAgICAgICAgICAgICBiMDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzAsXHJcbiAgICAgICAgICAgICAgICBiMDcgPSBhMjAgKiBhMzIgLSBhMjIgKiBhMzAsXHJcbiAgICAgICAgICAgICAgICBiMDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzAsXHJcbiAgICAgICAgICAgICAgICBiMDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzEsXHJcbiAgICAgICAgICAgICAgICBiMTAgPSBhMjEgKiBhMzMgLSBhMjMgKiBhMzEsXHJcbiAgICAgICAgICAgICAgICBiMTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzI7XHJcblxyXG4gICAgICAgICAgICB2YXIgZCA9IChiMDAgKiBiMTEgLSBiMDEgKiBiMTAgKyBiMDIgKiBiMDkgKyBiMDMgKiBiMDggLSBiMDQgKiBiMDcgKyBiMDUgKiBiMDYpO1xyXG4gICAgICAgICAgICBpZiAoIWlzRmluaXRlKGQpIHx8ICFkKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIHZhciBpZCA9IDEgLyBkO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xMV0gPSAoYTExICogYjExIC0gYTEyICogYjEwICsgYTEzICogYjA5KSAqIGlkO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTEyXSA9ICgtYTAxICogYjExICsgYTAyICogYjEwIC0gYTAzICogYjA5KSAqIGlkO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTEzXSA9IChhMzEgKiBiMDUgLSBhMzIgKiBiMDQgKyBhMzMgKiBiMDMpICogaWQ7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTRdID0gKC1hMjEgKiBiMDUgKyBhMjIgKiBiMDQgLSBhMjMgKiBiMDMpICogaWQ7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMjFdID0gKC1hMTAgKiBiMTEgKyBhMTIgKiBiMDggLSBhMTMgKiBiMDcpICogaWQ7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMjJdID0gKGEwMCAqIGIxMSAtIGEwMiAqIGIwOCArIGEwMyAqIGIwNykgKiBpZDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0yM10gPSAoLWEzMCAqIGIwNSArIGEzMiAqIGIwMiAtIGEzMyAqIGIwMSkgKiBpZDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0yNF0gPSAoYTIwICogYjA1IC0gYTIyICogYjAyICsgYTIzICogYjAxKSAqIGlkO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTMxXSA9IChhMTAgKiBiMTAgLSBhMTEgKiBiMDggKyBhMTMgKiBiMDYpICogaWQ7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzJdID0gKC1hMDAgKiBiMTAgKyBhMDEgKiBiMDggLSBhMDMgKiBiMDYpICogaWQ7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzNdID0gKGEzMCAqIGIwNCAtIGEzMSAqIGIwMiArIGEzMyAqIGIwMCkgKiBpZDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0zNF0gPSAoLWEyMCAqIGIwNCArIGEyMSAqIGIwMiAtIGEyMyAqIGIwMCkgKiBpZDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFhdID0gKC1hMTAgKiBiMDkgKyBhMTEgKiBiMDcgLSBhMTIgKiBiMDYpICogaWQ7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5PZmZzZXRZXSA9IChhMDAgKiBiMDkgLSBhMDEgKiBiMDcgKyBhMDIgKiBiMDYpICogaWQ7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5PZmZzZXRaXSA9ICgtYTMwICogYjAzICsgYTMxICogYjAxIC0gYTMyICogYjAwKSAqIGlkO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTQ0XSA9IChhMjAgKiBiMDMgLSBhMjEgKiBiMDEgKyBhMjIgKiBiMDApICogaWQ7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRyYW5zcG9zZSAobWF0OiBudW1iZXJbXSwgZGVzdD86IG51bWJlcltdKTogbnVtYmVyW10ge1xyXG4gICAgICAgICAgICBpZiAoIWRlc3QpIGRlc3QgPSBtYXQ7XHJcblxyXG4gICAgICAgICAgICB2YXIgYTAwID0gbWF0W0luZGV4ZXMuTTExXSwgYTAxID0gbWF0W0luZGV4ZXMuTTEyXSwgYTAyID0gbWF0W0luZGV4ZXMuTTEzXSwgYTAzID0gbWF0W0luZGV4ZXMuTTE0XSxcclxuICAgICAgICAgICAgICAgIGExMCA9IG1hdFtJbmRleGVzLk0yMV0sIGExMSA9IG1hdFtJbmRleGVzLk0yMl0sIGExMiA9IG1hdFtJbmRleGVzLk0yM10sIGExMyA9IG1hdFtJbmRleGVzLk0yNF0sXHJcbiAgICAgICAgICAgICAgICBhMjAgPSBtYXRbSW5kZXhlcy5NMzFdLCBhMjEgPSBtYXRbSW5kZXhlcy5NMzJdLCBhMjIgPSBtYXRbSW5kZXhlcy5NMzNdLCBhMjMgPSBtYXRbSW5kZXhlcy5NMzRdLFxyXG4gICAgICAgICAgICAgICAgYTMwID0gbWF0W0luZGV4ZXMuT2Zmc2V0WF0sIGEzMSA9IG1hdFtJbmRleGVzLk9mZnNldFldLCBhMzIgPSBtYXRbSW5kZXhlcy5PZmZzZXRaXSwgYTMzID0gbWF0W0luZGV4ZXMuTTQ0XTtcclxuXHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTFdID0gYTAwOyBkZXN0W0luZGV4ZXMuTTIxXSA9IGEwMTsgZGVzdFtJbmRleGVzLk0zMV0gPSBhMDI7IGRlc3RbSW5kZXhlcy5PZmZzZXRYXSA9IGEwMztcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xMl0gPSBhMTA7IGRlc3RbSW5kZXhlcy5NMjJdID0gYTExOyBkZXN0W0luZGV4ZXMuTTMyXSA9IGExMjsgZGVzdFtJbmRleGVzLk9mZnNldFldID0gYTEzO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTEzXSA9IGEyMDsgZGVzdFtJbmRleGVzLk0yM10gPSBhMjE7IGRlc3RbSW5kZXhlcy5NMzNdID0gYTIyOyBkZXN0W0luZGV4ZXMuT2Zmc2V0Wl0gPSBhMjM7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTRdID0gYTMwOyBkZXN0W0luZGV4ZXMuTTI0XSA9IGEzMTsgZGVzdFtJbmRleGVzLk0zNF0gPSBhMzI7IGRlc3RbSW5kZXhlcy5NNDRdID0gYTMzO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0cmFuc2Zvcm1WZWM0IChtYXQ6IG51bWJlcltdLCB2ZWM6IG51bWJlcltdLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXSB7XHJcbiAgICAgICAgICAgIGlmICghZGVzdCkgZGVzdCA9IHZlYztcclxuXHJcbiAgICAgICAgICAgIHZhciB4ID0gdmVjWzBdLCB5ID0gdmVjWzFdLCB6ID0gdmVjWzJdLCB3ID0gdmVjWzNdO1xyXG5cclxuICAgICAgICAgICAgdmFyIG0xMSA9IG1hdFtJbmRleGVzLk0xMV0sIG0xMiA9IG1hdFtJbmRleGVzLk0xMl0sIG0xMyA9IG1hdFtJbmRleGVzLk0xM10sIG0xNCA9IG1hdFtJbmRleGVzLk0xNF0sXHJcbiAgICAgICAgICAgICAgICBtMjEgPSBtYXRbSW5kZXhlcy5NMjFdLCBtMjIgPSBtYXRbSW5kZXhlcy5NMjJdLCBtMjMgPSBtYXRbSW5kZXhlcy5NMjNdLCBtMjQgPSBtYXRbSW5kZXhlcy5NMjRdLFxyXG4gICAgICAgICAgICAgICAgbTMxID0gbWF0W0luZGV4ZXMuTTMxXSwgbTMyID0gbWF0W0luZGV4ZXMuTTMyXSwgbTMzID0gbWF0W0luZGV4ZXMuTTMzXSwgbTM0ID0gbWF0W0luZGV4ZXMuTTM0XSxcclxuICAgICAgICAgICAgICAgIG14MCA9IG1hdFtJbmRleGVzLk9mZnNldFhdLCBteTAgPSBtYXRbSW5kZXhlcy5PZmZzZXRZXSwgbXowID0gbWF0W0luZGV4ZXMuT2Zmc2V0Wl0sIG00NCA9IG1hdFtJbmRleGVzLk00NF07XHJcblxyXG4gICAgICAgICAgICBkZXN0WzBdID0gbTExICogeCArIG0xMiAqIHkgKyBtMTMgKiB6ICsgbTE0ICogdztcclxuICAgICAgICAgICAgZGVzdFsxXSA9IG0yMSAqIHggKyBtMjIgKiB5ICsgbTIzICogeiArIG0yNCAqIHc7XHJcbiAgICAgICAgICAgIGRlc3RbMl0gPSBtMzEgKiB4ICsgbTMyICogeSArIG0zMyAqIHogKyBtMzQgKiB3O1xyXG4gICAgICAgICAgICBkZXN0WzNdID0gbXgwICogeCArIG15MCAqIHkgKyBtejAgKiB6ICsgbTQ0ICogdztcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGNyZWF0ZVRyYW5zbGF0ZSAoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciwgZGVzdD86IG51bWJlcltdKTogbnVtYmVyW10ge1xyXG4gICAgICAgICAgICBpZiAoIWRlc3QpIGRlc3QgPSBtYXQ0LmNyZWF0ZSgpO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xMV0gPSAxO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTEyXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTNdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xNF0gPSAwO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0yMV0gPSAwO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTIyXSA9IDE7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMjNdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0yNF0gPSAwO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0zMV0gPSAwO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTMyXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzNdID0gMTtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0zNF0gPSAwO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFhdID0geDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFldID0geTtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFpdID0gejtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk00NF0gPSAxO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjcmVhdGVTY2FsZSAoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciwgZGVzdD86IG51bWJlcltdKTogbnVtYmVyW10ge1xyXG4gICAgICAgICAgICBpZiAoIWRlc3QpIGRlc3QgPSBtYXQ0LmNyZWF0ZSgpO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xMV0gPSB4O1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTEyXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTNdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xNF0gPSAwO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xMV0gPSAwO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTEyXSA9IHk7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTNdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xNF0gPSAwO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0zMV0gPSAwO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTMyXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzNdID0gejtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0zNF0gPSAwO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFhdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFldID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFpdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk00NF0gPSAxO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjcmVhdGVSb3RhdGVYICh0aGV0YTogbnVtYmVyLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXSB7XHJcbiAgICAgICAgICAgIGlmICghZGVzdCkgZGVzdCA9IG1hdDQuY3JlYXRlKCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgcyA9IE1hdGguc2luKHRoZXRhKTtcclxuICAgICAgICAgICAgdmFyIGMgPSBNYXRoLmNvcyh0aGV0YSk7XHJcblxyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTExXSA9IDE7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTJdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xM10gPSAwO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTE0XSA9IDA7XHJcblxyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTIxXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMjJdID0gYztcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0yM10gPSBzO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTI0XSA9IDA7XHJcblxyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTMxXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzJdID0gLXM7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzNdID0gYztcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0zNF0gPSAwO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFhdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFldID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFpdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk00NF0gPSAxO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjcmVhdGVSb3RhdGVZICh0aGV0YTogbnVtYmVyLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXSB7XHJcbiAgICAgICAgICAgIGlmICghZGVzdCkgZGVzdCA9IG1hdDQuY3JlYXRlKCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgcyA9IE1hdGguc2luKHRoZXRhKTtcclxuICAgICAgICAgICAgdmFyIGMgPSBNYXRoLmNvcyh0aGV0YSk7XHJcblxyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTExXSA9IGM7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTJdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xM10gPSAtcztcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xNF0gPSAwO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0yMV0gPSAwO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTIyXSA9IDE7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMjNdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0yNF0gPSAwO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0zMV0gPSBzO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTMyXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzNdID0gYztcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0zNF0gPSAwO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFhdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFldID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFpdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk00NF0gPSAxO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjcmVhdGVSb3RhdGVaICh0aGV0YTogbnVtYmVyLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXSB7XHJcbiAgICAgICAgICAgIGlmICghZGVzdCkgZGVzdCA9IG1hdDQuY3JlYXRlKCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgcyA9IE1hdGguc2luKHRoZXRhKTtcclxuICAgICAgICAgICAgdmFyIGMgPSBNYXRoLmNvcyh0aGV0YSk7XHJcblxyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTExXSA9IGM7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTJdID0gcztcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xM10gPSAwO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTE0XSA9IDA7XHJcblxyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTIxXSA9IC1zO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTIyXSA9IGM7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMjNdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0yNF0gPSAwO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0zMV0gPSAwO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTMyXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzNdID0gMTtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0zNF0gPSAwO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFhdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFldID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFpdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk00NF0gPSAxO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgY3JlYXRlUGVyc3BlY3RpdmUgKGZpZWxkT2ZWaWV3WTogbnVtYmVyLCBhc3BlY3RSYXRpbzogbnVtYmVyLCB6TmVhclBsYW5lOiBudW1iZXIsIHpGYXJQbGFuZTogbnVtYmVyLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXSB7XHJcbiAgICAgICAgICAgIGlmICghZGVzdCkgZGVzdCA9IG1hdDQuY3JlYXRlKCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgaGVpZ2h0ID0gMS4wIC8gTWF0aC50YW4oZmllbGRPZlZpZXdZIC8gMi4wKTtcclxuICAgICAgICAgICAgdmFyIHdpZHRoID0gaGVpZ2h0IC8gYXNwZWN0UmF0aW87XHJcbiAgICAgICAgICAgIHZhciBkID0gek5lYXJQbGFuZSAtIHpGYXJQbGFuZTtcclxuXHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTFdID0gd2lkdGg7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTJdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xM10gPSAwO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTE0XSA9IDA7XHJcblxyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTIxXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMjJdID0gaGVpZ2h0O1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTIzXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMjRdID0gMDtcclxuXHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzFdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0zMl0gPSAwO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTMzXSA9IHpGYXJQbGFuZSAvIGQ7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzRdID0gLTEuMDtcclxuXHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5PZmZzZXRYXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5PZmZzZXRZXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5PZmZzZXRaXSA9IHpOZWFyUGxhbmUgKiB6RmFyUGxhbmUgLyBkO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTQ0XSA9IDAuMDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY3JlYXRlVmlld3BvcnQgKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXSB7XHJcbiAgICAgICAgICAgIGlmICghZGVzdCkgZGVzdCA9IG1hdDQuY3JlYXRlKCk7XHJcblxyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTExXSA9IHdpZHRoIC8gMi4wO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTEyXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMTNdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0xNF0gPSAwO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0yMV0gPSAwO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTIyXSA9IC1oZWlnaHQgLyAyLjA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMjNdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0yNF0gPSAwO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0zMV0gPSAwO1xyXG4gICAgICAgICAgICBkZXN0W0luZGV4ZXMuTTMyXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5NMzNdID0gMTtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk0zNF0gPSAwO1xyXG5cclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFhdID0gd2lkdGggLyAyLjA7XHJcbiAgICAgICAgICAgIGRlc3RbSW5kZXhlcy5PZmZzZXRZXSA9IGhlaWdodCAvIDIuMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk9mZnNldFpdID0gMDtcclxuICAgICAgICAgICAgZGVzdFtJbmRleGVzLk00NF0gPSAxO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG5cclxudmFyIG1hdDQgPSBtaXJhZ2UubWF0NDsiLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vUmVjdFwiIC8+XHJcblxyXG5uYW1lc3BhY2UgbWlyYWdlIHtcclxuICAgIFJlY3QudHJhbnNmb3JtNCA9IGZ1bmN0aW9uIChkZXN0OiBSZWN0LCBwcm9qZWN0aW9uOiBudW1iZXJbXSkge1xyXG4gICAgICAgIGNvbnNvbGUud2FybihcIltSZWN0LnRyYW5zZm9ybTRdIE5vdCBpbXBsZW1lbnRlZFwiKTtcclxuICAgICAgICAvKlxyXG4gICAgICAgIGlmICghcHJvamVjdGlvbilcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgeCA9IGRlc3QueDtcclxuICAgICAgICB2YXIgeSA9IGRlc3QueTtcclxuICAgICAgICB2YXIgd2lkdGggPSBkZXN0LndpZHRoO1xyXG4gICAgICAgIHZhciBoZWlnaHQgPSBkZXN0LmhlaWdodDtcclxuXHJcbiAgICAgICAgdmFyIHAxID0gdmVjNC5jcmVhdGUoeCwgeSwgMC4wLCAxLjApO1xyXG4gICAgICAgIHZhciBwMiA9IHZlYzQuY3JlYXRlKHggKyB3aWR0aCwgeSwgMC4wLCAxLjApO1xyXG4gICAgICAgIHZhciBwMyA9IHZlYzQuY3JlYXRlKHggKyB3aWR0aCwgeSArIGhlaWdodCwgMC4wLCAxLjApO1xyXG4gICAgICAgIHZhciBwNCA9IHZlYzQuY3JlYXRlKHgsIHkgKyBoZWlnaHQsIDAuMCwgMS4wKTtcclxuXHJcbiAgICAgICAgbWF0NC50cmFuc2Zvcm1WZWM0KHByb2plY3Rpb24sIHAxKTtcclxuICAgICAgICBtYXQ0LnRyYW5zZm9ybVZlYzQocHJvamVjdGlvbiwgcDIpO1xyXG4gICAgICAgIG1hdDQudHJhbnNmb3JtVmVjNChwcm9qZWN0aW9uLCBwMyk7XHJcbiAgICAgICAgbWF0NC50cmFuc2Zvcm1WZWM0KHByb2plY3Rpb24sIHA0KTtcclxuXHJcbiAgICAgICAgdmFyIHZzID0gNjU1MzYuMDtcclxuICAgICAgICB2YXIgdnNyID0gMS4wIC8gdnM7XHJcbiAgICAgICAgcDFbMF0gKj0gdnNyO1xyXG4gICAgICAgIHAxWzFdICo9IHZzcjtcclxuICAgICAgICBwMlswXSAqPSB2c3I7XHJcbiAgICAgICAgcDJbMV0gKj0gdnNyO1xyXG4gICAgICAgIHAzWzBdICo9IHZzcjtcclxuICAgICAgICBwM1sxXSAqPSB2c3I7XHJcbiAgICAgICAgcDRbMF0gKj0gdnNyO1xyXG4gICAgICAgIHA0WzFdICo9IHZzcjtcclxuXHJcbiAgICAgICAgdmFyIGNtMSA9IGNsaXBtYXNrKHAxKTtcclxuICAgICAgICB2YXIgY20yID0gY2xpcG1hc2socDIpO1xyXG4gICAgICAgIHZhciBjbTMgPSBjbGlwbWFzayhwMyk7XHJcbiAgICAgICAgdmFyIGNtNCA9IGNsaXBtYXNrKHA0KTtcclxuXHJcbiAgICAgICAgaWYgKChjbTEgfCBjbTIgfCBjbTMgfCBjbTQpICE9PSAwKSB7XHJcbiAgICAgICAgICAgIGlmICgoY20xICYgY20yICYgY20zICYgY200KSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgZGVzdC54ID0gZGVzdC55ID0gZGVzdC53aWR0aCA9IGRlc3QuaGVpZ2h0ID0gMDtcclxuICAgICAgICAgICAgICAgIC8vVE9ETzogSW1wbGVtZW50XHJcbiAgICAgICAgICAgICAgICAvL3ZhciByMSA9IE1hdHJpeDNELl9DbGlwVG9Cb3VuZHMocDEsIHAyLCBwMywgY20xIHwgY20yIHwgY20zKTtcclxuICAgICAgICAgICAgICAgIC8vdmFyIHIyID0gTWF0cml4M0QuX0NsaXBUb0JvdW5kcyhwMSwgcDMsIHA0LCBjbTEgfCBjbTMgfCBjbTQpO1xyXG4gICAgICAgICAgICAgICAgLy9pZiAoIXIxLklzRW1wdHkoKSkgcmVjdC51bmlvbihkZXN0LCByMSk7XHJcbiAgICAgICAgICAgICAgICAvL2lmICghcjIuSXNFbXB0eSgpKSByZWN0LnVuaW9uKGRlc3QsIHIyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBwMXcgPSAxLjAgLyBwMVszXTtcclxuICAgICAgICAgICAgdmFyIHAydyA9IDEuMCAvIHAyWzNdO1xyXG4gICAgICAgICAgICB2YXIgcDN3ID0gMS4wIC8gcDNbM107XHJcbiAgICAgICAgICAgIHZhciBwNHcgPSAxLjAgLyBwNFszXTtcclxuICAgICAgICAgICAgcDFbMF0gKj0gcDF3ICogdnM7XHJcbiAgICAgICAgICAgIHAxWzFdICo9IHAxdyAqIHZzO1xyXG4gICAgICAgICAgICBwMlswXSAqPSBwMncgKiB2cztcclxuICAgICAgICAgICAgcDJbMV0gKj0gcDJ3ICogdnM7XHJcbiAgICAgICAgICAgIHAzWzBdICo9IHAzdyAqIHZzO1xyXG4gICAgICAgICAgICBwM1sxXSAqPSBwM3cgKiB2cztcclxuICAgICAgICAgICAgcDRbMF0gKj0gcDR3ICogdnM7XHJcbiAgICAgICAgICAgIHA0WzFdICo9IHA0dyAqIHZzO1xyXG5cclxuICAgICAgICAgICAgZGVzdC54ID0gcDFbMF07XHJcbiAgICAgICAgICAgIGRlc3QueSA9IHAxWzFdO1xyXG4gICAgICAgICAgICBkZXN0LndpZHRoID0gMDtcclxuICAgICAgICAgICAgZGVzdC5oZWlnaHQgPSAwO1xyXG4gICAgICAgICAgICBSZWN0LmV4dGVuZFRvKGRlc3QsIHAyWzBdLCBwMlsxXSk7XHJcbiAgICAgICAgICAgIFJlY3QuZXh0ZW5kVG8oZGVzdCwgcDNbMF0sIHAzWzFdKTtcclxuICAgICAgICAgICAgUmVjdC5leHRlbmRUbyhkZXN0LCBwNFswXSwgcDRbMV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAqL1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBjbGlwbWFzayAoY2xpcDogbnVtYmVyW10pOiBudW1iZXIge1xyXG4gICAgICAgIHZhciBtYXNrID0gMDtcclxuXHJcbiAgICAgICAgaWYgKC1jbGlwWzBdICsgY2xpcFszXSA8IDApIG1hc2sgfD0gKDEgPDwgMCk7XHJcbiAgICAgICAgaWYgKGNsaXBbMF0gKyBjbGlwWzNdIDwgMCkgbWFzayB8PSAoMSA8PCAxKTtcclxuICAgICAgICBpZiAoLWNsaXBbMV0gKyBjbGlwWzNdIDwgMCkgbWFzayB8PSAoMSA8PCAyKTtcclxuICAgICAgICBpZiAoY2xpcFsxXSArIGNsaXBbM10gPCAwKSBtYXNrIHw9ICgxIDw8IDMpO1xyXG4gICAgICAgIGlmIChjbGlwWzJdICsgY2xpcFszXSA8IDApIG1hc2sgfD0gKDEgPDwgNCk7XHJcbiAgICAgICAgaWYgKC1jbGlwWzJdICsgY2xpcFszXSA8IDApIG1hc2sgfD0gKDEgPDwgNSk7XHJcblxyXG4gICAgICAgIHJldHVybiBtYXNrO1xyXG4gICAgfVxyXG59IiwiaW50ZXJmYWNlIElWZWN0b3I0U3RhdGljIHtcclxuICAgIGNyZWF0ZSh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyLCB3OiBudW1iZXIpOiBudW1iZXJbXTtcclxuICAgIGluaXQoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciwgdzogbnVtYmVyLCBkZXN0PzogbnVtYmVyW10pOiBudW1iZXJbXTtcclxufVxyXG5uYW1lc3BhY2UgbWlyYWdlIHtcclxuICAgIHZhciBjcmVhdGVUeXBlZEFycmF5OiAobGVuZ3RoOiBudW1iZXIpID0+IG51bWJlcltdO1xyXG5cclxuICAgIGlmICh0eXBlb2YgRmxvYXQzMkFycmF5ICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgY3JlYXRlVHlwZWRBcnJheSA9IGZ1bmN0aW9uIChsZW5ndGg6IG51bWJlcik6IG51bWJlcltdIHtcclxuICAgICAgICAgICAgcmV0dXJuIDxudW1iZXJbXT48YW55Pm5ldyBGbG9hdDMyQXJyYXkobGVuZ3RoKTtcclxuICAgICAgICB9O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjcmVhdGVUeXBlZEFycmF5ID0gZnVuY3Rpb24gKGxlbmd0aDogbnVtYmVyKTogbnVtYmVyW10ge1xyXG4gICAgICAgICAgICByZXR1cm4gPG51bWJlcltdPm5ldyBBcnJheShsZW5ndGgpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IHZhciB2ZWM0OiBJVmVjdG9yNFN0YXRpYyA9IHtcclxuICAgICAgICBjcmVhdGUgKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHc6IG51bWJlcik6IG51bWJlcltdIHtcclxuICAgICAgICAgICAgdmFyIGRlc3QgPSBjcmVhdGVUeXBlZEFycmF5KDQpO1xyXG4gICAgICAgICAgICBkZXN0WzBdID0geDtcclxuICAgICAgICAgICAgZGVzdFsxXSA9IHk7XHJcbiAgICAgICAgICAgIGRlc3RbMl0gPSB6O1xyXG4gICAgICAgICAgICBkZXN0WzNdID0gdztcclxuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpbml0ICh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyLCB3OiBudW1iZXIsIGRlc3Q/OiBudW1iZXJbXSk6IG51bWJlcltdIHtcclxuICAgICAgICAgICAgaWYgKCFkZXN0KSBkZXN0ID0gY3JlYXRlVHlwZWRBcnJheSg0KTtcclxuICAgICAgICAgICAgZGVzdFswXSA9IHg7XHJcbiAgICAgICAgICAgIGRlc3RbMV0gPSB5O1xyXG4gICAgICAgICAgICBkZXN0WzJdID0gejtcclxuICAgICAgICAgICAgZGVzdFszXSA9IHc7XHJcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuXHJcbnZhciB2ZWM0ID0gbWlyYWdlLnZlYzQ7Il0sInNvdXJjZVJvb3QiOiIuL3NyYyJ9
