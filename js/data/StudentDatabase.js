/**
 * StudentDatabase — Fetches and manages student data
 * Loads from PHP API, falls back to hardcoded data
 */

import { CONFIG } from '../config.js';

export class StudentDatabase {

    constructor() {
        this.students = [];
        this.loaded = false;
    }

    /**
     * Load students from API, with fallback
     * @returns {Promise<Array>}
     */
    async load() {
        try {
            const response = await fetch(CONFIG.API_STUDENTS);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            this.students = data.students || [];
            this.loaded = true;
            console.log(`[StudentDB] Loaded ${this.students.length} students from API`);
        } catch (err) {
            console.warn('[StudentDB] API failed, using fallback data:', err.message);
            this.students = this._getFallbackData();
            this.loaded = true;
        }
        return this.students;
    }

    /**
     * Get all students
     */
    getAll() {
        return this.students;
    }

    /**
     * Get student by ID
     */
    getById(id) {
        return this.students.find(s => s.id == id);
    }

    /**
     * Save analysis results to API
     */
    async saveAnalysis(studentId, colorFeatures, imageAnalysis) {
        try {
            // Flatten the features object to match what save_analysis.php expects
            const flatFeatures = {
                histogram_r: colorFeatures.histogram.r,
                histogram_g: colorFeatures.histogram.g,
                histogram_b: colorFeatures.histogram.b,
                mean_r: colorFeatures.moments.meanR,
                mean_g: colorFeatures.moments.meanG,
                mean_b: colorFeatures.moments.meanB,
                std_r: colorFeatures.moments.stdR,
                std_g: colorFeatures.moments.stdG,
                std_b: colorFeatures.moments.stdB,
                skew_r: colorFeatures.moments.skewR,
                skew_g: colorFeatures.moments.skewG,
                skew_b: colorFeatures.moments.skewB,
                dominant_colors: colorFeatures.dominantColors,
                colorfulness: colorFeatures.colorfulness,
                temperature_score: colorFeatures.temperature,
                temperature_label: imageAnalysis.temperature_label || 'neutral',
                avg_saturation: colorFeatures.avgSaturation,
                avg_brightness: colorFeatures.avgBrightness
            };

            const response = await fetch(CONFIG.API_SAVE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: studentId,
                    color_features: flatFeatures,
                    image_analysis: imageAnalysis,
                }),
            });
            const result = await response.json();
            
            // Update in memory so subsequent searches work immediately
            const student = this.getById(studentId);
            if (student) {
                Object.assign(student, flatFeatures);
            }
            
            return result;
        } catch (err) {
            console.error('[StudentDB] Save failed:', err);
            return { error: err.message };
        }
    }

    /**
     * Log a search query
     */
    async logSearch(searchType, queryText, metric, resultsCount, topResultId, topScore) {
        try {
            await fetch(CONFIG.API_SEARCH_LOG, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    search_type: searchType,
                    query_text: queryText,
                    metric_used: metric,
                    results_count: resultsCount,
                    top_result_id: topResultId,
                    top_result_score: topScore,
                }),
            });
        } catch (err) {
            console.warn('[StudentDB] Log failed:', err);
        }
    }

    /**
     * Fallback student data (when API is unavailable)
     */
    _getFallbackData() {
        return [
            { id: 1, gallery_id: 119, name: 'Nurin Zuhairah Binti Azhar',     matric_no: 'B032420131', photo_url: 'uploads/p_B032420131_1.jpg', dominant_colors: [], tags: ['portrait','student','hijab'] },
            { id: 2, gallery_id: 118, name: 'Umar Ashraffi bin Adnan',        matric_no: 'B032310374', photo_url: 'uploads/B032310374_20260611_054653_matric card.jpg', dominant_colors: [], tags: ['portrait','student'] },
            { id: 3, gallery_id: 117, name: 'NUR WAHIDA BINTI NORIZIADY',     matric_no: 'B032310134', photo_url: 'uploads/p_B032310134_1.jpg', dominant_colors: [], tags: ['portrait','student','hijab'] },
            { id: 4, gallery_id: 116, name: 'NUR ELIZA BINTI ANTHONY',        matric_no: 'B032310619', photo_url: 'uploads/B032310619_20260611_042838_WhatsApp Image 2026-06-11 at 12.27.18 PM.jpeg', dominant_colors: [], tags: ['portrait','student'] },
            { id: 5, gallery_id: 111, name: 'Nik Arlina binti Nik Abdul Rahman', matric_no: 'B032310739', photo_url: 'uploads/p_B032310739_1.jpeg', dominant_colors: [], tags: ['portrait','student','hijab'] },
            { id: 6, gallery_id: 110, name: 'AIN SURIANI BINTI ZULKEFLI',     matric_no: 'B032410183', photo_url: 'uploads/B032410183_20260610_115658_AIN.jpeg', dominant_colors: [], tags: ['portrait','student','hijab'] },
            { id: 7, gallery_id: 109, name: 'NURUL AIN NASUHA BINTI REDUAN',  matric_no: 'B032410176', photo_url: 'uploads/p_B032410176_1.jpg', dominant_colors: [], tags: ['portrait','student','hijab'] },
            { id: 8, gallery_id: 108, name: 'NUR SYARMIMI ALIA HUSNA BINTI ZAIPOLBAHARI', matric_no: 'B032310381', photo_url: 'uploads/p_B032310381_1.jpg', dominant_colors: [], tags: ['portrait','student','hijab'] },
            { id: 9, gallery_id: 103, name: 'MIZA BINTI MOHAMAD RADZI',       matric_no: 'B032310641', photo_url: 'uploads/p_B032310641_1.jpeg', dominant_colors: [], tags: ['portrait','student','hijab'] },
            { id: 10, gallery_id: 102, name: 'HENG HUEY JIN',                 matric_no: 'B032420041', photo_url: 'uploads/p_B032420041_1.jpeg', dominant_colors: [], tags: ['portrait','student'] },
            { id: 11, gallery_id: 101, name: 'MIYA AOYON',                    matric_no: 'B032220052', photo_url: 'uploads/p_B032220052_1.jpeg', dominant_colors: [], tags: ['portrait','student'] },
            { id: 12, gallery_id: 100, name: 'Muhammad Rukaini Aidil',        matric_no: 'B032410200', photo_url: 'uploads/B032410200_20260521_055841_IMG_1406.png', dominant_colors: [], tags: ['portrait','student'] },
            { id: 13, gallery_id: 95,  name: 'Fatin Nur Faqihah Bt Md Radzi', matric_no: 'B032310211', photo_url: 'uploads/p_B032310211_1.JPG', dominant_colors: [], tags: ['portrait','student','hijab'] },
            { id: 14, gallery_id: 94,  name: 'Nureen Amini Binti Fairuz',     matric_no: 'B032420127', photo_url: 'uploads/p_B032420127_1.jpeg', dominant_colors: [], tags: ['portrait','student','hijab'] },
            { id: 15, gallery_id: 93,  name: 'MOHAMAD ZARIL AIDID BIN RASHID', matric_no: 'B032420059', photo_url: 'uploads/p_B032420059_1.jpeg', dominant_colors: [], tags: ['portrait','student'] },
            { id: 16, gallery_id: 92,  name: 'SHARIFAH YASMIN BINTI SYD KHALIL', matric_no: 'B032310193', photo_url: 'uploads/p_B032310193_1.jpeg', dominant_colors: [], tags: ['portrait','student','hijab'] },
            { id: 17, gallery_id: 90,  name: 'MARSYA KAMILIA BINTI YUSRIZAL', matric_no: 'B032310514', photo_url: 'uploads/1779275687_WhatsApp Image 2026-05-20 at 6.50.06 PM.jpeg', dominant_colors: [], tags: ['portrait','student','hijab'] },
            { id: 18, gallery_id: 89,  name: 'SITI NURATIQAH BINTI ABU BAKAR', matric_no: 'B032310424', photo_url: 'uploads/1779272491_64262.jpg', dominant_colors: [], tags: ['portrait','student','hijab'] },
            { id: 19, gallery_id: 84,  name: 'AMEERAH MAISARAH BINTI ROSZAINI', matric_no: 'B032310648', photo_url: 'uploads/1779250207_BA63B6BA-CAF0-412F-97F6-F2A99F427238.png', dominant_colors: [], tags: ['portrait','student','hijab'] },
            { id: 20, gallery_id: 91,  name: 'Hidayah',                       matric_no: 'B0231241',   photo_url: 'uploads/p_B0231241_1.gif', dominant_colors: [], tags: ['portrait','student'] },
        ];
    }
}
