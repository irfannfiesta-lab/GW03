/**
 * ABR Engine — Attribute-Based Retrieval
 * 
 * Searches using weighted combination of color attributes:
 *   Score = Σ wₖ × normalized_distance(queryₖ, dbₖ)
 * 
 * Attributes:
 *   - Dominant Color (Euclidean RGB distance)
 *   - Temperature (|Tq - Td|)
 *   - Colorfulness (|Cq - Cd| / max_C)
 *   - Saturation (|Sq - Sd| / 100)
 */

import { CONFIG } from '../config.js';

export class ABREngine {

    /**
     * Search database by attribute matching
     * @param {Object} queryAttrs - { dominantRgb:[r,g,b], temperature:0-1, colorfulness:0-100, saturation:0-100 }
     * @param {Array} database - Students with color feature data
     * @param {Object} weights - Custom weights (optional, defaults to CONFIG)
     * @returns {{ results: Array, log: string }}
     */
    static search(queryAttrs, database, weights = null) {
        const w = weights || CONFIG.ABR_WEIGHTS;
        let log = `// ABR Search — Weighted Attribute Matching\n`;
        log += `// Weights: color=${w.dominant_color}, temp=${w.temperature}, `;
        log += `colorfulness=${w.colorfulness}, saturation=${w.saturation}\n`;
        log += `// Query attributes:\n`;
        log += `//   Dominant Color: RGB(${queryAttrs.dominantRgb?.join(',') || '?'})\n`;
        log += `//   Temperature: ${queryAttrs.temperature?.toFixed(2) || '?'}\n`;
        log += `//   Colorfulness: ${queryAttrs.colorfulness?.toFixed(2) || '?'}\n`;
        log += `//   Saturation: ${queryAttrs.saturation?.toFixed(2) || '?'}\n\n`;

        const scored = database.map(student => {
            const distances = {};

            // 1. Dominant Color Distance (Euclidean in RGB, normalized to [0,1])
            const maxRGBDist = Math.sqrt(255**2 * 3); // ~441
            const dbDomColor = this._getDominantRgb(student);
            if (queryAttrs.dominantRgb && dbDomColor) {
                const d = Math.sqrt(
                    (queryAttrs.dominantRgb[0] - dbDomColor[0]) ** 2 +
                    (queryAttrs.dominantRgb[1] - dbDomColor[1]) ** 2 +
                    (queryAttrs.dominantRgb[2] - dbDomColor[2]) ** 2
                );
                distances.dominant_color = d / maxRGBDist;
            } else {
                distances.dominant_color = 1;
            }

            // 2. Temperature Distance
            const dbTemp = student.temperature_score ?? 0.5;
            distances.temperature = Math.abs((queryAttrs.temperature ?? 0.5) - dbTemp);

            // 3. Colorfulness Distance (normalized by max possible ~150)
            const dbColorfulness = student.colorfulness ?? 0;
            distances.colorfulness = Math.abs((queryAttrs.colorfulness ?? 50) - dbColorfulness) / 150;

            // 4. Saturation Distance
            const dbSat = student.avg_saturation ?? 50;
            distances.saturation = Math.abs((queryAttrs.saturation ?? 50) - dbSat) / 100;

            // Weighted sum
            const totalDistance = 
                w.dominant_color * distances.dominant_color +
                w.temperature * distances.temperature +
                w.colorfulness * distances.colorfulness +
                w.saturation * distances.saturation;

            const score = 1 - totalDistance;

            return { student, score: Math.max(0, score), distance: totalDistance, distances };
        });

        scored.sort((a, b) => b.score - a.score);

        log += `// Score = 1 - Σ(wₖ × dist_k)\n`;
        log += '// Results:\n';
        scored.slice(0, 10).forEach((r, i) => {
            log += `//  ${i + 1}. ${r.student.name}: score=${r.score.toFixed(4)}\n`;
            log += `//     color_dist=${r.distances.dominant_color.toFixed(4)}, `;
            log += `temp_dist=${r.distances.temperature.toFixed(4)}, `;
            log += `color_dist=${r.distances.colorfulness.toFixed(4)}, `;
            log += `sat_dist=${r.distances.saturation.toFixed(4)}\n`;
        });

        return { results: scored, log };
    }

    /**
     * Extract dominant RGB from student's color data
     */
    static _getDominantRgb(student) {
        const dc = student.dominant_colors;
        if (dc && dc.length > 0) {
            return dc[0].rgb || null;
        }
        // Fallback: use mean color
        if (student.mean_r != null) {
            return [student.mean_r, student.mean_g, student.mean_b];
        }
        return null;
    }
}
