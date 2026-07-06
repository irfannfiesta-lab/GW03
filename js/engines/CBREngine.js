/**
 * CBR Engine — Content-Based Retrieval
 * 
 * Compares color histograms using distance metrics:
 *   - Chi-Square: χ² = Σ((pᵢ - qᵢ)² / (pᵢ + qᵢ))
 *   - Euclidean:  d = sqrt(Σ(pᵢ - qᵢ)²)
 *   - Manhattan:  d = Σ|pᵢ - qᵢ|
 *   - Histogram Intersection: I = Σ min(pᵢ, qᵢ)
 */

import { ColorUtils } from '../core/ColorUtils.js';

export class CBREngine {

    /**
     * Search database by comparing color histograms
     * @param {Object} queryHistogram - { r: [], g: [], b: [] }
     * @param {Array} database - Students with histogram data
     * @param {string} metric - 'chi-square'|'euclidean'|'manhattan'|'intersection'
     * @returns {{ results: Array, log: string }}
     */
    static search(queryHistogram, database, metric = 'chi-square') {
        let log = `// CBR Search — ${metric}\n`;
        log += `// Comparing query histogram against ${database.length} images\n\n`;

        const metricFn = this._getMetricFunction(metric);
        const isIntersection = metric === 'intersection';

        const scored = database.map(student => {
            // Build combined histogram vectors (R + G + B = 768 dimensions)
            const queryVec = [
                ...(queryHistogram.r || []),
                ...(queryHistogram.g || []),
                ...(queryHistogram.b || []),
            ];
            const dbVec = [
                ...(student.histogram_r || []),
                ...(student.histogram_g || []),
                ...(student.histogram_b || []),
            ];

            if (queryVec.length === 0 || dbVec.length === 0) {
                return { student, score: 0, distance: Infinity };
            }

            const distance = metricFn(queryVec, dbVec);

            // For intersection, higher = better (similarity). For others, lower = better (distance)
            let score;
            if (isIntersection) {
                score = distance; // Already a similarity score 0-1
            } else {
                // Convert distance to similarity score: score = 1 / (1 + distance)
                // Normalize with a scale factor for each metric
                const scale = metric === 'chi-square' ? 1 : (metric === 'euclidean' ? 0.5 : 0.1);
                score = 1 / (1 + distance * scale);
            }

            return { student, score, distance };
        });

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);

        log += `// Distance metric: ${metric}\n`;
        log += `// Formula: ${this._getFormulaString(metric)}\n\n`;
        log += '// Results (ranked by similarity):\n';
        scored.slice(0, 10).forEach((r, i) => {
            log += `//  ${i + 1}. ${r.student.name}: score=${r.score.toFixed(4)}, dist=${r.distance.toFixed(4)}\n`;
        });

        return { results: scored, log };
    }

    static _getMetricFunction(metric) {
        switch (metric) {
            case 'chi-square':   return ColorUtils.chiSquareDistance;
            case 'euclidean':    return ColorUtils.euclideanDistance;
            case 'manhattan':    return ColorUtils.manhattanDistance;
            case 'intersection': return ColorUtils.histogramIntersection;
            default:             return ColorUtils.chiSquareDistance;
        }
    }

    static _getFormulaString(metric) {
        switch (metric) {
            case 'chi-square':   return 'χ² = Σ((pᵢ - qᵢ)² / (pᵢ + qᵢ + ε))';
            case 'euclidean':    return 'd = sqrt(Σ(pᵢ - qᵢ)²)';
            case 'manhattan':    return 'd = Σ|pᵢ - qᵢ|';
            case 'intersection': return 'I = Σ min(pᵢ, qᵢ) / Σ pᵢ';
            default:             return '';
        }
    }
}
