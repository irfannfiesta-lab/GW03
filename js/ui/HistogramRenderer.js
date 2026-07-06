/**
 * HistogramRenderer — Canvas-based color histogram visualization
 */

export class HistogramRenderer {

    /**
     * Draw RGB histogram overlay on a canvas
     * @param {HTMLCanvasElement} canvas
     * @param {{ r: number[], g: number[], b: number[] }} histogram - Normalized histograms
     */
    static draw(canvas, histogram) {
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        const bins = histogram.r.length || 256;

        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = '#0d1321';
        ctx.fillRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const y = (H / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // Find max value for scaling
        let maxVal = 0;
        for (let i = 0; i < bins; i++) {
            maxVal = Math.max(maxVal, histogram.r[i] || 0, histogram.g[i] || 0, histogram.b[i] || 0);
        }
        if (maxVal === 0) maxVal = 1;

        const barWidth = W / bins;
        const padding = 6;

        // Draw each channel
        const channels = [
            { data: histogram.r, color: 'rgba(248, 113, 113, 0.6)', label: 'R' },
            { data: histogram.g, color: 'rgba(52, 211, 153, 0.6)',  label: 'G' },
            { data: histogram.b, color: 'rgba(56, 189, 248, 0.6)',  label: 'B' },
        ];

        channels.forEach(ch => {
            ctx.fillStyle = ch.color;
            ctx.beginPath();
            ctx.moveTo(0, H - padding);

            for (let i = 0; i < bins; i++) {
                const val = ch.data[i] || 0;
                const barH = (val / maxVal) * (H - 2 * padding);
                const x = i * barWidth;
                const y = H - padding - barH;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(W, H - padding);
            ctx.closePath();
            ctx.fill();
        });

        // Legend
        const legendX = W - 90;
        channels.forEach((ch, i) => {
            ctx.fillStyle = ch.color.replace('0.6', '1');
            ctx.fillRect(legendX, 8 + i * 14, 8, 8);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px Inter, sans-serif';
            ctx.fillText(ch.label + ' Channel', legendX + 12, 16 + i * 14);
        });
    }

    /**
     * Draw a mini swatch bar showing dominant colors
     * @param {HTMLCanvasElement} canvas
     * @param {Array<{hex: string, weight: number}>} colors
     */
    static drawSwatchBar(canvas, colors) {
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;

        ctx.clearRect(0, 0, W, H);

        let x = 0;
        colors.forEach(c => {
            const w = c.weight * W;
            ctx.fillStyle = c.hex;
            ctx.fillRect(x, 0, w, H);
            x += w;
        });

        // Round corners via clip
        ctx.globalCompositeOperation = 'destination-in';
        this._roundRect(ctx, 0, 0, W, H, 6);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    static _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
