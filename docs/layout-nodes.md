# Layout Nodes

A layout node represents the base component contained within a draft tree.
Every component includes measuring, arranging, and sizing.

The following list highlights all layout nodes.

- LayoutNode
  - Border
  - Panel
    - StackPanel
    - Grid

## Border

```
padding: Thickness
borderThickness: Thickness
cornerRadius: CornerRadius
```

## Panel

```
children: Framer[]
```

## StackPanel

```
orientation: Orientation
```

## Grid

```
columnDefinitions: ColumnDefinition[]
rowDefinitions: RowDefinition[]
```
