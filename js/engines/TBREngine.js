/**
 * TBR Engine — Text-Based Retrieval
 * 
 * Implements TF-IDF weighted search with Cosine Similarity or Jaccard Index
 * 
 * TF(w,d) = freq(w,d) / |d|
 * IDF(w)  = log(N / df(w))
 * TF-IDF  = TF × IDF
 * 
 * Cosine Similarity: sim(q,d) = (q · d) / (||q|| × ||d||)
 * Jaccard Index:     J(A,B) = |A ∩ B| / |A ∪ B|
 */

export class TBREngine {

    /**
     * Search the database using text keywords
     * @param {string} queryText - Search keywords
     * @param {Array} database - Array of student objects
     * @param {string} metric - 'cosine' or 'jaccard'
     * @returns {{ results: Array, log: string }}
     */
    static search(queryText, database, metric = 'cosine') {
        const queryTerms = this._tokenize(queryText);
        if (queryTerms.length === 0) {
            return { results: [], log: 'No valid search terms provided.' };
        }

        let log = `// TBR Search — ${metric === 'cosine' ? 'Cosine Similarity (TF-IDF)' : 'Jaccard Index'}\n`;
        log += `// Query: "${queryText}" → tokens: [${queryTerms.join(', ')}]\n`;
        log += `// Database: ${database.length} documents\n\n`;

        let results;
        if (metric === 'cosine') {
            results = this._cosineTFIDF(queryTerms, database, log);
        } else {
            results = this._jaccardSearch(queryTerms, database, log);
        }

        return results;
    }

    /**
     * Build a rich document (array of terms) from ALL text fields on a student,
     * not just the tags array. This ensures color searches like "white", "red",
     * "hijab blue" actually match against clothing_color, background_color,
     * hijab_color, overall_description, skin_tone, etc.
     */
    static _buildDocument(student) {
        const parts = [];

        // Tags (primary source)
        if (Array.isArray(student.tags)) {
            student.tags.forEach(t => {
                if (t) parts.push(...t.toLowerCase().split(/\s+/));
            });
        }

        // Color and analysis fields — these are the key fields for color searches
        const textFields = [
            student.overall_description,
            student.clothing_color,
            student.clothing_description,
            student.background_color,
            student.background_description,
            student.hijab_color,
            student.skin_tone,
            student.temperature_label,
            student.name,
            student.lab_group,
        ];

        textFields.forEach(field => {
            if (field && typeof field === 'string') {
                const tokens = field.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
                tokens.forEach(t => {
                    if (t.length > 1) parts.push(t);
                });
            }
        });

        // Add hijab keyword if hijab is detected
        if (student.hijab_detected && !parts.includes('hijab')) {
            parts.push('hijab');
        }

        // Add dominant color names if available
        if (Array.isArray(student.dominant_colors)) {
            student.dominant_colors.forEach(dc => {
                if (dc && dc.name) {
                    dc.name.toLowerCase().split(/\s+/).forEach(t => {
                        if (t.length > 1) parts.push(t);
                    });
                }
            });
        }

        return parts.filter(p => p.length > 1);
    }

    /**
     * Cosine Similarity with TF-IDF weighting
     */
    static _cosineTFIDF(queryTerms, database) {
        let log = '';
        const N = database.length;

        // Build rich document for each student using all text fields
        const vocabulary = new Set();
        const docTermSets = database.map(s => {
            const terms = this._buildDocument(s);
            terms.forEach(t => vocabulary.add(t));
            return terms;
        });
        queryTerms.forEach(t => vocabulary.add(t));

        const vocab = Array.from(vocabulary);
        log += `// Vocabulary size: ${vocab.length}\n`;

        // Compute IDF for each term
        const idf = {};
        vocab.forEach(term => {
            const df = docTermSets.filter(doc => doc.includes(term)).length;
            idf[term] = df > 0 ? Math.log(N / df) : 0;
        });

        log += `// IDF values:\n`;
        queryTerms.forEach(t => {
            log += `//   IDF("${t}") = ${idf[t]?.toFixed(4) || '0.0000'}\n`;
        });
        log += '\n';

        // Compute query TF-IDF vector
        const queryVec = vocab.map(term => {
            const tf = queryTerms.filter(t => t === term).length / queryTerms.length;
            return tf * (idf[term] || 0);
        });

        // Compute scores for each document
        const scored = database.map((student, idx) => {
            const docTerms = docTermSets[idx];
            const docVec = vocab.map(term => {
                const tf = docTerms.filter(t => t === term).length / (docTerms.length || 1);
                return tf * (idf[term] || 0);
            });

            // Cosine similarity
            let dot = 0, normQ = 0, normD = 0;
            for (let i = 0; i < vocab.length; i++) {
                dot += queryVec[i] * docVec[i];
                normQ += queryVec[i] ** 2;
                normD += docVec[i] ** 2;
            }
            normQ = Math.sqrt(normQ);
            normD = Math.sqrt(normD);
            const score = (normQ * normD > 0) ? dot / (normQ * normD) : 0;

            return { student, score, distance: 1 - score };
        });

        scored.sort((a, b) => b.score - a.score);

        // Log top results
        log += '// Results (ranked by Cosine Similarity):\n';
        scored.slice(0, 10).forEach((r, i) => {
            log += `//  ${i + 1}. ${r.student.name}: score = ${r.score.toFixed(4)}\n`;
        });

        return { results: scored, log };
    }

    /**
     * Jaccard Index: J(A,B) = |A ∩ B| / |A ∪ B|
     */
    static _jaccardSearch(queryTerms, database) {
        let log = '';
        const querySet = new Set(queryTerms);

        const scored = database.map(student => {
            const docTerms = new Set(this._buildDocument(student));
            const intersection = new Set([...querySet].filter(t => docTerms.has(t)));
            const union = new Set([...querySet, ...docTerms]);
            const score = union.size > 0 ? intersection.size / union.size : 0;

            return { student, score, distance: 1 - score };
        });

        scored.sort((a, b) => b.score - a.score);

        log += '// Jaccard Index results:\n';
        scored.slice(0, 10).forEach((r, i) => {
            log += `//  ${i + 1}. ${r.student.name}: J = ${r.score.toFixed(4)}\n`;
        });

        return { results: scored, log };
    }

    /**
     * Tokenize and normalize query text
     */
    static _tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(t => t.length > 1);
    }
}
