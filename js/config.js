/**
 * Configuration Constants
 * Color Extraction & Retrieval System
 */
export const CONFIG = {
    // API endpoints
    API_BASE: '/color-retrieval-system/api',
    API_STUDENTS: '/color-retrieval-system/api/fetch_students.php',
    API_SAVE: '/color-retrieval-system/api/save_analysis.php',
    API_PROXY: '/color-retrieval-system/api/proxy_image.php',
    API_SEARCH_LOG: '/color-retrieval-system/api/search_log.php',

    // Remote gallery
    GALLERY_BASE: 'https://bitp3353.utem.edu.my/2026/all/',
    UPLOADS_BASE: 'https://bitp3353.utem.edu.my/2026/all/uploads/',

    // Color extraction
    HISTOGRAM_BINS: 256,
    KMEANS_K: 5,
    KMEANS_MAX_ITER: 20,
    KMEANS_SAMPLE_SIZE: 5000,

    // Image analysis zones (as fractions)
    ZONE_FACE_TOP: 0.05,
    ZONE_FACE_BOTTOM: 0.35,
    ZONE_FACE_LEFT: 0.25,
    ZONE_FACE_RIGHT: 0.75,
    ZONE_BODY_TOP: 0.35,
    ZONE_BODY_BOTTOM: 0.90,
    ZONE_BG_MARGIN: 0.12,

    // Retrieval
    MAX_RESULTS: 20,
    TBR_DEFAULT_METRIC: 'cosine',
    CBR_DEFAULT_METRIC: 'chi-square',

    // ABR weights
    ABR_WEIGHTS: {
        dominant_color: 0.35,
        temperature: 0.25,
        colorfulness: 0.20,
        saturation: 0.20,
    },
};
