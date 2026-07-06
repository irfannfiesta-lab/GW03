/**
 * K-Means Clustering for Dominant Color Extraction
 * 
 * Algorithm:
 *   1. Initialize K centroids randomly from pixel samples
 *   2. Assign each pixel to nearest centroid (Euclidean in RGB space)
 *   3. Recompute centroids as mean of assigned pixels
 *   4. Repeat until convergence or max iterations
 * 
 * Objective Function: J = Σᵢ Σₖ rᵢₖ ||pᵢ - μₖ||²
 *   where rᵢₖ = 1 if pixel i belongs to cluster k
 */

import { ColorUtils } from './ColorUtils.js';

export class KMeansClustering {

    /**
     * Run K-Means on pixel data
     * @param {Uint8ClampedArray} pixels - RGBA pixel data
     * @param {number} k - Number of clusters
     * @param {number} maxIter - Maximum iterations (default 20)
     * @param {number} sampleSize - Downsample pixel count (default 5000)
     * @returns {{ clusters: Array<{rgb, hex, weight}>, iterations: number }}
     */
    static run(pixels, k = 5, maxIter = 20, sampleSize = 5000) {
        // Step 1: Sample pixels (skip alpha, take every 4th channel group)
        const totalPixels = pixels.length / 4;
        const step = Math.max(1, Math.floor(totalPixels / sampleSize));
        const samples = [];

        for (let i = 0; i < pixels.length; i += 4 * step) {
            samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
        }

        if (samples.length < k) {
            // Not enough samples
            return { clusters: [], iterations: 0 };
        }

        // Step 2: Initialize centroids using K-Means++ strategy
        const centroids = this._initCentroidsKMeansPP(samples, k);

        // Step 3: Iterative assignment & update
        let assignments = new Array(samples.length).fill(0);
        let iter = 0;

        for (iter = 0; iter < maxIter; iter++) {
            // Assign each sample to nearest centroid
            let changed = false;
            for (let i = 0; i < samples.length; i++) {
                const nearest = this._nearestCentroid(samples[i], centroids);
                if (nearest !== assignments[i]) {
                    assignments[i] = nearest;
                    changed = true;
                }
            }

            if (!changed) break; // Converged

            // Update centroids
            for (let c = 0; c < k; c++) {
                let sumR = 0, sumG = 0, sumB = 0, count = 0;
                for (let i = 0; i < samples.length; i++) {
                    if (assignments[i] === c) {
                        sumR += samples[i][0];
                        sumG += samples[i][1];
                        sumB += samples[i][2];
                        count++;
                    }
                }
                if (count > 0) {
                    centroids[c] = [
                        Math.round(sumR / count),
                        Math.round(sumG / count),
                        Math.round(sumB / count)
                    ];
                }
            }
        }

        // Step 4: Compute cluster weights
        const clusterCounts = new Array(k).fill(0);
        for (const a of assignments) clusterCounts[a]++;

        const clusters = centroids.map((c, i) => ({
            rgb: c,
            hex: ColorUtils.rgbToHex(c[0], c[1], c[2]),
            weight: clusterCounts[i] / samples.length,
            name: ColorUtils.colorName(c[0], c[1], c[2]),
        }));

        // Sort by weight descending
        clusters.sort((a, b) => b.weight - a.weight);

        return { clusters, iterations: iter };
    }

    /**
     * K-Means++ initialization
     * Selects centroids with probability proportional to squared distance
     */
    static _initCentroidsKMeansPP(samples, k) {
        const centroids = [];
        // Pick first centroid randomly
        centroids.push([...samples[Math.floor(Math.random() * samples.length)]]);

        for (let c = 1; c < k; c++) {
            // Compute distances to nearest centroid
            const distances = samples.map(s => {
                let minDist = Infinity;
                for (const cent of centroids) {
                    const d = (s[0] - cent[0]) ** 2 + (s[1] - cent[1]) ** 2 + (s[2] - cent[2]) ** 2;
                    if (d < minDist) minDist = d;
                }
                return minDist;
            });

            // Pick next centroid with probability ∝ distance²
            const totalDist = distances.reduce((a, b) => a + b, 0);
            let target = Math.random() * totalDist;
            for (let i = 0; i < distances.length; i++) {
                target -= distances[i];
                if (target <= 0) {
                    centroids.push([...samples[i]]);
                    break;
                }
            }
        }

        return centroids;
    }

    /**
     * Find index of nearest centroid using Euclidean distance
     */
    static _nearestCentroid(pixel, centroids) {
        let minDist = Infinity, minIdx = 0;
        for (let i = 0; i < centroids.length; i++) {
            const d = (pixel[0] - centroids[i][0]) ** 2 +
                      (pixel[1] - centroids[i][1]) ** 2 +
                      (pixel[2] - centroids[i][2]) ** 2;
            if (d < minDist) {
                minDist = d;
                minIdx = i;
            }
        }
        return minIdx;
    }
}
