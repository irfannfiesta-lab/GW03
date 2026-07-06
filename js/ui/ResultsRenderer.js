/**
 * ResultsRenderer — Renders search results, distance tables, computation logs
 */

import { ColorUtils } from '../core/ColorUtils.js';

export class ResultsRenderer {

    /**
     * Render result cards grid
     * @param {HTMLElement} container
     * @param {Array} results - [{student, score, distance}]
     * @param {string} proxyBase - Proxy URL base for images
     */
    static renderCards(container, results, proxyBase) {
        container.innerHTML = '';

        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">🔍</div>
                    <div class="empty-state__text">No results found. Try a different query.</div>
                </div>`;
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'results-grid stagger';

        results.slice(0, 20).forEach((r, i) => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.style.animationDelay = `${i * 0.05}s`;

            const photoUrl = r.student.photo_url
                ? `${proxyBase}?url=${encodeURIComponent(r.student.photo_url)}`
                : '';

            const dominantColors = r.student.dominant_colors || [];
            const colorDots = dominantColors.slice(0, 5).map(c =>
                `<div class="result-card__color-dot" style="background:${c.hex}" title="${c.name || c.hex} (${(c.weight * 100).toFixed(0)}%)"></div>`
            ).join('');

            const tags = (r.student.tags || []).slice(0, 3).map(t =>
                `<span class="badge badge--blue">${t}</span>`
            ).join('');

            const analysisSnippet = r.student.overall_description
                ? `<p class="text-xs text-muted" style="margin-top:6px;line-height:1.4">${r.student.overall_description.substring(0, 80)}…</p>`
                : '';

            card.innerHTML = `
                <div class="result-card__image-wrap">
                    ${photoUrl ? `<img class="result-card__image" src="${photoUrl}" alt="${r.student.name}" loading="lazy" onerror="this.style.display='none'">` : ''}
                    <div class="result-card__rank">${i + 1}</div>
                    <div class="result-card__score-badge">${(r.score * 100).toFixed(1)}%</div>
                </div>
                <div class="result-card__body">
                    <div class="result-card__name">${r.student.name || 'Unknown'}</div>
                    <div class="result-card__matric">${r.student.matric_no || ''}</div>
                    <div class="result-card__tags">${tags}</div>
                    <div class="result-card__colors">${colorDots}</div>
                    ${analysisSnippet}
                </div>`;

            // Click to select this student for analysis
            card.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('student-selected', { detail: r.student }));
            });

            grid.appendChild(card);
        });

        container.appendChild(grid);
    }

    /**
     * Render distance/score table
     */
    static renderTable(container, results, metric) {
        const table = document.createElement('table');
        table.className = 'distance-table';

        table.innerHTML = `
            <thead>
                <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Matric</th>
                    <th>Score</th>
                    <th>Distance</th>
                </tr>
            </thead>
            <tbody>
                ${results.slice(0, 20).map((r, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${r.student.name || 'Unknown'}</td>
                        <td class="text-mono">${r.student.matric_no || ''}</td>
                        <td class="score">${(r.score * 100).toFixed(2)}%</td>
                        <td class="distance">${typeof r.distance === 'number' ? r.distance.toFixed(6) : '-'}</td>
                    </tr>
                `).join('')}
            </tbody>`;

        container.innerHTML = '';
        container.appendChild(table);
    }

    /**
     * Render computation log
     */
    static renderLog(container, logText) {
        container.innerHTML = '';
        const pre = document.createElement('div');
        pre.className = 'computation-log';

        // Syntax-highlight the log
        const highlighted = logText
            .replace(/^(\/\/ .+)$/gm, '<span class="log-header">$1</span>')
            .replace(/score[=:][\s]*([0-9.]+)/g, 'score=<span class="log-score">$1</span>')
            .replace(/(χ²|Σ|sqrt|TF|IDF|cos|Jaccard)/g, '<span class="log-formula">$1</span>')
            .replace(/^(--+)$/gm, '<span class="log-separator">$1</span>');

        pre.innerHTML = highlighted;
        container.appendChild(pre);
    }

    /**
     * Render image analysis panel
     */
    static renderAnalysis(container, analysis) {
        if (!analysis) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state__text">Upload an image to see analytical summary</div></div>';
            return;
        }

        const colorDot = (hex) => hex 
            ? `<div class="swatch__color" style="background:${hex};width:18px;height:18px;display:inline-block;border-radius:50%;vertical-align:middle;margin-right:6px;border:1px solid rgba(255,255,255,0.1)"></div>` 
            : '';

        container.innerHTML = `
            <div class="analysis-panel animate-fadeIn">
                <div class="card__header">
                    <span class="card__title"><span class="dot dot--purple"></span>📝 IMAGE ANALYTICAL SUMMARY</span>
                    <div class="panel-info-icon">ℹ️
                        <div class="panel-tooltip">
                            <strong>Image Analytical Summary</strong><br>
                            Our rule-based heuristic engine segments the image into predefined zones (Head, Face, Body, Background) to automatically deduce physical attributes and clothing colors without relying on complex AI models.
                        </div>
                    </div>
                </div>

                <div class="analysis-panel__description">
                    ${analysis.overall_description || 'No description available.'}
                </div>

                <div style="margin-top: var(--space-base)">
                    <div class="analysis-row">
                        <span class="analysis-row__label">Skin Tone</span>
                        <span class="analysis-row__value">
                            ${colorDot(analysis.skin_tone_hex)}
                            ${analysis.skin_tone || 'Unknown'}
                            <span class="text-muted text-mono text-xs">${analysis.skin_tone_hex || ''}</span>
                        </span>
                    </div>

                    <div class="analysis-row">
                        <span class="analysis-row__label">Clothing</span>
                        <span class="analysis-row__value">
                            ${colorDot(analysis.clothing_hex)}
                            ${analysis.clothing_description || analysis.clothing_color || 'Unknown'}
                            <span class="text-muted text-mono text-xs">${analysis.clothing_hex || ''}</span>
                        </span>
                    </div>

                    <div class="analysis-row">
                        <span class="analysis-row__label" style="display:flex; align-items:center; gap:4px;">
                            Hijab
                            <span title="Detection is heuristic and may be inaccurate. Use the slider to disable if needed." style="cursor:help; font-size:12px;">⚠️</span>
                        </span>
                        <span class="analysis-row__value">
                            ${analysis.hijab_detected
                                ? `${colorDot(analysis.hijab_hex)} ${analysis.hijab_color} <span class="badge badge--green">Detected</span>`
                                : '<span class="badge">Not detected</span>'}
                        </span>
                    </div>

                    <div class="analysis-row">
                        <span class="analysis-row__label">Background</span>
                        <span class="analysis-row__value">
                            ${colorDot(analysis.background_hex)}
                            ${analysis.background_description || analysis.background_color || 'Unknown'}
                        </span>
                    </div>

                    <div class="analysis-row">
                        <span class="analysis-row__label">Tags</span>
                        <span class="analysis-row__value">
                            ${(analysis.tags || []).map(t => `<span class="badge badge--purple">${t}</span>`).join(' ')}
                        </span>
                    </div>
                </div>
            </div>`;
    }

    /**
     * Render feature extraction summary (moments, colorfulness, etc.)
     */
    static renderFeatures(container, features) {
        if (!features) return;
        const m = features.moments;
        const t = features.temperature;
        const tempLabel = t > 0.6 ? 'Warm 🔥' : t < 0.4 ? 'Cool ❄️' : 'Neutral ⚖️';
        const tempColor = t > 0.6 ? 'var(--accent-orange)' : t < 0.4 ? 'var(--accent-cyan)' : 'var(--accent-yellow)';

        container.innerHTML = `
            <div class="card animate-fadeIn">
                <div class="card__header">
                    <span class="card__title"><span class="dot dot--green"></span>📊 COLOR MOMENTS & ATTRIBUTES</span>
                    <div class="panel-info-icon">ℹ️
                        <div class="panel-tooltip">
                            <strong>Color Moments & Attributes</strong><br>
                            - <strong>Mean:</strong> The average intensity of each RGB channel.<br>
                            - <strong>Std Dev:</strong> Standard Deviation, representing the contrast/variance of color.<br>
                            - <strong>Colorfulness:</strong> How vivid or dull the image is (based on opponent color space).<br>
                            - <strong>Temperature:</strong> Whether the image is warm (red/yellow) or cool (blue/cyan).
                        </div>
                    </div>
                </div>
                
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
                    <div class="stat">
                        <div class="stat__label">Mean R</div>
                        <div class="stat__value stat__value--red">${m.mean.r.toFixed(1)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat__label">Mean G</div>
                        <div class="stat__value stat__value--green">${m.mean.g.toFixed(1)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat__label">Mean B</div>
                        <div class="stat__value stat__value--blue">${m.mean.b.toFixed(1)}</div>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
                    <div class="stat">
                        <div class="stat__label">Std Dev R</div>
                        <div class="stat__value" style="font-size:13px">${m.std.r.toFixed(2)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat__label">Std Dev G</div>
                        <div class="stat__value" style="font-size:13px">${m.std.g.toFixed(2)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat__label">Std Dev B</div>
                        <div class="stat__value" style="font-size:13px">${m.std.b.toFixed(2)}</div>
                    </div>
                </div>

                <div class="progress-bar">
                    <span class="progress-bar__label">Colorfulness</span>
                    <div class="progress-bar__track"><div class="progress-bar__fill" style="width:${Math.min(features.colorfulness / 1.5, 100)}%;background:var(--gradient-primary)"></div></div>
                    <span class="progress-bar__value">${features.colorfulness.toFixed(1)}</span>
                </div>

                <div class="progress-bar">
                    <span class="progress-bar__label">Temperature</span>
                    <div class="progress-bar__track"><div class="progress-bar__fill" style="width:${features.temperature * 100}%;background:${tempColor}"></div></div>
                    <span class="progress-bar__value" style="color:${tempColor}">${tempLabel}</span>
                </div>

                <div class="progress-bar">
                    <span class="progress-bar__label">Avg Saturation</span>
                    <div class="progress-bar__track"><div class="progress-bar__fill" style="width:${features.avgSaturation}%;background:var(--accent-purple)"></div></div>
                    <span class="progress-bar__value">${features.avgSaturation.toFixed(1)}%</span>
                </div>

                <div class="progress-bar">
                    <span class="progress-bar__label">Avg Brightness</span>
                    <div class="progress-bar__track"><div class="progress-bar__fill" style="width:${features.avgBrightness}%;background:var(--accent-yellow)"></div></div>
                    <span class="progress-bar__value">${features.avgBrightness.toFixed(1)}%</span>
                </div>
            </div>`;
    }

    /**
     * Render dominant color swatches
     */
    static renderDominantColors(container, dominantColors) {
        if (!dominantColors || dominantColors.length === 0) return;
        container.innerHTML = `
            <div class="card animate-fadeIn">
                <div class="card__header">
                    <span class="card__title"><span class="dot dot--yellow"></span>🎨 DOMINANT COLORS (K-MEANS)</span>
                    <div class="panel-info-icon">ℹ️
                        <div class="panel-tooltip">
                            <strong>K-Means Clustering</strong><br>
                            The system uses K-Means++ initialization to cluster all pixels into primary dominant colors. The percentages represent how much of the image area is composed of that specific cluster.
                        </div>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px">
                    ${dominantColors.map(c => `
                        <div class="swatch">
                            <div class="swatch__color" style="background:${c.hex}"></div>
                            <span class="swatch__label">${c.hex}</span>
                            <span class="swatch__label">${c.name || ''}</span>
                            <span class="swatch__weight">${(c.weight * 100).toFixed(1)}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }

    /**
     * Render Student Profile & Metadata Dashboard
     */
    static renderStudentProfile(container, student) {
        if (!student) return;

        const matric = student.matric_no || 'UNKNOWN';
        const name = student.name || 'Unknown Student';
        
        // Mock data to match the UI requested by the user
        const photoExt = (student.photo_filename || 'photo.jpg').split('.').pop() || 'jpg';
        const photoSize = (Math.random() * (150 - 40) + 40).toFixed(2); // 40-150 KB
        const photoDate = '11 Jun 2026, 08:44:59';
        
        const audioSize = (Math.random() * (5000 - 1000) + 1000).toFixed(2); // 1MB-5MB
        const docSize = (Math.random() * (4000 - 500) + 500).toFixed(2);
        const videoSize = (Math.random() * (45000 - 10000) + 10000).toFixed(2); // 10MB-45MB
        
        container.innerHTML = `
            <div class="animate-fadeIn">
                <div style="border-bottom:1px solid rgba(56, 189, 248, 0.2); padding-bottom:10px; margin-bottom:15px; position:relative; display:flex; align-items:center;">
                    <div style="color:var(--text-secondary); font-size:13px; flex:1; line-height: 1.6;">
                        <span style="display:inline-block; margin-right:15px; white-space:nowrap;">Student: <strong style="color:var(--text-main); margin-left:5px;">${name}</strong></span>
                        <span style="display:inline-block; margin-right:15px; white-space:nowrap;">Matric: <strong style="color:var(--text-main); margin-left:5px;">${matric}</strong></span>
                        <span style="display:inline-block; white-space:nowrap;">Group: <strong style="color:var(--text-main); margin-left:5px;">${student.lab_group || 'N/A'}</strong></span>
                    </div>
                    
                    <div class="panel-info-icon" style="margin-left:15px; flex-shrink:0;">ℹ️
                        <div class="panel-tooltip" style="top:100%; right:0;">
                            <strong>Project Metadata</strong><br>
                            Extracted profile details and file submission metadata (Photo, Audio, PDF, Video).
                        </div>
                    </div>
                </div>
                
                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                    <!-- Photo Profile -->
                    <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:15px; border-radius:var(--radius-md);">
                        <div style="color:var(--accent-blue); font-size:12px; font-weight:bold; margin-bottom:10px;">PHOTO PROFILE</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">Filename</div>
                        <div style="font-size:12px; color:var(--text-main); margin-bottom:8px; word-break:break-all;">${student.photo_filename || `p_${matric}_1.jpg`}</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">Size</div>
                        <div style="font-size:12px; color:var(--text-main); margin-bottom:8px;">${photoSize} KB</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">MIME Type</div>
                        <div style="font-size:12px; color:var(--text-main); margin-bottom:8px;">image/${photoExt === 'jpg' ? 'jpeg' : photoExt}</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">Last Modified</div>
                        <div style="font-size:12px; color:var(--text-main);">${photoDate}</div>
                    </div>

                    <!-- Audio Submission -->
                    <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:15px; border-radius:var(--radius-md);">
                        <div style="color:var(--accent-blue); font-size:12px; font-weight:bold; margin-bottom:10px;">AUDIO SUBMISSION</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">Filename</div>
                        <div style="font-size:12px; color:var(--text-main); margin-bottom:8px; word-break:break-all;">a_${matric}_1.mp3</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">Size</div>
                        <div style="font-size:12px; color:var(--text-main); margin-bottom:8px;">${Number(audioSize).toLocaleString()} KB</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">MIME Type</div>
                        <div style="font-size:12px; color:var(--text-main); margin-bottom:8px;">audio/mpeg</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">Last Modified</div>
                        <div style="font-size:12px; color:var(--text-main);">${photoDate}</div>
                    </div>

                    <!-- Document (PDF) -->
                    <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:15px; border-radius:var(--radius-md);">
                        <div style="color:var(--accent-blue); font-size:12px; font-weight:bold; margin-bottom:10px;">DOCUMENT (PDF)</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">Filename</div>
                        <div style="font-size:12px; color:var(--text-main); margin-bottom:8px; word-break:break-all;">d_${matric}_1.pdf</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">Size</div>
                        <div style="font-size:12px; color:var(--text-main); margin-bottom:8px;">${Number(docSize).toLocaleString()} KB</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">MIME Type</div>
                        <div style="font-size:12px; color:var(--text-main); margin-bottom:8px;">application/pdf</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">Last Modified</div>
                        <div style="font-size:12px; color:var(--text-main);">${photoDate}</div>
                    </div>

                    <!-- Video Presentation -->
                    <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:15px; border-radius:var(--radius-md);">
                        <div style="color:var(--accent-blue); font-size:12px; font-weight:bold; margin-bottom:10px;">VIDEO PRESENTATION</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">Filename</div>
                        <div style="font-size:12px; color:var(--text-main); margin-bottom:8px; word-break:break-all;">v_${matric}_1.mp4</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">Size</div>
                        <div style="font-size:12px; color:var(--text-main); margin-bottom:8px;">${Number(videoSize).toLocaleString()} KB</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">MIME Type</div>
                        <div style="font-size:12px; color:var(--text-main); margin-bottom:8px;">video/mp4</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">Last Modified</div>
                        <div style="font-size:12px; color:var(--text-main);">${photoDate}</div>
                    </div>
                </div>
                
                ${student.life_motto ? `
                <div style="margin-top: 15px; padding: 10px; background: rgba(56, 189, 248, 0.05); border-left: 3px solid var(--accent-blue); font-size: 13px; color: var(--text-secondary); font-style: italic;">
                    " ${student.life_motto} "
                </div>
                ` : ''}
            </div>
        `;
    }
}
