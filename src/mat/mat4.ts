interface IMatrix4Static {
    create (src?: number[]): number[];
    copyTo (src: number[], dest: number[]): number[];
    identity(dest?: number[]): number[];
    equal(a: number[], b: number[]): boolean;
    // dest = a * b
    multiply (a: number[], b: number[], dest?: number[]): number[];
    inverse (mat: number[], dest?: number[]): number[];
    transpose (mat: number[], dest?: number[]): number[];
    transformVec4 (mat: number[], vec: number[], dest?: number[]): number[];
    createTranslate (x: number, y: number, z: number, dest?: number[]): number[];
    createScale (x: number, y: number, z: number, dest?: number[]): number[];
    createRotateX (theta: number, dest?: number[]): number[];
    createRotateY (theta: number, dest?: number[]): number[];
    createRotateZ (theta: number, dest?: number[]): number[];
    createPerspective (fieldOfViewY: number, aspectRatio: number, zNearPlane: number, zFarPlane: number, dest?: number[]): number[];
    createViewport (width: number, height: number, dest?: number[]): number[];
}

namespace mirage {
    enum Indexes {
        m11 = 0,
        m12 = 1,
        m13 = 2,
        m14 = 3,
        m21 = 4,
        m22 = 5,
        m23 = 6,
        m24 = 7,
        m31 = 8,
        m32 = 9,
        m33 = 10,
        m34 = 11,
        offsetX = 12,
        offsetY = 13,
        offsetZ = 14,
        m44 = 15
    }

    var FLOAT_EPSILON = 0.000001;
    var createTypedArray: (length: number) => number[];

    if (typeof Float32Array !== "undefined") {
        createTypedArray = function (length: number): number[] {
            return <number[]><any>new Float32Array(length);
        };
    } else {
        createTypedArray = function (length: number): number[] {
            return <number[]>new Array(length);
        };
    }

