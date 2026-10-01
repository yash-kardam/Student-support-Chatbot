/**
 * Client-side TF-IDF RAG Engine for ABES Knowledge Base
 * Retrieves the most relevant document chunks for a given query
 * using Term Frequency - Inverse Document Frequency scoring.
 */

import { ABES_KNOWLEDGE_BASE } from './abesKnowledge.js';

// ─── Text Preprocessing ───────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'up', 'about', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'and', 'but', 'or', 'nor', 'so', 'yet',
  'both', 'either', 'neither', 'not', 'only', 'own', 'same', 'than',
  'too', 'very', 'just', 'because', 'as', 'until', 'while', 'that',
  'this', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you',
  'your', 'he', 'she', 'it', 'his', 'her', 'its', 'they', 'them',
  'their', 'what', 'which', 'who', 'how', 'when', 'where', 'why',
  'all', 'any', 'each', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'also', 'if', 'tell', 'me', 'give', 'info',
  'information', 'please', 'know', 'want', 'need', 'like', 'get'
]);

/**
 * Tokenize and normalize text into terms
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s&+]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * Compute term frequencies for a token array
 */
function termFrequency(tokens) {
  const tf = {};
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  // Normalize by document length
  const len = tokens.length || 1;
  for (const term in tf) {
    tf[term] = tf[term] / len;
  }
  return tf;
}

// ─── Build Index ──────────────────────────────────────────────────────────────

let _index = null;

function buildIndex() {
  if (_index) return _index;

  const docs = ABES_KNOWLEDGE_BASE.map(doc => ({
    ...doc,
    tokens: tokenize(`${doc.title} ${doc.content} ${doc.category}`),
  }));

  // Compute IDF for each term across all docs
  const df = {};
  const N = docs.length;
  for (const doc of docs) {
    const seen = new Set(doc.tokens);
    for (const term of seen) {
      df[term] = (df[term] || 0) + 1;
    }
  }

  const idf = {};
  for (const term in df) {
    idf[term] = Math.log((N + 1) / (df[term] + 1)) + 1; // smoothed IDF
  }

  // Compute TF-IDF vectors
  const indexed = docs.map(doc => {
    const tf = termFrequency(doc.tokens);
    const tfidf = {};
    for (const term in tf) {
      tfidf[term] = tf[term] * (idf[term] || 1);
    }
    return { ...doc, tfidf };
  });

  _index = { docs: indexed, idf };
  return _index;
}

// ─── Retrieval ────────────────────────────────────────────────────────────────

/**
 * Cosine similarity between query TF-IDF and document TF-IDF
 */
