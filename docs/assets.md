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
previousAvailable: new Size(),
desiredSize: new Size(),
hiddenDesire: new Size(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY),
layoutSlot: new Rect(),
visualOffset: new Point(),
arranged: new Size(),
lastArranged: undefined,

# new flags
flags
```

The following enumerates properties that will not carry over from minerva Updater.

```
# inputs
clip: null,
effect: null,
visibility: Visibility.Visible,
opacity: 1.0,
isHitTestVisible: true,
z: NaN,
renderTransform: null,
renderTransformOrigin: new Point(),

effectPadding: new Thickness(),

layoutClip: new Rect(),
compositeLayoutClip: new Rect(),
breakLayoutClip: false,

totalIsRenderVisible: true,
totalIsHitTestVisible: true,
totalOpacity: 1.0,

extents: new Rect(),
extentsWithChildren: new Rect(),
surfaceBoundsWithChildren: new Rect(),
globalBoundsWithChildren: new Rect(),

layoutXform: mat3.identity(),
carrierXform: null,
renderXform: mat3.identity(),
absoluteXform: mat3.identity(),

renderSize: new Size(),
lastRenderSize: undefined,

dirtyRegion: new Rect(),
dirtyFlags: 0,
uiFlags: UIFlags.RenderVisible | UIFlags.HitTestVisible,
forceInvalidate: false
```
