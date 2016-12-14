namespace mirage.core {
    export interface ISized {
        width: number;
        height: number;
        minWidth: number;
        minHeight: number;
        maxWidth: number;
        maxHeight: number;
        useLayoutRounding: boolean;
    }

    export function coerceSize(size: ISize, inputs: ISized) {
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
}