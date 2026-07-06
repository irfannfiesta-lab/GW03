/**
 * ImageAnalyzer — Analytical summary of image content
 * 
 * Detects:
 *   - Skin tone (face zone)
 *   - Clothing color & description (body zone)
 *   - Hijab presence and color (head zone)
 *   - Background color and description (edge zones)
 * 
 * Zone Layout:
 *   ┌──────────────────────┐
 *   │   BACKGROUND ZONE    │ ← Edges (outer ~12%)
 *   │  ┌──────────────┐    │
 *   │  │  HEAD ZONE   │    │ ← Top (5%-20% height)
 *   │  │  FACE ZONE   │    │ ← (20%-35% height)
 *   │  │  BODY ZONE   │    │ ← Middle-bottom (35%-90%)
 *   │  └──────────────┘    │
 *   └──────────────────────┘
 */

import { ColorUtils } from './ColorUtils.js';
import { KMeansClustering } from './KMeansClustering.js';
import { CONFIG } from '../config.js';

export class ImageAnalyzer {

    /**
     * Run full image analysis
     * @param {Uint8ClampedArray} pixels - RGBA pixel data
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @param {Object} options - Custom analysis options
     * @returns {Object} Analysis results
     */
    static analyze(pixels, width, height, options = {}) {
        // Extract zone pixels
        const bgPixels = this._extractZonePixels(pixels, width, height, 'background');
        const headPixels = this._extractZonePixels(pixels, width, height, 'head');
        const facePixels = this._extractZonePixels(pixels, width, height, 'face');
        const bodyPixels = this._extractZonePixels(pixels, width, height, 'body');

        // Get dominant colors for each zone
        const bgColors = KMeansClustering.run(bgPixels, 3, 15, 2000);
        const headColors = KMeansClustering.run(headPixels, 3, 15, 2000);
        const faceColors = KMeansClustering.run(facePixels, 3, 15, 2000);
        const bodyColors = KMeansClustering.run(bodyPixels, 3, 15, 2000);

        // --- Analyze Face (Skin Tone) ---
        let skinTone = 'unknown';
        let skinToneHex = '#000000';
        if (faceColors.clusters.length > 0) {
            // Find the cluster most likely to be skin
            const skinCluster = faceColors.clusters.find(c => 
                ColorUtils.isSkinTone(c.rgb[0], c.rgb[1], c.rgb[2])
            ) || faceColors.clusters[0];
            skinTone = ColorUtils.skinToneLabel(skinCluster.rgb[0], skinCluster.rgb[1], skinCluster.rgb[2]);
            skinToneHex = skinCluster.hex;
        }

        // --- Analyze Background ---
        let bgColor = 'unknown';
        let bgHex = '#000000';
        let bgDescription = 'unknown background';
        if (bgColors.clusters.length > 0) {
            const bgDom = bgColors.clusters[0];
            bgColor = ColorUtils.colorName(bgDom.rgb[0], bgDom.rgb[1], bgDom.rgb[2]);
            bgHex = bgDom.hex;
            bgDescription = this._describeBackground(bgDom.rgb, bgColors.clusters);
        }

        // --- Analyze Clothing (Body Zone) ---
        let clothingColor = 'unknown';
        let clothingHex = '#000000';
        let clothingDescription = 'unknown clothing';
        if (bodyColors.clusters.length > 0) {
            // Find non-skin cluster in body
            const clothCluster = bodyColors.clusters.find(c => 
                !ColorUtils.isSkinTone(c.rgb[0], c.rgb[1], c.rgb[2])
            ) || bodyColors.clusters[0];
            clothingColor = ColorUtils.colorName(clothCluster.rgb[0], clothCluster.rgb[1], clothCluster.rgb[2]);
            clothingHex = clothCluster.hex;
            clothingDescription = `${clothingColor} attire`;
        }

        // --- Detect Hijab ---
        let hijabDetected = false;
        let hijabColor = null;
        let hijabHex = null;
        if (!options.disableHijab && headColors.clusters.length > 0) {
            // Hijab is detected if the head zone dominant color differs significantly from skin
            const headDom = headColors.clusters[0];
            const headIsSkin = ColorUtils.isSkinTone(headDom.rgb[0], headDom.rgb[1], headDom.rgb[2]);
            
            if (!headIsSkin) {
                // Head zone has a non-skin dominant color = likely hijab/headwear
                hijabDetected = true;
                hijabColor = ColorUtils.colorName(headDom.rgb[0], headDom.rgb[1], headDom.rgb[2]);
                hijabHex = headDom.hex;
            }
        }

        // --- Generate Overall Description ---
        const description = this._generateDescription({
            skinTone, clothingColor, clothingDescription,
            hijabDetected, hijabColor, bgColor, bgDescription
        });

        // --- Generate Tags for TBR ---
        const tags = this._generateTags({
            skinTone, clothingColor, hijabDetected, hijabColor, bgColor
        });

        return {
            skin_tone: skinTone,
            skin_tone_hex: skinToneHex,
            clothing_color: clothingColor,
            clothing_hex: clothingHex,
            clothing_description: clothingDescription,
            hijab_detected: hijabDetected,
            hijab_color: hijabColor,
            hijab_hex: hijabHex,
            background_color: bgColor,
            background_hex: bgHex,
            background_description: bgDescription,
            overall_description: description,
            tags: tags,
            zones: {
                face: faceColors.clusters.slice(0, 3),
                head: headColors.clusters.slice(0, 3),
                body: bodyColors.clusters.slice(0, 3),
                background: bgColors.clusters.slice(0, 3),
            }
        };
    }

