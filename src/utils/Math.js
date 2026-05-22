/**
 * Utilitários de matemática 3D
 * Operações com vetores, matrizes e quaternions
 */

export class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static fromArray(arr) {
        return new Vec3(arr[0], arr[1], arr[2]);
    }

    toArray() {
        return [this.x, this.y, this.z];
    }

    add(other) {
        return new Vec3(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    subtract(other) {
        return new Vec3(this.x - other.x, this.y - other.y, this.z - other.z);
    }

    multiply(scalar) {
        return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar);
    }

    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    cross(other) {
        return new Vec3(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x
        );
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    normalize() {
        const len = this.length();
        if (len === 0) return new Vec3(0, 0, 0);
        return this.multiply(1 / len);
    }

    distance(other) {
        return this.subtract(other).length();
    }

    clone() {
        return new Vec3(this.x, this.y, this.z);
    }
}

export class Mat4 {
    constructor() {
        // Matriz 4x4 em formato coluna-maior (como esperado pelo WebGL)
        this.data = new Float32Array(16);
        this.identity();
    }

    identity() {
        const d = this.data;
        d[0] = 1;  d[1] = 0;  d[2] = 0;  d[3] = 0;
        d[4] = 0;  d[5] = 1;  d[6] = 0;  d[7] = 0;
        d[8] = 0;  d[9] = 0;  d[10] = 1; d[11] = 0;
        d[12] = 0; d[13] = 0; d[14] = 0; d[15] = 1;
        return this;
    }

    static identity() {
        return new Mat4().identity();
    }

    static translate(x, y, z) {
        const m = new Mat4();
        m.data[12] = x;
        m.data[13] = y;
        m.data[14] = z;
        return m;
    }

    static rotateX(rad) {
        const m = new Mat4();
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        m.data[5] = c;  m.data[6] = s;
        m.data[9] = -s; m.data[10] = c;
        return m;
    }

    static rotateY(rad) {
        const m = new Mat4();
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        m.data[0] = c;   m.data[2] = -s;
        m.data[8] = s;   m.data[10] = c;
        return m;
    }

    static rotateZ(rad) {
        const m = new Mat4();
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        m.data[0] = c;  m.data[1] = s;
        m.data[4] = -s; m.data[5] = c;
        return m;
    }

    static scale(x, y, z) {
        const m = new Mat4();
        m.data[0] = x;
        m.data[5] = y;
        m.data[10] = z;
        return m;
    }

    static perspective(fov, aspectRatio, near, far) {
        const m = new Mat4();
        const f = 1.0 / Math.tan(fov / 2.0);
        const nf = 1.0 / (near - far);

        m.data[0] = f / aspectRatio; m.data[1] = 0;  m.data[2] = 0;                    m.data[3] = 0;
        m.data[4] = 0;                m.data[5] = f;  m.data[6] = 0;                    m.data[7] = 0;
        m.data[8] = 0;                m.data[9] = 0;  m.data[10] = (far + near) * nf; m.data[11] = -1;
        m.data[12] = 0;               m.data[13] = 0; m.data[14] = 2 * far * near * nf; m.data[15] = 0;

        return m;
    }

    static lookAt(eye, center, up) {
        const f = center.subtract(eye).normalize();
        const s = f.cross(up).normalize();
        const u = s.cross(f).normalize();

        const m = new Mat4();
        m.data[0] = s.x;  m.data[4] = s.y;  m.data[8] = s.z;   m.data[12] = -s.dot(eye);
        m.data[1] = u.x;  m.data[5] = u.y;  m.data[9] = u.z;   m.data[13] = -u.dot(eye);
        m.data[2] = -f.x; m.data[6] = -f.y; m.data[10] = -f.z; m.data[14] = f.dot(eye);
        m.data[3] = 0;    m.data[7] = 0;    m.data[11] = 0;    m.data[15] = 1;

        return m;
    }

    multiply(other) {
        const a = this.data;
        const b = other.data;
        const result = new Mat4();
        const r = result.data;

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    sum += a[k * 4 + i] * b[j * 4 + k];
                }
                r[j * 4 + i] = sum;
            }
        }

        return result;
    }

    translate(x, y, z) {
        return this.multiply(Mat4.translate(x, y, z));
    }

    rotateX(rad) {
        return this.multiply(Mat4.rotateX(rad));
    }

    rotateY(rad) {
        return this.multiply(Mat4.rotateY(rad));
    }

    rotateZ(rad) {
        return this.multiply(Mat4.rotateZ(rad));
    }

    scale(x, y, z) {
        return this.multiply(Mat4.scale(x, y, z));
    }

    clone() {
        const m = new Mat4();
        m.data.set(this.data);
        return m;
    }

    inverse() {
        const m = new Mat4();
        const a = this.data;
        const out = m.data;

        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        const b00 = a00 * a11 - a01 * a10;
        const b01 = a00 * a12 - a02 * a10;
        const b02 = a00 * a13 - a03 * a10;
        const b03 = a01 * a12 - a02 * a11;
        const b04 = a01 * a13 - a03 * a11;
        const b05 = a02 * a13 - a03 * a12;
        const b06 = a20 * a31 - a21 * a30;
        const b07 = a20 * a32 - a22 * a30;
        const b08 = a20 * a33 - a23 * a30;
        const b09 = a21 * a32 - a22 * a31;
        const b10 = a21 * a33 - a23 * a31;
        const b11 = a22 * a33 - a23 * a32;

        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

        if (!det) return null;

        det = 1.0 / det;

        out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        out[3] = (a12 * b04 - a11 * b05 - a13 * b03) * det;
        out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        out[7] = (a10 * b05 - a00 * b02 - a12 * b01) * det;
        out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        out[11] = (a00 * b02 - a01 * b04 - a13 * b00) * det;
        out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
        out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
        out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
        out[15] = (a01 * b01 - a00 * b03 + a11 * b00) * det;

        return m;
    }
}

// Funções auxiliares rápidas
export const MathUtils = {
    radians(degrees) {
        return degrees * Math.PI / 180;
    },

    degrees(radians) {
        return radians * 180 / Math.PI;
    },

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    random(min = 0, max = 1) {
        return Math.random() * (max - min) + min;
    }
};