function cosineSimilarity(queryVec, docVec) {
  let dot = 0, qNorm = 0, dNorm = 0;
  for (const term in queryVec) {
    dot += queryVec[term] * (docVec[term] || 0);
    qNorm += queryVec[term] ** 2;
  }
  for (const term in docVec) {
    dNorm += docVec[term] ** 2;
  }
  const denom = Math.sqrt(qNorm) * Math.sqrt(dNorm);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Keyword bonus: boost score if the query contains important ABES-specific terms
 */
function keywordBonus(query, doc) {
  const q = query.toLowerCase();
  let bonus = 0;

  const boosters = [
    { term: 'contact', cats: ['contact', 'committee', 'department'] },
    { term: 'phone', cats: ['contact', 'committee'] },
    { term: 'email', cats: ['contact', 'committee', 'faculty', 'department'] },
    { term: 'hod', cats: ['department', 'faculty'] },
    { term: 'head', cats: ['department', 'faculty'] },
    { term: 'faculty', cats: ['faculty'] },
    { term: 'course', cats: ['courses'] },
    { term: 'seat', cats: ['courses'] },
    { term: 'fee', cats: ['fees'] },
    { term: 'hostel', cats: ['infrastructure'] },
    { term: 'library', cats: ['infrastructure'] },
    { term: 'lab', cats: ['infrastructure'] },
    { term: 'placement', cats: ['placement'] },
    { term: 'package', cats: ['placement'] },
    { term: 'salary', cats: ['placement'] },
    { term: 'recruiter', cats: ['placement'] },
    { term: 'club', cats: ['clubs'] },
    { term: 'accreditation', cats: ['accreditation'] },
    { term: 'naac', cats: ['accreditation'] },
    { term: 'nba', cats: ['accreditation'] },
    { term: 'research', cats: ['research'] },
    { term: 'scholarship', cats: ['fees'] },
    { term: 'alumni', cats: ['alumni'] },
    { term: 'admission', cats: ['courses', 'fees'] },
    { term: 'infrastructure', cats: ['infrastructure'] },
    { term: 'sports', cats: ['infrastructure', 'clubs'] },
    { term: 'cafeteria', cats: ['infrastructure'] },
    { term: 'canteen', cats: ['infrastructure'] },
    { term: 'anti-ragging', cats: ['committee'] },
    { term: 'grievance', cats: ['committee'] },
    { term: 'transport', cats: ['location'] },
    { term: 'reach', cats: ['location'] },
    { term: 'address', cats: ['contact', 'location'] },
  ];

  for (const b of boosters) {
    if (q.includes(b.term) && b.cats.includes(doc.category)) {
      bonus += 0.15;
    }
  }

  return bonus;
}

/**
 * Main retrieval function: returns top-K relevant chunks for a query
 * @param {string} query - User's question
 * @param {number} topK - Number of chunks to return (default 5)
 * @returns {Array} - Array of relevant knowledge chunks with scores
 */
export function retrieve(query, topK = 5) {
  const { docs, idf } = buildIndex();
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) return [];

  // Build query TF-IDF vector
  const queryTf = termFrequency(queryTokens);
  const queryVec = {};
  for (const term in queryTf) {
    queryVec[term] = queryTf[term] * (idf[term] || 0.5);
  }

  // Score each document
  const scored = docs.map(doc => ({
    ...doc,
    score: cosineSimilarity(queryVec, doc.tfidf) + keywordBonus(query, doc)
  }));

  // Sort by score descending, take topK with score > 0
  return scored
    .filter(d => d.score > 0.01)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ id, category, title, content, score }) => ({
      id, category, title, content, score
    }));
}

/**
 * Format retrieved chunks into a context string for the LLM
 * @param {Array} chunks - Retrieved chunks
 * @returns {string} - Formatted context string
 */
export function buildContext(chunks) {
  if (!chunks || chunks.length === 0) return '';

  return chunks
    .map((chunk, i) => `[Source ${i + 1}: ${chunk.title}]\n${chunk.content}`)
    .join('\n\n---\n\n');
}

/**
 * Check if a query is ABES-related
 * @param {string} query
 * @returns {boolean}
 */
export function isAbesQuery(query) {
  const abesKeywords = [
    'abes', 'college', 'department', 'faculty', 'hod', 'professor',
    'course', 'btech', 'b.tech', 'mtech', 'm.tech', 'mca', 'bca', 'mba',
    'hostel', 'library', 'lab', 'placement', 'placement', 'campus',
    'admission', 'seat', 'fee', 'scholarship', 'club', 'fest', 'techfest',
    'genero', 'tedx', 'utsaah', 'accreditation', 'naac', 'nba', 'nirf',
    'aktu', 'ghaziabad', 'contact', 'phone', 'email', 'address', 'sports',
    'canteen', 'cafeteria', 'recruiter', 'package', 'salary', 'alumni',
    'research', 'patent', 'grievance', 'ragging', 'exam', 'result',
    'principal', 'dean', 'registrar', 'cse', 'ece', 'mechanical', 'civil',
    'infrastructure', 'wifi', 'internet', 'scholarship', 'autonomous',
    'nss', 'ieee', 'startup', 'incubation', 'innovation', 'transport',
    'bus', 'metro', 'reach', 'nearest', 'locate', 'facilities'
  ];

  const q = query.toLowerCase();
  return abesKeywords.some(kw => q.includes(kw));
}