    /**
     * Extract pixel data for a specific zone
     */
    static _extractZonePixels(pixels, width, height, zone) {
        const result = [];
        const margin = CONFIG.ZONE_BG_MARGIN;

        let top, bottom, left, right;

        switch (zone) {
            case 'face':
                top = Math.floor(height * 0.20);
                bottom = Math.floor(height * CONFIG.ZONE_FACE_BOTTOM);
                left = Math.floor(width * CONFIG.ZONE_FACE_LEFT);
                right = Math.floor(width * CONFIG.ZONE_FACE_RIGHT);
                break;
            case 'head':
                top = Math.floor(height * CONFIG.ZONE_FACE_TOP);
                bottom = Math.floor(height * 0.22);
                left = Math.floor(width * 0.20);
                right = Math.floor(width * 0.80);
                break;
            case 'body':
                top = Math.floor(height * CONFIG.ZONE_BODY_TOP);
                bottom = Math.floor(height * CONFIG.ZONE_BODY_BOTTOM);
                left = Math.floor(width * 0.15);
                right = Math.floor(width * 0.85);
                break;
            case 'background':
                // Collect edge pixels only
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const isEdge = (
                            x < width * margin || x > width * (1 - margin) ||
                            y < height * margin || y > height * (1 - margin)
                        );
                        if (isEdge) {
                            const idx = (y * width + x) * 4;
                            result.push(pixels[idx], pixels[idx+1], pixels[idx+2], pixels[idx+3]);
                        }
                    }
                }
                return new Uint8ClampedArray(result);
            default:
                return new Uint8ClampedArray(0);
        }

        for (let y = top; y < bottom; y++) {
            for (let x = left; x < right; x++) {
                const idx = (y * width + x) * 4;
                result.push(pixels[idx], pixels[idx+1], pixels[idx+2], pixels[idx+3]);
            }
        }
        return new Uint8ClampedArray(result);
    }

    /**
     * Describe the background based on color analysis
     */
    static _describeBackground(dominantRgb, allClusters) {
        const { s, l } = ColorUtils.rgbToHsl(dominantRgb[0], dominantRgb[1], dominantRgb[2]);
        const name = ColorUtils.colorName(dominantRgb[0], dominantRgb[1], dominantRgb[2]);

        // Check color variance to determine if studio or natural
        if (allClusters.length >= 2) {
            const topWeight = allClusters[0].weight;
            if (topWeight > 0.6 && s > 0.3) {
                return `${name} studio backdrop`;
            }
            if (topWeight > 0.6 && s < 0.15) {
                return `${name} plain background`;
            }
        }

        if (dominantRgb[1] > 100 && dominantRgb[0] < 120) {
            return `outdoor/nature scene with ${name} tones`;
        }

        return `${name} background`;
    }

    /**
     * Generate natural language description
     */
    static _generateDescription({ skinTone, clothingColor, clothingDescription, hijabDetected, hijabColor, bgColor, bgDescription }) {
        let desc = `Person with ${skinTone} skin tone`;

        if (hijabDetected && hijabColor) {
            desc += `, wearing a ${hijabColor} hijab`;
        }

        desc += ` and ${clothingDescription}`;
        desc += `. The background is ${bgDescription}.`;

        return desc;
    }

    /**
     * Generate keyword tags for text-based retrieval
     */
    static _generateTags({ skinTone, clothingColor, hijabDetected, hijabColor, bgColor }) {
        const tags = [skinTone, clothingColor, bgColor, 'portrait', 'student'];
        if (hijabDetected) {
            tags.push('hijab', hijabColor);
        }
        // Add individual color words
        [clothingColor, bgColor, hijabColor].forEach(color => {
            if (color) {
                color.split(' ').forEach(word => {
                    if (word.length > 2 && !tags.includes(word)) tags.push(word);
                });
            }
        });
        return tags.filter(Boolean);
    }
}
