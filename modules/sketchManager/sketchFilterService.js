// --- SketchFilterService: Pure JS search, fuzzy matching, and quality filter logic ---

/**
 * Calculates a fuzzy match score for a given query against target text.
 * Returns score > 0 if query characters match sequentially, otherwise 0.
 * Higher scores represent better matches (e.g. prefix match, word start match).
 */
export function fuzzyMatchScore(query, target) {
    if (!query) return 1; // Empty query matches everything
    if (!target) return 0;

    const q = query.toLowerCase().trim();
    const t = target.toLowerCase();

    if (t.includes(q)) {
        // Substring match gets a boost proportional to position
        const index = t.indexOf(q);
        return 100 - index;
    }

    // Sequential character matching score
    let qIdx = 0;
    let score = 0;
    let consecutive = 0;

    for (let tIdx = 0; tIdx < t.length && qIdx < q.length; tIdx++) {
        if (t[tIdx] === q[qIdx]) {
            score += 10 + (consecutive * 5);
            if (tIdx === 0 || t[tIdx - 1] === ' ' || t[tIdx - 1] === '_' || t[tIdx - 1] === '-') {
                score += 15; // Word boundary match boost
            }
            qIdx++;
            consecutive++;
        } else {
            consecutive = 0;
        }
    }

    return qIdx === q.length ? score : 0;
}

/**
 * Filters and ranks sketches based on text search (fuzzy), tag selection, and minimum quality.
 */
export function filterAndRankSketches(sketches, searchQuery, selectedTags = [], filterMode = 'all', minQuality = 0) {
    if (!sketches || !Array.isArray(sketches)) return [];

    const query = (searchQuery || '').trim();
    const tagsLower = (selectedTags || []).map(t => String(t).toLowerCase());
    const minQ = Number(minQuality) || 0;

    return sketches
        .map((sketch) => {
            // Source mode filter (all / remote / local)
            if (filterMode === 'remote' && !sketch.remote) return null;
            if (filterMode === 'local' && sketch.remote) return null;

            // Quality filter (numeric 1-5): allow filtering for sketches over a quality number
            if (minQ > 0) {
                const sketchQuality = Number(sketch.metadata?.quality ?? sketch.quality ?? 0);
                if (sketchQuality < minQ) return null;
            }

            // Tag filter check
            const sketchTags = Array.isArray(sketch.metadata?.tags) ? sketch.metadata.tags : [];
            const sketchTagsLower = sketchTags.map(t => String(t).toLowerCase());

            if (tagsLower.length > 0) {
                const matchesTags = tagsLower.every(reqTag => sketchTagsLower.includes(reqTag));
                if (!matchesTags) return null;
            }

            if (!query) {
                return { sketch, score: 1 };
            }

            // Fuzzy match across name, description, tags, and code
            const nameScore = fuzzyMatchScore(query, sketch.name || '');
            const descScore = fuzzyMatchScore(query, sketch.description || sketch.metadata?.description || '');
            const tagsText = sketchTags.join(' ');
            const tagScore = fuzzyMatchScore(query, tagsText);
            const codeScore = sketch.code ? (sketch.code.toLowerCase().includes(query.toLowerCase()) ? 20 : 0) : 0;

            const maxScore = Math.max(nameScore * 2, descScore * 1.2, tagScore * 1.5, codeScore);

            return maxScore > 0 ? { sketch, score: maxScore } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .map(item => item.sketch);
}
