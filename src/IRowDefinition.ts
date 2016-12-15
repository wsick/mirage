namespace mirage {
    export interface IRowDefinition {
        height: IGridLength;
        maxHeight: number;
        minHeight: number;
        getActualHeight(): number;

        /// WARNING: This should only be used by engine
        setActualHeight(value: number);
    }
}