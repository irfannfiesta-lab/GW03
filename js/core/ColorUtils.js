/**
 * ColorUtils — Color space conversions and distance metrics
 * 
 * Mathematical Foundation:
 *   RGB → HSV: Standard cylindrical conversion
 *   RGB → Hex: Channel-wise hex encoding
 *   Distance Metrics: Euclidean, Chi-Square, Manhattan, Histogram Intersection
 */
export class ColorUtils {

    // ─── Color Space Conversions ───────────────────────────

    /**
     * RGB → HSV conversion
     * H: [0,360], S: [0,1], V: [0,1]
     */
    static rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const d = max - min;
        let h = 0, s = max === 0 ? 0 : d / max, v = max;

        if (d !== 0) {
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return { h: h * 360, s, v };
    }

    /** RGB → HSL */
    static rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const l = (max + min) / 2;
        let h = 0, s = 0;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return { h: h * 360, s, l };
    }

    /** RGB → Hex */
    static rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(c => 
            Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')
        ).join('');
    }

    /** Hex → RGB */
    static hexToRgb(hex) {
        hex = hex.replace('#', '');
        return {
            r: parseInt(hex.substr(0, 2), 16),
            g: parseInt(hex.substr(2, 2), 16),
            b: parseInt(hex.substr(4, 2), 16),
        };
    }

    // ─── Distance Metrics ──────────────────────────────────

    /**
     * Euclidean Distance: d = sqrt(Σ(pi - qi)²)
     */
    static euclideanDistance(a, b) {
        let sum = 0;
        const len = Math.min(a.length, b.length);
        for (let i = 0; i < len; i++) {
            sum += (a[i] - b[i]) ** 2;
        }
        return Math.sqrt(sum);
    }

    /**
     * Chi-Square Distance: χ² = Σ((pi - qi)² / (pi + qi + ε))
     */
    static chiSquareDistance(a, b) {
        let sum = 0;
        const eps = 1e-10;
        const len = Math.min(a.length, b.length);
        for (let i = 0; i < len; i++) {
            const denom = a[i] + b[i] + eps;
            sum += ((a[i] - b[i]) ** 2) / denom;
        }
        return sum;
    }

    /**
     * Manhattan Distance: d = Σ|pi - qi|
     */
    static manhattanDistance(a, b) {
        let sum = 0;
        const len = Math.min(a.length, b.length);
        for (let i = 0; i < len; i++) {
            sum += Math.abs(a[i] - b[i]);
        }
        return sum;
    }

    /**
     * Histogram Intersection: I = Σ min(pi, qi)
     * Higher = more similar (normalize by dividing by sum of min histogram)
     */
    static histogramIntersection(a, b) {
        let intersection = 0;
        let sumA = 0;
        const len = Math.min(a.length, b.length);
        for (let i = 0; i < len; i++) {
            intersection += Math.min(a[i], b[i]);
            sumA += a[i];
        }
        return sumA > 0 ? intersection / sumA : 0;
    }

    // ─── Color Name Mapping ────────────────────────────────

    /**
     * Maps RGB to a human-readable color name
     * Uses HSL for perceptual mapping
     */
    static colorName(r, g, b) {
        const { h, s, l } = this.rgbToHsl(r, g, b);

        // Achromatic check
        if (s < 0.10) {
            if (l < 0.15) return 'black';
            if (l < 0.35) return 'dark grey';
            if (l < 0.65) return 'grey';
            if (l < 0.85) return 'light grey';
            return 'white';
        }

        // Chromatic — map hue to name
        let name = '';
        if (h < 15)  name = 'red';
        else if (h < 40)  name = 'orange';
        else if (h < 65)  name = 'yellow';
        else if (h < 80)  name = 'yellow-green';
        else if (h < 160) name = 'green';
        else if (h < 190) name = 'cyan';
        else if (h < 260) name = 'blue';
        else if (h < 290) name = 'purple';
        else if (h < 330) name = 'pink';
        else name = 'red';

        // Add lightness modifier
        if (l < 0.25) return 'dark ' + name;
        if (l > 0.75) return 'light ' + name;
        return name;
    }

    /**
     * Classify skin tone from RGB
     */
    static skinToneLabel(r, g, b) {
        const { l } = this.rgbToHsl(r, g, b);
        if (l > 0.78) return 'very fair';
        if (l > 0.65) return 'fair';
        if (l > 0.52) return 'light';
        if (l > 0.40) return 'medium';
        if (l > 0.28) return 'tan';
        if (l > 0.18) return 'brown';
        return 'dark brown';
    }

    /**
     * Determine if a color looks like a skin tone
     */
    static isSkinTone(r, g, b) {
        // Skin tone heuristic: R > G > B, certain hue range
        const { h, s, l } = this.rgbToHsl(r, g, b);
        return (
            r > 60 && g > 30 && b > 15 &&
            r > g && g > b &&
            h >= 0 && h <= 50 &&
            s >= 0.1 && s <= 0.8 &&
            l >= 0.15 && l <= 0.85
        );
    }
}
