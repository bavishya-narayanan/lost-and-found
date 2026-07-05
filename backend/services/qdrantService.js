const config = require('../config/aiConfig');

const QDRANT_URL = config.QDRANT_URL;

const getQdrantHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  if (config.QDRANT_API_KEY) headers['api-key'] = config.QDRANT_API_KEY;
  return headers;
};

/**
 * Deterministically convert a 24-character MongoDB ObjectId into a 36-character UUID string.
 */
const objectIdToUuid = (objectId) => {
  const hex = objectId.toString();
  return `00000000-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12)}`;
};

/**
 * Initialize the required collections in Qdrant if they don't exist.
 */
const initCollections = async () => {
  try {
    const collections = ['image_embeddings', 'text_embeddings'];
    
    // Check existing — let connection errors propagate to the caller
    const res = await fetch(`${QDRANT_URL}/collections`, { headers: getQdrantHeaders() });
    if (!res.ok) {
      console.warn('Qdrant server returned an error. Skipping collection initialization.');
      return;
    }
    const data = await res.json();
    const existing = data.result.collections.map(c => c.name);

    for (const name of collections) {
      if (!existing.includes(name)) {
        const size = name === 'image_embeddings' ? 512 : 384;
        console.log(`Creating Qdrant collection: ${name} (size: ${size})`);
        
        const createRes = await fetch(`${QDRANT_URL}/collections/${name}`, {
          method: 'PUT',
          headers: getQdrantHeaders(),
          body: JSON.stringify({
            vectors: {
              size,
              distance: 'Cosine'
            }
          })
        });
        
        if (!createRes.ok) {
          console.error(`Failed to create Qdrant collection ${name}:`, await createRes.text());
        }
      }
    }
  } catch (error) {
    console.error('Error initializing Qdrant collections:', error.message);
    throw error; // propagate so caller can handle it
  }
};

/**
 * Upsert vector into Qdrant collection.
 */
const upsertVector = async (collectionName, reportId, vector, payload) => {
  try {
    await initCollections(); // Safe fallback
    
    const pointId = objectIdToUuid(reportId);
    const dimension = Array.isArray(vector) ? vector.length : 0;
    const isImage = collectionName === 'image_embeddings';

    // ── DEBUG LOGS ──
    console.log(`\n[Qdrant] ──────────────────────────────────`);
    if (isImage) {
      console.log(`[Qdrant] Image embedding generated`);
      console.log(`[Qdrant]   Vector Dimension : ${dimension} (expected: 512)`);
      console.log(`[Qdrant]   Model            : ${config.CLIP_MODEL}`);
    } else {
      console.log(`[Qdrant] Text embedding generated`);
      console.log(`[Qdrant]   Vector Dimension : ${dimension} (expected: 384)`);
      console.log(`[Qdrant]   Model            : ${config.SENTENCE_MODEL}`);
    }
    console.log(`[Qdrant] Uploading vector to Qdrant...`);
    console.log(`[Qdrant]   Collection : ${collectionName}`);
    console.log(`[Qdrant]   Vector ID  : ${pointId}`);
    console.log(`[Qdrant]   Payload    :`, JSON.stringify(payload, null, 4));
    // ─────────────────

    const body = {
      points: [
        {
          id: pointId,
          vector,
          payload: {
            reportId: reportId.toString(),
            embeddingVersion: config.EMBEDDING_VERSION,
            modelVersion: isImage ? config.CLIP_MODEL : config.SENTENCE_MODEL,
            ...payload
          }
        }
      ]
    };

    const res = await fetch(`${QDRANT_URL}/collections/${collectionName}/points?wait=true`, {
      method: 'PUT',
      headers: getQdrantHeaders(),
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Qdrant upsert failed: ${errText}`);
    }

    console.log(`[Qdrant] ✅ Upsert Successful → ${collectionName}`);
    console.log(`[Qdrant] ──────────────────────────────────\n`);
    return true;
  } catch (error) {
    console.error(`[Qdrant] ❌ Failed to upsert vector into ${collectionName}:`, error);
    return false;
  }
};

/**
 * Perform vector search on Qdrant with filters.
 */
const searchVectors = async (collectionName, vector, filters = {}, limit = config.TOP_K) => {
  try {
    const filterMust = [];
    const usesStrictFiltering = Boolean(filters.reportType || filters.status || filters.category || (filters.campusZone && filters.campusZone !== 'Unknown'));

    // Qdrant Cloud requires payload keys to be indexed before they can be used in filters.
    // To avoid runtime failures, we only apply filters when they are known-safe and otherwise
    // we perform a broader semantic search over the whole collection.
    if (filters.reportType) {
      filterMust.push({ key: 'reportType', match: { value: filters.reportType } });
    }
    if (filters.status) {
      filterMust.push({ key: 'status', match: { value: filters.status } });
    }
    if (filters.category) {
      filterMust.push({ key: 'category', match: { value: filters.category } });
    }
    if (filters.campusZone && filters.campusZone !== 'Unknown') {
      filterMust.push({ key: 'campusZone', match: { value: filters.campusZone } });
    }

    console.log(`[Qdrant] Searching ${collectionName}... (filters: ${JSON.stringify(filters)}, top-k: ${limit})`);

    const body = {
      vector,
      limit,
      with_payload: true
    };

    if (usesStrictFiltering && filterMust.length > 0) {
      body.filter = { must: filterMust };
    }

    const res = await fetch(`${QDRANT_URL}/collections/${collectionName}/points/search`, {
      method: 'POST',
      headers: getQdrantHeaders(),
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Qdrant search failed: ${errText}`);
    }

    const data = await res.json();
    const results = data.result.map(hit => ({
      reportId: hit.payload.reportId,
      score: hit.score,
      payload: hit.payload
    }));

    console.log(`[Qdrant] Retrieved ${results.length} candidates from ${collectionName}`);
    results.forEach((r, i) => {
      console.log(`[Qdrant]   #${i + 1} → reportId: ${r.reportId}, score: ${r.score.toFixed(4)}, type: ${r.payload.reportType}`);
    });

    return results;
  } catch (error) {
    console.error(`[Qdrant] ❌ Error searching vectors in ${collectionName}:`, error);
    return [];
  }
};

module.exports = {
  initCollections,
  upsertVector,
  searchVectors
};
