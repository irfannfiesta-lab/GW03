/**
 * UIManager — Tab switching, panel coordination, status updates
 */

export class UIManager {

    constructor() {
        this.currentTab = 'tbr';
        this.tabs = {};
        this.panels = {};
    }

    /**
     * Initialize tab switching
     */
    initTabs() {
        const tabButtons = document.querySelectorAll('.tab[data-tab]');
        tabButtons.forEach(btn => {
            const tabName = btn.dataset.tab;
            this.tabs[tabName] = btn;

            btn.addEventListener('click', () => {
                this.switchTab(tabName);
            });
        });

        // Initialize panels
        document.querySelectorAll('.tab-panel[data-panel]').forEach(panel => {
            this.panels[panel.dataset.panel] = panel;
        });
    }

    /**
     * Switch to a specific tab
     */
    switchTab(tabName) {
        // Update tab buttons
        Object.values(this.tabs).forEach(t => t.classList.remove('active'));
        if (this.tabs[tabName]) this.tabs[tabName].classList.add('active');

        // Update panels
        Object.values(this.panels).forEach(p => p.style.display = 'none');
        if (this.panels[tabName]) this.panels[tabName].style.display = 'block';

        this.currentTab = tabName;

        // Update formula display
        this.updateFormulaDisplay(tabName);

        // Dispatch event
        document.dispatchEvent(new CustomEvent('tab-changed', { detail: tabName }));
    }

    /**
     * Update the formula display based on active retrieval mode
     */
    updateFormulaDisplay(mode) {
        const formulaEl = document.getElementById('formula-display');
        if (!formulaEl) return;

        const formulas = {
            tbr: {
                title: 'Text-Based Retrieval (TBR)',
                desc: 'TF-IDF with Cosine Similarity',
                math: 'TF(w,d) = freq(w,d) / |d|  •  IDF(w) = log(N / df(w))  •  sim(q,d) = (q·d) / (||q||·||d||)'
            },
            cbr: {
                title: 'Content-Based Retrieval (CBR)',
                desc: 'Histogram Comparison',
                math: 'χ²(H₁,H₂) = Σᵢ (H₁(i) - H₂(i))² / (H₁(i) + H₂(i) + ε)'
            },
            abr: {
                title: 'Attribute-Based Retrieval (ABR)',
                desc: 'Weighted Multi-Attribute Matching',
                math: 'Score = 1 - Σₖ wₖ × |attr_q(k) - attr_d(k)| / range(k)'
            }
        };

        const f = formulas[mode] || formulas.tbr;
        formulaEl.innerHTML = `
            <div class="card__header">
                <span class="card__title"><span class="dot dot--blue"></span>${f.title}</span>
            </div>
            <p class="text-muted text-sm" style="margin-bottom:8px">${f.desc}</p>
            <pre style="font-size:11px;padding:10px;margin:0">${f.math}</pre>`;
    }

    /**
     * Show a status message
     */
    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('status-bar');
        if (!statusEl) return;

        const colors = {
            info: 'var(--accent-blue)',
            success: 'var(--accent-green)',
            error: 'var(--accent-red)',
            warning: 'var(--accent-yellow)',
        };

        statusEl.style.borderLeftColor = colors[type] || colors.info;
        statusEl.textContent = message;
        statusEl.classList.add('animate-fadeIn');

        setTimeout(() => statusEl.classList.remove('animate-fadeIn'), 500);
    }

    /**
     * Show/hide loading spinner on a button
     */
    setButtonLoading(btn, loading) {
        if (loading) {
            btn.dataset.originalText = btn.textContent;
            btn.innerHTML = '<span class="spinner"></span> Processing...';
            btn.disabled = true;
        } else {
            btn.textContent = btn.dataset.originalText || 'Search';
            btn.disabled = false;
        }
    }
}