    export var mat4: IMatrix4Static = {
        create (src?: number[]): number[] {
            var dest = createTypedArray(16);

            if (src) {
                dest[Indexes.m11] = src[Indexes.m11];
                dest[Indexes.m12] = src[Indexes.m12];
                dest[Indexes.m13] = src[Indexes.m13];
                dest[Indexes.m14] = src[Indexes.m14];
                dest[Indexes.m21] = src[Indexes.m21];
                dest[Indexes.m22] = src[Indexes.m22];
                dest[Indexes.m23] = src[Indexes.m23];
                dest[Indexes.m24] = src[Indexes.m24];
                dest[Indexes.m31] = src[Indexes.m31];
                dest[Indexes.m32] = src[Indexes.m32];
                dest[Indexes.m33] = src[Indexes.m33];
                dest[Indexes.m34] = src[Indexes.m34];
                dest[Indexes.offsetX] = src[Indexes.offsetX];
                dest[Indexes.offsetY] = src[Indexes.offsetY];
                dest[Indexes.offsetZ] = src[Indexes.offsetZ];
                dest[Indexes.m44] = src[Indexes.m44];
            }

            return dest;
        },
        copyTo (src: number[], dest: number[]): number[] {
            dest[Indexes.m11] = src[Indexes.m11];
            dest[Indexes.m12] = src[Indexes.m12];
            dest[Indexes.m13] = src[Indexes.m13];
            dest[Indexes.m14] = src[Indexes.m14];
            dest[Indexes.m21] = src[Indexes.m21];
            dest[Indexes.m22] = src[Indexes.m22];
            dest[Indexes.m23] = src[Indexes.m23];
            dest[Indexes.m24] = src[Indexes.m24];
            dest[Indexes.m31] = src[Indexes.m31];
            dest[Indexes.m32] = src[Indexes.m32];
            dest[Indexes.m33] = src[Indexes.m33];
            dest[Indexes.m34] = src[Indexes.m34];
            dest[Indexes.offsetX] = src[Indexes.offsetX];
            dest[Indexes.offsetY] = src[Indexes.offsetY];
            dest[Indexes.offsetZ] = src[Indexes.offsetZ];
            dest[Indexes.m44] = src[Indexes.m44];
            return dest;
        },
        identity (dest?: number[]): number[] {
            if (!dest) dest = mat4.create();
            dest[Indexes.m11] = 1;
            dest[Indexes.m12] = 0;
            dest[Indexes.m13] = 0;
            dest[Indexes.m14] = 0;
            dest[Indexes.m21] = 0;
            dest[Indexes.m22] = 1;
            dest[Indexes.m23] = 0;
            dest[Indexes.m24] = 0;
            dest[Indexes.m31] = 0;
            dest[Indexes.m32] = 0;
            dest[Indexes.m33] = 1;
            dest[Indexes.m34] = 0;
            dest[Indexes.offsetX] = 0;
            dest[Indexes.offsetY] = 0;
            dest[Indexes.offsetZ] = 0;
            dest[Indexes.m44] = 1;
            return dest;
        },
        equal (a: number[], b: number[]): boolean {
            return a === b || (
                Math.abs(a[Indexes.m11] - b[Indexes.m11]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.m12] - b[Indexes.m12]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.m13] - b[Indexes.m13]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.m14] - b[Indexes.m14]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.m21] - b[Indexes.m21]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.m22] - b[Indexes.m22]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.m23] - b[Indexes.m23]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.m24] - b[Indexes.m24]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.m31] - b[Indexes.m31]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.m32] - b[Indexes.m32]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.m33] - b[Indexes.m33]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.m34] - b[Indexes.m34]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.offsetX] - b[Indexes.offsetX]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.offsetY] - b[Indexes.offsetY]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.offsetZ] - b[Indexes.offsetZ]) < FLOAT_EPSILON &&
                Math.abs(a[Indexes.m44] - b[Indexes.m44]) < FLOAT_EPSILON
                );
        },
        multiply (a: number[], b: number[], dest?: number[]): number[] {
            if (!dest) dest = a;
            var m11 = a[Indexes.m11], m12 = a[Indexes.m12], m13 = a[Indexes.m13], m14 = a[Indexes.m14],
                m21 = a[Indexes.m21], m22 = a[Indexes.m22], m23 = a[Indexes.m23], m24 = a[Indexes.m24],
                m31 = a[Indexes.m31], m32 = a[Indexes.m32], m33 = a[Indexes.m33], m34 = a[Indexes.m34],
                mx0 = a[Indexes.offsetX], my0 = a[Indexes.offsetY], mz0 = a[Indexes.offsetZ], m44 = a[Indexes.m44];

            var n11 = b[Indexes.m11], n12 = b[Indexes.m12], n13 = b[Indexes.m13], n14 = b[Indexes.m14],
                n21 = b[Indexes.m21], n22 = b[Indexes.m22], n23 = b[Indexes.m23], n24 = b[Indexes.m24],
                n31 = b[Indexes.m31], n32 = b[Indexes.m32], n33 = b[Indexes.m33], n34 = b[Indexes.m34],
                nx0 = b[Indexes.offsetX], ny0 = b[Indexes.offsetY], nz0 = b[Indexes.offsetZ], n44 = b[Indexes.m44];

            dest[Indexes.m11] = m11 * n11 + m12 * n21 + m13 * n31 + m14 * nx0;
            dest[Indexes.m12] = m11 * n12 + m12 * n22 + m13 * n32 + m14 * ny0;
            dest[Indexes.m13] = m11 * n13 + m12 * n23 + m13 * n33 + m14 * nz0;
            dest[Indexes.m14] = m11 * n14 + m12 * n24 + m13 * n34 + m14 * n44;
            dest[Indexes.m21] = m21 * n11 + m22 * n21 + m23 * n31 + m24 * nx0;
            dest[Indexes.m22] = m21 * n12 + m22 * n22 + m23 * n32 + m24 * ny0;
            dest[Indexes.m23] = m21 * n13 + m22 * n23 + m23 * n33 + m24 * nz0;
            dest[Indexes.m24] = m21 * n14 + m22 * n24 + m23 * n34 + m24 * n44;
            dest[Indexes.m31] = m31 * n11 + m32 * n21 + m33 * n31 + m34 * nx0;
            dest[Indexes.m32] = m31 * n12 + m32 * n22 + m33 * n32 + m34 * ny0;
            dest[Indexes.m33] = m31 * n13 + m32 * n23 + m33 * n33 + m34 * nz0;
            dest[Indexes.m34] = m31 * n14 + m32 * n24 + m33 * n34 + m34 * n44;
            dest[Indexes.offsetX] = mx0 * n11 + my0 * n21 + mz0 * n31 + m44 * nx0;
            dest[Indexes.offsetY] = mx0 * n12 + my0 * n22 + mz0 * n32 + m44 * ny0;
            dest[Indexes.offsetZ] = mx0 * n13 + my0 * n23 + mz0 * n33 + m44 * nz0;
            dest[Indexes.m44] = mx0 * n14 + my0 * n24 + mz0 * n34 + m44 * n44;
            return dest;
        },
        inverse (mat: number[], dest?: number[]): number[] {
            if (!dest) dest = mat;

            // Cache the matrix values (makes for huge speed increases!)
            var a00 = mat[Indexes.m11], a01 = mat[Indexes.m12], a02 = mat[Indexes.m13], a03 = mat[Indexes.m14],
                a10 = mat[Indexes.m21], a11 = mat[Indexes.m22], a12 = mat[Indexes.m23], a13 = mat[Indexes.m24],
                a20 = mat[Indexes.m31], a21 = mat[Indexes.m32], a22 = mat[Indexes.m33], a23 = mat[Indexes.m34],
                a30 = mat[Indexes.offsetX], a31 = mat[Indexes.offsetY], a32 = mat[Indexes.offsetZ], a33 = mat[Indexes.m44],

                b00 = a00 * a11 - a01 * a10,
                b01 = a00 * a12 - a02 * a10,
                b02 = a00 * a13 - a03 * a10,
                b03 = a01 * a12 - a02 * a11,
                b04 = a01 * a13 - a03 * a11,
                b05 = a02 * a13 - a03 * a12,
                b06 = a20 * a31 - a21 * a30,
                b07 = a20 * a32 - a22 * a30,
                b08 = a20 * a33 - a23 * a30,
                b09 = a21 * a32 - a22 * a31,
                b10 = a21 * a33 - a23 * a31,
                b11 = a22 * a33 - a23 * a32;

            var d = (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
            if (!isFinite(d) || !d)
                return null;
            var id = 1 / d;

            dest[Indexes.m11] = (a11 * b11 - a12 * b10 + a13 * b09) * id;
            dest[Indexes.m12] = (-a01 * b11 + a02 * b10 - a03 * b09) * id;
            dest[Indexes.m13] = (a31 * b05 - a32 * b04 + a33 * b03) * id;
            dest[Indexes.m14] = (-a21 * b05 + a22 * b04 - a23 * b03) * id;
            dest[Indexes.m21] = (-a10 * b11 + a12 * b08 - a13 * b07) * id;
            dest[Indexes.m22] = (a00 * b11 - a02 * b08 + a03 * b07) * id;
            dest[Indexes.m23] = (-a30 * b05 + a32 * b02 - a33 * b01) * id;
            dest[Indexes.m24] = (a20 * b05 - a22 * b02 + a23 * b01) * id;
            dest[Indexes.m31] = (a10 * b10 - a11 * b08 + a13 * b06) * id;
            dest[Indexes.m32] = (-a00 * b10 + a01 * b08 - a03 * b06) * id;
            dest[Indexes.m33] = (a30 * b04 - a31 * b02 + a33 * b00) * id;
            dest[Indexes.m34] = (-a20 * b04 + a21 * b02 - a23 * b00) * id;
            dest[Indexes.offsetX] = (-a10 * b09 + a11 * b07 - a12 * b06) * id;
            dest[Indexes.offsetY] = (a00 * b09 - a01 * b07 + a02 * b06) * id;
            dest[Indexes.offsetZ] = (-a30 * b03 + a31 * b01 - a32 * b00) * id;
            dest[Indexes.m44] = (a20 * b03 - a21 * b01 + a22 * b00) * id;

            return dest;
        },
        transpose (mat: number[], dest?: number[]): number[] {
            if (!dest) dest = mat;

            var a00 = mat[Indexes.m11], a01 = mat[Indexes.m12], a02 = mat[Indexes.m13], a03 = mat[Indexes.m14],
                a10 = mat[Indexes.m21], a11 = mat[Indexes.m22], a12 = mat[Indexes.m23], a13 = mat[Indexes.m24],
                a20 = mat[Indexes.m31], a21 = mat[Indexes.m32], a22 = mat[Indexes.m33], a23 = mat[Indexes.m34],
                a30 = mat[Indexes.offsetX], a31 = mat[Indexes.offsetY], a32 = mat[Indexes.offsetZ], a33 = mat[Indexes.m44];

            dest[Indexes.m11] = a00; dest[Indexes.m21] = a01; dest[Indexes.m31] = a02; dest[Indexes.offsetX] = a03;
            dest[Indexes.m12] = a10; dest[Indexes.m22] = a11; dest[Indexes.m32] = a12; dest[Indexes.offsetY] = a13;
            dest[Indexes.m13] = a20; dest[Indexes.m23] = a21; dest[Indexes.m33] = a22; dest[Indexes.offsetZ] = a23;
            dest[Indexes.m14] = a30; dest[Indexes.m24] = a31; dest[Indexes.m34] = a32; dest[Indexes.m44] = a33;

            return dest;
        },
        transformVec4 (mat: number[], vec: number[], dest?: number[]): number[] {
            if (!dest) dest = vec;

            var x = vec[0], y = vec[1], z = vec[2], w = vec[3];

            var m11 = mat[Indexes.m11], m12 = mat[Indexes.m12], m13 = mat[Indexes.m13], m14 = mat[Indexes.m14],
                m21 = mat[Indexes.m21], m22 = mat[Indexes.m22], m23 = mat[Indexes.m23], m24 = mat[Indexes.m24],
                m31 = mat[Indexes.m31], m32 = mat[Indexes.m32], m33 = mat[Indexes.m33], m34 = mat[Indexes.m34],
                mx0 = mat[Indexes.offsetX], my0 = mat[Indexes.offsetY], mz0 = mat[Indexes.offsetZ], m44 = mat[Indexes.m44];

            dest[0] = m11 * x + m12 * y + m13 * z + m14 * w;
            dest[1] = m21 * x + m22 * y + m23 * z + m24 * w;
            dest[2] = m31 * x + m32 * y + m33 * z + m34 * w;
            dest[3] = mx0 * x + my0 * y + mz0 * z + m44 * w;

            return dest;
        },

        createTranslate (x: number, y: number, z: number, dest?: number[]): number[] {
            if (!dest) dest = mat4.create();

            dest[Indexes.m11] = 1;
            dest[Indexes.m12] = 0;
            dest[Indexes.m13] = 0;
            dest[Indexes.m14] = 0;

            dest[Indexes.m21] = 0;
            dest[Indexes.m22] = 1;
            dest[Indexes.m23] = 0;
            dest[Indexes.m24] = 0;

            dest[Indexes.m31] = 0;
            dest[Indexes.m32] = 0;
            dest[Indexes.m33] = 1;
            dest[Indexes.m34] = 0;

            dest[Indexes.offsetX] = x;
            dest[Indexes.offsetY] = y;
            dest[Indexes.offsetZ] = z;
            dest[Indexes.m44] = 1;

            return dest;
        },
        createScale (x: number, y: number, z: number, dest?: number[]): number[] {
            if (!dest) dest = mat4.create();

            dest[Indexes.m11] = x;
            dest[Indexes.m12] = 0;
            dest[Indexes.m13] = 0;
            dest[Indexes.m14] = 0;

            dest[Indexes.m11] = 0;
            dest[Indexes.m12] = y;
            dest[Indexes.m13] = 0;
            dest[Indexes.m14] = 0;

            dest[Indexes.m31] = 0;
            dest[Indexes.m32] = 0;
            dest[Indexes.m33] = z;
            dest[Indexes.m34] = 0;

            dest[Indexes.offsetX] = 0;
            dest[Indexes.offsetY] = 0;
            dest[Indexes.offsetZ] = 0;
            dest[Indexes.m44] = 1;

            return dest;
        },
        createRotateX (theta: number, dest?: number[]): number[] {
            if (!dest) dest = mat4.create();

            var s = Math.sin(theta);
            var c = Math.cos(theta);

            dest[Indexes.m11] = 1;
            dest[Indexes.m12] = 0;
            dest[Indexes.m13] = 0;
            dest[Indexes.m14] = 0;

            dest[Indexes.m21] = 0;
            dest[Indexes.m22] = c;
            dest[Indexes.m23] = s;
            dest[Indexes.m24] = 0;

            dest[Indexes.m31] = 0;
            dest[Indexes.m32] = -s;
            dest[Indexes.m33] = c;
            dest[Indexes.m34] = 0;

            dest[Indexes.offsetX] = 0;
            dest[Indexes.offsetY] = 0;
            dest[Indexes.offsetZ] = 0;
            dest[Indexes.m44] = 1;

            return dest;
        },
        createRotateY (theta: number, dest?: number[]): number[] {
            if (!dest) dest = mat4.create();

            var s = Math.sin(theta);
            var c = Math.cos(theta);

            dest[Indexes.m11] = c;
            dest[Indexes.m12] = 0;
            dest[Indexes.m13] = -s;
            dest[Indexes.m14] = 0;

            dest[Indexes.m21] = 0;
            dest[Indexes.m22] = 1;
            dest[Indexes.m23] = 0;
            dest[Indexes.m24] = 0;

            dest[Indexes.m31] = s;
            dest[Indexes.m32] = 0;
            dest[Indexes.m33] = c;
            dest[Indexes.m34] = 0;

            dest[Indexes.offsetX] = 0;
            dest[Indexes.offsetY] = 0;
            dest[Indexes.offsetZ] = 0;
            dest[Indexes.m44] = 1;

            return dest;
        },
        createRotateZ (theta: number, dest?: number[]): number[] {
            if (!dest) dest = mat4.create();

            var s = Math.sin(theta);
            var c = Math.cos(theta);

            dest[Indexes.m11] = c;
            dest[Indexes.m12] = s;
            dest[Indexes.m13] = 0;
            dest[Indexes.m14] = 0;

            dest[Indexes.m21] = -s;
            dest[Indexes.m22] = c;
            dest[Indexes.m23] = 0;
            dest[Indexes.m24] = 0;

            dest[Indexes.m31] = 0;
            dest[Indexes.m32] = 0;
            dest[Indexes.m33] = 1;
            dest[Indexes.m34] = 0;

            dest[Indexes.offsetX] = 0;
            dest[Indexes.offsetY] = 0;
            dest[Indexes.offsetZ] = 0;
            dest[Indexes.m44] = 1;

            return dest;
        },

        createPerspective (fieldOfViewY: number, aspectRatio: number, zNearPlane: number, zFarPlane: number, dest?: number[]): number[] {
            if (!dest) dest = mat4.create();

            var height = 1.0 / Math.tan(fieldOfViewY / 2.0);
            var width = height / aspectRatio;
            var d = zNearPlane - zFarPlane;

            dest[Indexes.m11] = width;
            dest[Indexes.m12] = 0;
            dest[Indexes.m13] = 0;
            dest[Indexes.m14] = 0;

            dest[Indexes.m21] = 0;
            dest[Indexes.m22] = height;
            dest[Indexes.m23] = 0;
            dest[Indexes.m24] = 0;

            dest[Indexes.m31] = 0;
            dest[Indexes.m32] = 0;
            dest[Indexes.m33] = zFarPlane / d;
            dest[Indexes.m34] = -1.0;

            dest[Indexes.offsetX] = 0;
            dest[Indexes.offsetY] = 0;
            dest[Indexes.offsetZ] = zNearPlane * zFarPlane / d;
            dest[Indexes.m44] = 0.0;

            return dest;
        },
        createViewport (width: number, height: number, dest?: number[]): number[] {
            if (!dest) dest = mat4.create();

            dest[Indexes.m11] = width / 2.0;
            dest[Indexes.m12] = 0;
            dest[Indexes.m13] = 0;
            dest[Indexes.m14] = 0;

            dest[Indexes.m21] = 0;
            dest[Indexes.m22] = -height / 2.0;
            dest[Indexes.m23] = 0;
            dest[Indexes.m24] = 0;

            dest[Indexes.m31] = 0;
            dest[Indexes.m32] = 0;
            dest[Indexes.m33] = 1;
            dest[Indexes.m34] = 0;

            dest[Indexes.offsetX] = width / 2.0;
            dest[Indexes.offsetY] = height / 2.0;
            dest[Indexes.offsetZ] = 0;
            dest[Indexes.m44] = 1;

            return dest;
        }
    };
}

var mat4 = mirage.mat4;