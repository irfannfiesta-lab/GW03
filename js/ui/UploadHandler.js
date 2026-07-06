/**
 * UploadHandler — File upload, drag-drop, image preview, pixel extraction
 */

export class UploadHandler {
    constructor(uploadZone, previewImg, fileInput) {
        this.uploadZone = uploadZone;
        this.previewImg = previewImg;
        this.fileInput = fileInput;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.currentImage = null;
        this.onImageLoaded = null; // Callback: (pixels, width, height, imgElement) => void

        this._initEvents();
    }

    _initEvents() {
        // File input change
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this._loadFile(e.target.files[0]);
            }
        });

        // Drag and drop
        this.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadZone.classList.add('dragover');
        });

        this.uploadZone.addEventListener('dragleave', () => {
            this.uploadZone.classList.remove('dragover');
        });

        this.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                this._loadFile(e.dataTransfer.files[0]);
            }
        });
    }

    /**
     * Load image from File object
     */
    _loadFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.loadFromUrl(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    /**
     * Load image from URL (local or proxied)
     */
    loadFromUrl(url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            this.currentImage = img;
            this._showPreview(img);
            this._extractPixels(img);
        };
        img.onerror = () => {
            console.error('Failed to load image:', url);
            // Try through proxy
            if (!url.startsWith('data:') && !url.startsWith('/color-retrieval-system/api/proxy_image.php')) {
                const proxyUrl = `/color-retrieval-system/api/proxy_image.php?url=${encodeURIComponent(url)}`;
                this.loadFromUrl(proxyUrl);
            }
        };
        img.src = url;
    }

    /**
     * Load a gallery student image (uses proxy)
     */
    loadGalleryImage(photoUrl) {
        const proxyUrl = `/color-retrieval-system/api/proxy_image.php?url=${encodeURIComponent(photoUrl)}`;
        this.loadFromUrl(proxyUrl);
    }

    /**
     * Show preview in upload zone
     */
    _showPreview(img) {
        this.previewImg.src = img.src;
        this.previewImg.style.display = 'block';
        // Hide upload text
        const textEls = this.uploadZone.querySelectorAll('.upload-zone__text, .upload-zone__icon');
        textEls.forEach(el => el.style.display = 'none');
    }

    /**
     * Extract pixels from image via canvas
     */
    _extractPixels(img) {
        // Scale down large images for performance
        const maxDim = 500;
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
        }

        this.canvas.width = w;
        this.canvas.height = h;
        this.ctx.drawImage(img, 0, 0, w, h);

        try {
            const imageData = this.ctx.getImageData(0, 0, w, h);
            if (this.onImageLoaded) {
                this.onImageLoaded(imageData.data, w, h, img);
            }
        } catch (e) {
            console.error('Canvas pixel access failed (CORS):', e);
        }
    }

    /**
     * Generate a random colored sample image (for demo purposes)
     */
    generateSampleImage() {
        const w = 200, h = 200;
        this.canvas.width = w;
        this.canvas.height = h;

        // Random gradient
        const grd = this.ctx.createLinearGradient(0, 0, w, h);
        const hue1 = Math.random() * 360;
        const hue2 = (hue1 + 60 + Math.random() * 120) % 360;
        grd.addColorStop(0, `hsl(${hue1}, 70%, 50%)`);
        grd.addColorStop(1, `hsl(${hue2}, 70%, 50%)`);
        this.ctx.fillStyle = grd;
        this.ctx.fillRect(0, 0, w, h);

        const dataUrl = this.canvas.toDataURL('image/png');
        this.loadFromUrl(dataUrl);
    }
}
