"use strict";


/*
 * A fast javascript implementation of simplex noise by Jonas Wagner

Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
Better rank ordering method by Stefan Gustavson in 2012.

 Copyright (c) 2022 Jonas Wagner

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
// these #__PURE__ comments help uglifyjs with dead code removal
var F2 = /*#__PURE__*/ 0.5 * (Math.sqrt(3.0) - 1.0);
var G2 = /*#__PURE__*/ (3.0 - Math.sqrt(3.0)) / 6.0;

var fastFloor = function (x) { return Math.floor(x) | 0; };
var grad2 = /*#__PURE__*/ new Float64Array([1, 1,
    -1, 1,
    1, -1,
    -1, -1,
    1, 0,
    -1, 0,
    1, 0,
    -1, 0,
    0, 1,
    0, -1,
    0, 1,
    0, -1]);
/**
 * Creates a 2D noise function
 * @param random the random function that will be used to build the permutation table
 * @returns {NoiseFunction2D}
 */
function createNoise2D(random) {
    if (random === void 0) { random = Math.random; }
    var perm = buildPermutationTable(random);
    // precalculating this yields a little ~3% performance improvement.
    var permGrad2x = new Float64Array(perm).map(function (v) { return grad2[(v % 12) * 2]; });
    var permGrad2y = new Float64Array(perm).map(function (v) { return grad2[(v % 12) * 2 + 1]; });
    return function noise2D(x, y) {
        // if(!isFinite(x) || !isFinite(y)) return 0;
        var n0 = 0; // Noise contributions from the three corners
        var n1 = 0;
        var n2 = 0;
        // Skew the input space to determine which simplex cell we're in
        var s = (x + y) * F2; // Hairy factor for 2D
        var i = fastFloor(x + s);
        var j = fastFloor(y + s);
        var t = (i + j) * G2;
        var X0 = i - t; // Unskew the cell origin back to (x,y) space
        var Y0 = j - t;
        var x0 = x - X0; // The x,y distances from the cell origin
        var y0 = y - Y0;
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        else {
            i1 = 0;
            j1 = 1;
        } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        var y1 = y0 - j1 + G2;
        var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
        var y2 = y0 - 1.0 + 2.0 * G2;
        // Work out the hashed gradient indices of the three simplex corners
        var ii = i & 255;
        var jj = j & 255;
        // Calculate the contribution from the three corners
        var t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) {
            var gi0 = ii + perm[jj];
            var g0x = permGrad2x[gi0];
            var g0y = permGrad2y[gi0];
            t0 *= t0;
            // n0 = t0 * t0 * (grad2[gi0] * x0 + grad2[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
            n0 = t0 * t0 * (g0x * x0 + g0y * y0);
        }
        var t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) {
            var gi1 = ii + i1 + perm[jj + j1];
            var g1x = permGrad2x[gi1];
            var g1y = permGrad2y[gi1];
            t1 *= t1;
            // n1 = t1 * t1 * (grad2[gi1] * x1 + grad2[gi1 + 1] * y1);
            n1 = t1 * t1 * (g1x * x1 + g1y * y1);
        }
        var t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) {
            var gi2 = ii + 1 + perm[jj + 1];
            var g2x = permGrad2x[gi2];
            var g2y = permGrad2y[gi2];
            t2 *= t2;
            // n2 = t2 * t2 * (grad2[gi2] * x2 + grad2[gi2 + 1] * y2);
            n2 = t2 * t2 * (g2x * x2 + g2y * y2);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70.0 * (n0 + n1 + n2);
    };
}
/**
 * Builds a random permutation table.
 * This is exported only for (internal) testing purposes.
 * Do not rely on this export.
 * @private
 */
function buildPermutationTable(random) {
    var tableSize = 512;
    var p = new Uint8Array(tableSize);
    for (var i = 0; i < tableSize / 2; i++) {
        p[i] = i;
    }
    for (var i = 0; i < tableSize / 2 - 1; i++) {
        var r = i + ~~(random() * (256 - i));
        var aux = p[i];
        p[i] = p[r];
        p[r] = aux;
    }
    for (var i = 256; i < tableSize; i++) {
        p[i] = p[i - 256];
    }
    return p;
}