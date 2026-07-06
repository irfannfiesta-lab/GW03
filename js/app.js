/**
 * App Controller — Main application orchestrator
 * ChromaSeek
 * 
 * Coordinates: UploadHandler → ColorExtractor/ImageAnalyzer → Engines → ResultsRenderer
 */

import { CONFIG } from './config.js?v=5';
import { ColorExtractor } from './core/ColorExtractor.js?v=5';
import { ImageAnalyzer } from './core/ImageAnalyzer.js?v=5';
import { TBREngine } from './engines/TBREngine.js?v=5';
import { CBREngine } from './engines/CBREngine.js?v=5';
import { ABREngine } from './engines/ABREngine.js?v=5';
import { UploadHandler } from './ui/UploadHandler.js?v=5';
import { HistogramRenderer } from './ui/HistogramRenderer.js?v=5';
import { ResultsRenderer } from './ui/ResultsRenderer.js?v=5';
import { UIManager } from './ui/UIManager.js?v=5';
import { StudentDatabase } from './data/StudentDatabase.js?v=5';

class App {
    constructor() {
        this.db = new StudentDatabase();
        this.ui = new UIManager();
        this.uploadHandler = null;
        this.currentFeatures = null;
        this.currentAnalysis = null;
        this.currentHistogram = null;
        this.currentSelectedStudentId = null;
        this.galleryOffset = 0;
        this.galleryLimit = 20;
    }

