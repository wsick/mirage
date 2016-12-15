namespace mirage {
    export interface IColumnDefinition {
        width: IGridLength;
        maxWidth: number;
        minWidth: number;
        getActualWidth(): number;

        /// WARNING: This should only be used by engine
        setActualWidth(value: number);
    }
}