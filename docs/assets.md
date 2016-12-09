# Layout Assets

The following enumerates a set of properties that carry over from minerva Updater.

```
# inputs
width: NaN,
height: NaN,
minWidth: 0.0,
minHeight: 0.0,
maxWidth: number Number.POSITIVE_INFINITY,
maxHeight: number Number.POSITIVE_INFINITY,
useLayoutRounding: true,
margin: new Thickness(),
horizontalAlignment: HorizontalAlignment.Stretch,
verticalAlignment: VerticalAlignment.Stretch,

# internal states
previousConstraint: new Size(),
desiredSize: new Size(),
hiddenDesire: new Size(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY),

renderSize: new Size(),
visualOffset: new Point(),
lastRenderSize: undefined,
layoutSlot: new Rect(),
actualWidth: 0,
actualHeight: 0,

layoutXform: mat3.identity(),

# new flags
dirtyFlags
uiHints
```

The following enumerates properties that will not carry over from minerva Updater.

```
clip: null,
effect: null,

visibility: Visibility.Visible,
opacity: 1.0,

isHitTestVisible: true,
z: NaN,

layoutClip: new Rect(),
compositeLayoutClip: new Rect(),
breakLayoutClip: false,

renderTransform: null,
renderTransformOrigin: new Point(),
effectPadding: new Thickness(),

totalIsRenderVisible: true,
totalIsHitTestVisible: true,
totalOpacity: 1.0,

extents: new Rect(),
extentsWithChildren: new Rect(),
surfaceBoundsWithChildren: new Rect(),
globalBoundsWithChildren: new Rect(),

carrierXform: null,
renderXform: mat3.identity(),
absoluteXform: mat3.identity(),

dirtyRegion: new Rect(),
dirtyFlags: 0,
uiFlags: UIFlags.RenderVisible | UIFlags.HitTestVisible,
forceInvalidate: false
```
