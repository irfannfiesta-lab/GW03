/**
 * ColorExtractor — Computes all color features from image pixel data
 * 
 * Features extracted:
 *   - Color Histogram (R/G/B, 256 bins each, normalized)
 *   - Color Moments (Mean μ, Std Dev σ, Skewness γ per channel)
 *   - Colorfulness (Hasler-Süsstrunk metric)
 *   - Temperature Score (warm 0→1 cool mapping from HSV hue)
 *   - Dominant Colors (via K-Means, delegated to KMeansClustering)
 */

import { ColorUtils } from './ColorUtils.js';
import { KMeansClustering } from './KMeansClustering.js';
import { CONFIG } from '../config.js';

export class ColorExtractor {

    /**
     * Extract all features from pixel data
     * @param {Uint8ClampedArray} pixels - RGBA pixel array from canvas
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @returns {Object} Complete feature set
     */
    static extractAll(pixels, width, height) {
        const histogram = this.computeHistogram(pixels);
        const moments = this.computeColorMoments(pixels);
        const colorfulness = this.computeColorfulness(pixels);
        const temperature = this.computeTemperature(pixels);
        const { clusters: dominantColors, iterations: kmeansIter } = 
            KMeansClustering.run(pixels, CONFIG.KMEANS_K, CONFIG.KMEANS_MAX_ITER, CONFIG.KMEANS_SAMPLE_SIZE);

        // Compute average saturation and brightness from HSV
        const { avgSaturation, avgBrightness } = this.computeAvgSatBright(pixels);

        return {
            histogram,
            moments,
            colorfulness,
            temperature,
            dominantColors,
            kmeansIterations: kmeansIter,
            avgSaturation,
            avgBrightness,
            width,
            height,
        };
    }

    /**
     * Compute normalized color histogram (256 bins per channel)
     * 
     * Formula: h(b) = count(pixels in bin b) / total_pixels
     * 
     * @param {Uint8ClampedArray} pixels
     * @returns {{ r: number[], g: number[], b: number[] }}
     */
    static computeHistogram(pixels) {
        const r = new Float64Array(256);
        const g = new Float64Array(256);
        const b = new Float64Array(256);
        const totalPixels = pixels.length / 4;

        for (let i = 0; i < pixels.length; i += 4) {
            r[pixels[i]]++;
            g[pixels[i + 1]]++;
            b[pixels[i + 2]]++;
        }

        // Normalize
        for (let i = 0; i < 256; i++) {
            r[i] /= totalPixels;
            g[i] /= totalPixels;
            b[i] /= totalPixels;
        }

        return { r: Array.from(r), g: Array.from(g), b: Array.from(b) };
    }

    /**
     * Compute Color Moments (1st, 2nd, 3rd order)
     * 
     * Mean (μ):     μ = (1/N) Σ pᵢ
     * Std Dev (σ):  σ = sqrt((1/N) Σ (pᵢ - μ)²)
     * Skewness (γ): γ = cbrt((1/N) Σ (pᵢ - μ)³)
     */
    static computeColorMoments(pixels) {
        const n = pixels.length / 4;
        let sumR = 0, sumG = 0, sumB = 0;

        // 1st moment: Mean
        for (let i = 0; i < pixels.length; i += 4) {
            sumR += pixels[i];
            sumG += pixels[i + 1];
            sumB += pixels[i + 2];
        }
        const meanR = sumR / n, meanG = sumG / n, meanB = sumB / n;

        // 2nd & 3rd moments
        let varR = 0, varG = 0, varB = 0;
        let skR = 0, skG = 0, skB = 0;

        for (let i = 0; i < pixels.length; i += 4) {
            const dR = pixels[i] - meanR;
            const dG = pixels[i + 1] - meanG;
            const dB = pixels[i + 2] - meanB;
            varR += dR * dR;
            varG += dG * dG;
            varB += dB * dB;
            skR += dR * dR * dR;
            skG += dG * dG * dG;
            skB += dB * dB * dB;
        }

        const stdR = Math.sqrt(varR / n);
        const stdG = Math.sqrt(varG / n);
        const stdB = Math.sqrt(varB / n);
        const skewR = Math.cbrt(skR / n);
        const skewG = Math.cbrt(skG / n);
        const skewB = Math.cbrt(skB / n);

        return {
            mean: { r: meanR, g: meanG, b: meanB },
            std:  { r: stdR,  g: stdG,  b: stdB },
            skew: { r: skewR, g: skewG, b: skewB },
        };
    }

    /**
     * Hasler-Süsstrunk Colorfulness Metric
     * 
     * rg = R - G
     * yb = 0.5*(R + G) - B
     * C = sqrt(σ_rg² + σ_yb²) + 0.3 * sqrt(μ_rg² + μ_yb²)
     */
    static computeColorfulness(pixels) {
        const n = pixels.length / 4;
        let sumRG = 0, sumYB = 0, sumRG2 = 0, sumYB2 = 0;

        for (let i = 0; i < pixels.length; i += 4) {
            const rg = pixels[i] - pixels[i + 1];
            const yb = 0.5 * (pixels[i] + pixels[i + 1]) - pixels[i + 2];
            sumRG += rg;
            sumYB += yb;
            sumRG2 += rg * rg;
            sumYB2 += yb * yb;
        }

        const meanRG = sumRG / n, meanYB = sumYB / n;
        const stdRG = Math.sqrt(sumRG2 / n - meanRG * meanRG);
        const stdYB = Math.sqrt(sumYB2 / n - meanYB * meanYB);

        return Math.sqrt(stdRG ** 2 + stdYB ** 2) + 0.3 * Math.sqrt(meanRG ** 2 + meanYB ** 2);
    }

    /**
     * Temperature Score
     * Warm colors (red/orange/yellow): hue 0-60, 300-360
     * Cool colors (blue/green/cyan): hue 120-270
     * Returns: 0 (cool) to 1 (warm)
     */
    static computeTemperature(pixels) {
        let warmCount = 0, totalValid = 0;

        for (let i = 0; i < pixels.length; i += 4) {
            const { h, s } = ColorUtils.rgbToHsv(pixels[i], pixels[i + 1], pixels[i + 2]);
            if (s < 0.05) continue; // Skip achromatic pixels
            totalValid++;
            if (h <= 60 || h >= 300) warmCount++;
        }

        if (totalValid === 0) return 0.5;
        return warmCount / totalValid;
    }

    /**
     * Average Saturation and Brightness from HSV
     */
    static computeAvgSatBright(pixels) {
        const n = pixels.length / 4;
        let totalS = 0, totalV = 0;

        for (let i = 0; i < pixels.length; i += 4) {
            const { s, v } = ColorUtils.rgbToHsv(pixels[i], pixels[i + 1], pixels[i + 2]);
            totalS += s;
            totalV += v;
        }

        return {
            avgSaturation: (totalS / n) * 100,
            avgBrightness: (totalV / n) * 100,
        };
    }
}
