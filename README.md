# ChromaSeek

> A multimedia database application implementing **TBR (Text-Based Retrieval)**, **CBR (Content-Based Retrieval)**, and **ABR (Attribute-Based Retrieval)** paradigms for color-based image search and analysis.

## Features

- 🎨 **Real-time Color Extraction** — Histogram, K-Means dominant colors, color moments
- 🔤 **TBR** — Text search with TF-IDF + Cosine Similarity / Jaccard Index
- 🖼️ **CBR** — Image search via histogram comparison (Chi-Square, Euclidean, Manhattan)
- ⚙️ **ABR** — Attribute-based search with weighted color attributes
- 📝 **Image Analytical Summary** — Auto-detects skin tone, clothing, hijab, background
- 👥 **Student Gallery** — Scraped from university gallery portal
- 📊 **Computation Logs** — Full mathematical trace of every search

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend  | HTML5, CSS3 (modular), JavaScript (ES Modules) |
| Backend   | PHP 8+ (PDO) |
| Database  | MySQL (XAMPP) |
| Algorithms| K-Means++, TF-IDF, Chi-Square, Euclidean Distance |

## Quick Start

### Prerequisites
- [XAMPP](https://www.apachefriends.org/) with Apache + MySQL running

### Setup
1. Clone into `C:\xampp\htdocs\color-retrieval-system\`
2. Start Apache & MySQL in XAMPP
3. Run database setup: `http://localhost/color-retrieval-system/api/db_setup.php`
4. Import gallery data: `http://localhost/color-retrieval-system/scripts/import_gallery.php`
5. Open: `http://localhost/color-retrieval-system/`

## Project Structure

```
color-retrieval-system/
├── index.html              # Main entry point
├── assets/css/             # Modular CSS (7 files)
├── js/
│   ├── app.js              # Main controller
│   ├── config.js           # Configuration
│   ├── core/               # Color extraction algorithms
│   ├── engines/            # TBR, CBR, ABR retrieval engines
│   ├── ui/                 # UI components
│   └── data/               # Data access layer
├── api/                    # PHP backend (6 files)
├── sql/                    # Database schema
└── docs/                   # Documentation
```

## Mathematical Foundation

### TBR (Text-Based Retrieval)
- **TF-IDF**: `TF(w,d) × IDF(w) = (freq/|d|) × log(N/df)`
- **Cosine Similarity**: `sim(q,d) = (q·d) / (||q|| × ||d||)`

### CBR (Content-Based Retrieval)
- **Chi-Square**: `χ² = Σ((Hq(i) - Hd(i))² / (Hq(i) + Hd(i)))`
- **Histogram Intersection**: `I = Σ min(Hq(i), Hd(i))`

### ABR (Attribute-Based Retrieval)
- **Weighted Distance**: `Score = 1 - Σ(wk × |attr_q(k) - attr_d(k)| / range(k))`

## License

Academic project — BITP3353 Multimedia Database, UTeM 2026.