    async init() {
        console.log('[App] Initializing Color Retrieval System...');

        // Init UI tabs
        this.ui.initTabs();
        this.ui.switchTab('tbr');
        this.ui.showStatus('Loading student database...', 'info');

        // Load student data
        await this.db.load();
        this.ui.showStatus(`Loaded ${this.db.students.length} students`, 'success');

        // Init upload handler
        this._initUploader();

        // Init search buttons
        this._initSearchButtons();

        // Init batch analyzer
        this._initBatchAnalyzer();

        // Bind pagination buttons
        const btnPrev = document.getElementById('btn-gallery-prev');
        const btnNext = document.getElementById('btn-gallery-next');
        
        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                if (this.galleryOffset >= this.galleryLimit) {
                    this.galleryOffset -= this.galleryLimit;
                    this._renderGallery();
                }
            });
        }
        
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                this.galleryOffset += this.galleryLimit;
                this._renderGallery();
            });
        }
        
        // Init gallery panel
        this._renderGallery();

        // Listen for student selection events
        document.addEventListener('student-selected', (e) => {
            this._onStudentSelected(e.detail);
        });

        console.log('[App] Ready!');
    }

    // ─── Upload & Extraction ───────────────────────────────

    _initUploader() {
        const uploadZone = document.getElementById('upload-zone');
        const previewImg = document.getElementById('preview-img');
        const fileInput = document.getElementById('file-input');

        if (!uploadZone || !previewImg || !fileInput) {
            console.warn('[App] Upload elements not found');
            return;
        }

        this.uploadHandler = new UploadHandler(uploadZone, previewImg, fileInput);

        this.uploadHandler.onImageLoaded = (pixels, width, height, imgEl) => {
            this.ui.showStatus('Extracting color features...', 'info');

            // Run extraction in a microtask to avoid blocking UI
            requestAnimationFrame(() => {
                try {
                    // Extract color features
                    this.currentFeatures = ColorExtractor.extractAll(pixels, width, height);
                    this.currentHistogram = this.currentFeatures.histogram;

                    // Read UI options
                    const disableHijab = document.getElementById('disable-hijab')?.checked || false;

                    // Run image analysis
                    this.currentAnalysis = ImageAnalyzer.analyze(pixels, width, height, { disableHijab });

                    // Render results
                    this._renderExtractionResults();

                    // Save to database if it's a gallery student
                    if (this.currentSelectedStudentId) {
                        this.db.saveAnalysis(this.currentSelectedStudentId, this.currentFeatures, this.currentAnalysis)
                            .then(() => console.log('[App] Analysis saved for student', this.currentSelectedStudentId))
                            .catch(e => console.error('[App] Failed to save analysis:', e));
                    }

                    this.ui.showStatus('Feature extraction complete!', 'success');
                } catch (err) {
                    console.error('[App] Extraction failed:', err);
                    this.ui.showStatus('Extraction error: ' + err.message, 'error');
                }
            });
        };

        // Sample image button
        const sampleBtn = document.getElementById('btn-sample');
        if (sampleBtn) {
            sampleBtn.addEventListener('click', () => {
                this.uploadHandler.generateSampleImage();
            });
        }

        // Upload image trigger button
        const uploadTriggerBtn = document.getElementById('btn-upload-trigger');
        const triggerFileInput = document.getElementById('file-input');
        if (uploadTriggerBtn && triggerFileInput) {
            uploadTriggerBtn.addEventListener('click', () => {
                this.currentSelectedStudentId = null; // Clear selection on manual upload
                triggerFileInput.click();
            });
        }

        // Hijab toggle listener to re-analyze
        const disableHijabCb = document.getElementById('disable-hijab');
        if (disableHijabCb) {
            disableHijabCb.addEventListener('change', () => {
                if (this.uploadHandler.currentImage) {
                    this.uploadHandler._extractPixels(this.uploadHandler.currentImage);
                }
            });
        }
    }

    _renderExtractionResults() {
        // Histogram
        const histCanvas = document.getElementById('histogram-canvas');
        if (histCanvas && this.currentHistogram) {
            HistogramRenderer.draw(histCanvas, this.currentHistogram);
        }

        // Dominant colors
        const colorsContainer = document.getElementById('dominant-colors');
        if (colorsContainer && this.currentFeatures) {
            ResultsRenderer.renderDominantColors(colorsContainer, this.currentFeatures.dominantColors);
        }

        // Feature stats
        const featuresContainer = document.getElementById('feature-stats');
        if (featuresContainer && this.currentFeatures) {
            ResultsRenderer.renderFeatures(featuresContainer, this.currentFeatures);
        }

        // Image analysis
        const analysisContainer = document.getElementById('image-analysis');
        if (analysisContainer) {
            ResultsRenderer.renderAnalysis(analysisContainer, this.currentAnalysis);
        }
    }

    // ─── Batch DB Analyzer ─────────────────────────────────

    _initBatchAnalyzer() {
        const btnAnalyze = document.getElementById('btn-analyze-all');
        if (!btnAnalyze) return;

        btnAnalyze.addEventListener('click', async () => {
            const studentsToAnalyze = this.db.students.filter(s => !s.histogram_r || s.histogram_r.length === 0);
            
            if (studentsToAnalyze.length === 0) {
                this.ui.showStatus('All students are already analyzed!', 'success');
                return;
            }

            btnAnalyze.disabled = true;
            let count = 0;
            const total = studentsToAnalyze.length;

            const hiddenCanvas = document.createElement('canvas');
            const hiddenCtx = hiddenCanvas.getContext('2d', { willReadFrequently: true });

            for (const student of studentsToAnalyze) {
                count++;
                this.ui.showStatus(`Batch analyzing ${count}/${total}: ${student.name}...`, 'info');
                
                try {
                    await new Promise((resolve, reject) => {
                        if (!student.photo_url) return resolve();
                        
                        const img = new Image();
                        img.crossOrigin = 'Anonymous';
                        img.onload = async () => {
                            try {
                                const maxDim = 300;
                                let w = img.width, h = img.height;
                                if (w > maxDim || h > maxDim) {
                                    const ratio = Math.min(maxDim / w, maxDim / h);
                                    w = Math.round(w * ratio);
                                    h = Math.round(h * ratio);
                                }
                                hiddenCanvas.width = w;
                                hiddenCanvas.height = h;
                                hiddenCtx.drawImage(img, 0, 0, w, h);
                                
                                const pixels = hiddenCtx.getImageData(0, 0, w, h).data;
                                const features = ColorExtractor.extractAll(pixels, w, h);
                                const analysis = ImageAnalyzer.analyze(pixels, w, h, { disableHijab: false });
                                
                                await this.db.saveAnalysis(student.id, features, analysis);
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        };
                        img.onerror = () => reject(new Error('Image failed to load'));
                        img.src = `${CONFIG.API_PROXY}?url=${encodeURIComponent(student.photo_url)}`;
                    });
                } catch (e) {
                    console.error('[Batch] Failed to analyze student:', student.id, e);
                }
            }

            this.ui.showStatus(`Batch analysis complete! Reloading database...`, 'success');
            await this.db.load();
            this.ui.showStatus(`Batch analysis fully complete! ${count} images processed.`, 'success');
            btnAnalyze.disabled = false;
        });
    }

    // ─── Search ────────────────────────────────────────────

    _initSearchButtons() {
        // TBR Search
        const tbrBtn = document.getElementById('btn-tbr-search');
        if (tbrBtn) {
            tbrBtn.addEventListener('click', () => this._runTBRSearch());
        }

        // CBR Search
        const cbrBtn = document.getElementById('btn-cbr-search');
        if (cbrBtn) {
            cbrBtn.addEventListener('click', () => this._runCBRSearch());
        }

        // ABR Search
        const abrBtn = document.getElementById('btn-abr-search');
        if (abrBtn) {
            abrBtn.addEventListener('click', () => this._runABRSearch());
        }
    }

    _runTBRSearch() {
        const queryInput = document.getElementById('tbr-query');
        const metricSelect = document.getElementById('tbr-metric');
        if (!queryInput) return;

        const query = queryInput.value.trim();
        if (!query) {
            this.ui.showStatus('Please enter search keywords', 'warning');
            return;
        }

        const metric = metricSelect?.value || 'cosine';
        this.ui.showStatus(`TBR Search: "${query}" using ${metric}...`, 'info');

        const { results, log } = TBREngine.search(query, this.db.students, metric);

        // Render
        const resultsContainer = document.getElementById('search-results');
        const logContainer = document.getElementById('computation-log');
        const tableContainer = document.getElementById('results-table');

        if (resultsContainer) ResultsRenderer.renderCards(resultsContainer, results, CONFIG.API_PROXY);
        if (logContainer) ResultsRenderer.renderLog(logContainer, log);
        if (tableContainer) ResultsRenderer.renderTable(tableContainer, results, metric);

        const matchCount = results.filter(r => r.score > 0).length;
        this.ui.showStatus(`TBR: Found ${matchCount} matches for "${query}"`, 'success');

        // Log search
        if (results.length > 0 && results[0].score > 0) {
            this.db.logSearch('TBR', query, metric, matchCount, results[0].student.id, results[0].score);
        }
    }

    _runCBRSearch() {
        if (!this.currentHistogram) {
            this.ui.showStatus('Upload an image first for CBR search', 'warning');
            return;
        }

        const metricSelect = document.getElementById('cbr-metric');
        const metric = metricSelect?.value || 'chi-square';
        this.ui.showStatus(`CBR Search using ${metric}...`, 'info');

        const studentsWithHist = this.db.students.filter(s =>
            s.histogram_r && s.histogram_r.length > 0
        );

        if (studentsWithHist.length === 0) {
            this.ui.showStatus('No students have histogram data yet. Run "Analyze All" first.', 'warning');
            return;
        }

        const { results, log } = CBREngine.search(this.currentHistogram, studentsWithHist, metric);

        const resultsContainer = document.getElementById('search-results');
        const logContainer = document.getElementById('computation-log');
        const tableContainer = document.getElementById('results-table');

        if (resultsContainer) ResultsRenderer.renderCards(resultsContainer, results, CONFIG.API_PROXY);
        if (logContainer) ResultsRenderer.renderLog(logContainer, log);
        if (tableContainer) ResultsRenderer.renderTable(tableContainer, results, metric);

        this.ui.showStatus(`CBR: Compared against ${studentsWithHist.length} images`, 'success');

        if (results.length > 0) {
            this.db.logSearch('CBR', 'image-query', metric, results.length, results[0].student.id, results[0].score);
        }
    }

    _runABRSearch() {
        if (!this.currentFeatures) {
            this.ui.showStatus('Upload an image first for ABR search', 'warning');
            return;
        }

        this.ui.showStatus('ABR Search using weighted attributes...', 'info');

        const queryAttrs = {
            dominantRgb: this.currentFeatures.dominantColors?.[0]?.rgb || [128, 128, 128],
            temperature: this.currentFeatures.temperature,
            colorfulness: this.currentFeatures.colorfulness,
            saturation: this.currentFeatures.avgSaturation,
        };

        // Read custom weights from sliders if available
        const weights = {
            dominant_color: parseFloat(document.getElementById('w-color')?.value || 0.35),
            temperature: parseFloat(document.getElementById('w-temp')?.value || 0.25),
            colorfulness: parseFloat(document.getElementById('w-colorfulness')?.value || 0.20),
            saturation: parseFloat(document.getElementById('w-saturation')?.value || 0.20),
        };

        const studentsWithFeatures = this.db.students.filter(s =>
            s.mean_r != null || (s.dominant_colors && s.dominant_colors.length > 0)
        );

        if (studentsWithFeatures.length === 0) {
            this.ui.showStatus('No students have feature data yet. Run "Analyze All" first.', 'warning');
            return;
        }

        const { results, log } = ABREngine.search(queryAttrs, studentsWithFeatures, weights);

        const resultsContainer = document.getElementById('search-results');
        const logContainer = document.getElementById('computation-log');
        const tableContainer = document.getElementById('results-table');

        if (resultsContainer) ResultsRenderer.renderCards(resultsContainer, results, CONFIG.API_PROXY);
        if (logContainer) ResultsRenderer.renderLog(logContainer, log);
        if (tableContainer) ResultsRenderer.renderTable(tableContainer, results, 'weighted-distance');

        this.ui.showStatus(`ABR: Matched ${studentsWithFeatures.length} students by attributes`, 'success');

        if (results.length > 0) {
            this.db.logSearch('ABR', 'attr-query', 'weighted', results.length, results[0].student.id, results[0].score);
        }
    }

    // ─── Gallery ───────────────────────────────────────────

    _renderGallery() {
        const galleryContainer = document.getElementById('gallery-grid');
        if (!galleryContainer) return;

        galleryContainer.innerHTML = '';
        
        const allStudents = this.db.students;
        const students = allStudents.slice(this.galleryOffset, this.galleryOffset + this.galleryLimit);

        // Update pagination buttons visibility
        const btnPrev = document.getElementById('btn-gallery-prev');
        const btnNext = document.getElementById('btn-gallery-next');
        
        if (btnPrev) {
            btnPrev.style.display = (this.galleryOffset > 0) ? 'inline-block' : 'none';
        }
        if (btnNext) {
            btnNext.style.display = (this.galleryOffset + this.galleryLimit < allStudents.length) ? 'inline-block' : 'none';
        }

        students.forEach(student => {
            const thumb = document.createElement('div');
            thumb.className = 'gallery-thumb';
            thumb.title = `${student.name}\n${student.matric_no || ''}`;

            const photoUrl = student.photo_url
                ? `${CONFIG.API_PROXY}?url=${encodeURIComponent(student.photo_url)}`
                : '';

            thumb.innerHTML = photoUrl
                ? `<img src="${photoUrl}" alt="${student.name}" loading="lazy" onerror="this.parentElement.style.background='var(--bg-primary)'">`
                : `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:var(--bg-primary);color:var(--text-muted);font-size:10px">${(student.name || '?')[0]}</div>`;

            thumb.addEventListener('click', () => {
                // Deselect all, select this
                galleryContainer.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('selected'));
                thumb.classList.add('selected');

                // Load the image for analysis
                if (student.photo_url) {
                    this.uploadHandler.loadGalleryImage(student.photo_url);
                }

                document.dispatchEvent(new CustomEvent('student-selected', { detail: student }));
            });

            galleryContainer.appendChild(thumb);
        });
    }

    _onStudentSelected(student) {
        this.currentSelectedStudentId = student.id;
        this.ui.showStatus(`Selected: ${student.name} (${student.matric_no || ''})`, 'info');

        // Render Student Profile & Metadata Dashboard
        const profileContainer = document.getElementById('student-profile-container');
        const profileContent = document.getElementById('student-profile-content');
        if (profileContainer && profileContent) {
            profileContainer.style.display = 'block';
            ResultsRenderer.renderStudentProfile(profileContent, student);
        }

        // If student already has analysis, show it
        if (student.overall_description) {
            const analysisContainer = document.getElementById('image-analysis');
            if (analysisContainer) {
                ResultsRenderer.renderAnalysis(analysisContainer, student);
            }
        }
    }
}

// ─── Bootstrap ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init().catch(err => console.error('[App] Init error:', err));
    window.app = app; // Expose for debugging
});
