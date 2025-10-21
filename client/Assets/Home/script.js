/* =====================================================================
 * HOME TAB JAVASCRIPT
 * Gallery functionality, filters, and home page specific features
 * ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // FEATURE: GALLERY LOAD ----------------------------------------------
  const galleryEl = document.getElementById("mainGallery");
  const promotedEl = document.getElementById("promotedGallery");
  const promotedSub = document.getElementById("promotedSub");
  const filtersForm = document.getElementById("galleryFilters");
  const filterSearch = document.getElementById("filterSearch");
  const filterMinViews = document.getElementById("filterMinViews");
  const filterMinViewsValue = document.getElementById("filterMinViewsValue");
  const filterColor = document.getElementById("filterColor");
  const filterSort = document.getElementById("filterSort");
  const filterMatchCount = document.getElementById("filterMatchCount");
  const filterResetBtn = document.getElementById("filterReset");
  const filterApplyBtn = document.getElementById("filterApply");
  const fetchFooter = document.getElementById("fetchFooter");

  if (!galleryEl) return;

  const pageSize = parseInt(galleryEl.getAttribute("data-page-size"), 10) || 20;
  let allImages = [];
  let filteredImages = [];
  let currentPage = 1;
  let promotedImages = [];
  // Active view range preset (null means none). When set, overrides min slider & adds max constraint.
  let viewRangePreset = null; // {min:number, max:number}
  // Track if any filter (other than default sort) is active to show empty state correctly
  let filtersActive = false;
  // Track whether user has intentionally adjusted the min views slider
  let minViewsDirty = false;
  // Track asynchronous color detection state
  let colorDetectionInProgress = false;
  let colorDetectionCompleted = false;
  // Local cache (in-memory) loaded from localStorage if available
  let colorCache = {};

  // In-memory pre-index for fast, accurate relevance search
  // Each image gets an _index with normalized strings and token arrays
  let searchIndexBuilt = false;

  // Color alias map to improve matching accuracy for user terms
  const COLOR_ALIASES = {
    magenta: "pink",
    fuchsia: "pink",
    rose: "pink",
    scarlet: "red",
    crimson: "red",
    maroon: "red",
    burgundy: "red",
    amber: "yellow",
    gold: "yellow",
    golden: "yellow",
    lemon: "yellow",
    lime: "green",
    teal: "green",
    olive: "green",
    cyan: "blue",
    aqua: "blue",
    navy: "blue",
    indigo: "purple",
    violet: "purple",
    lilac: "purple",
    lavender: "purple",
    tan: "brown",
    beige: "brown",
    charcoal: "black",
    ivory: "white",
    cream: "white",
    grey: "gray",
  };

  function normalizeText(str) {
    return String(str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip diacritics
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function tokenize(str) {
    const n = normalizeText(str);
    return n ? n.split(/\s+/).filter(Boolean) : [];
  }

  // Very small, bounded edit distance (0..2) to support fuzzy term matching
  function editDistanceAtMost(a, b, maxDist = 2) {
    if (!a || !b) return Math.max(a?.length || 0, b?.length || 0);
    // Quick exits
    if (a === b) return 0;
    const la = a.length,
      lb = b.length;
    if (Math.abs(la - lb) > maxDist) return maxDist + 1;
    // DP over two rows, early stopping by band
    const prev = new Array(lb + 1);
    const curr = new Array(lb + 1);
    for (let j = 0; j <= lb; j++) prev[j] = j;
    for (let i = 1; i <= la; i++) {
      curr[0] = i;
      // banded range to avoid full matrix when far apart
      const from = Math.max(1, i - maxDist);
      const to = Math.min(lb, i + maxDist);
      let best = curr[0];
      for (let j = 1; j <= lb; j++) {
        if (j < from || j > to) {
          curr[j] = maxDist + 1; // outside band
          continue;
        }
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        const del = prev[j] + 1;
        const ins = curr[j - 1] + 1;
        const sub = prev[j - 1] + cost;
        curr[j] = del < ins ? (del < sub ? del : sub) : ins < sub ? ins : sub;
        best = Math.min(best, curr[j]);
      }
      // Early stop if best in this row already exceeds maxDist
      if (best > maxDist) return best;
      // swap rows
      for (let j = 0; j <= lb; j++) prev[j] = curr[j];
    }
    return prev[lb];
  }

  // Extract quoted phrases and leftover terms
  function parseQuery(q) {
    const phrases = [];
    const rest = [];
    if (!q) return { phrases, terms: rest };
    const re = /\"([^\"]+)\"/g; // "..."
    let m;
    let remaining = q;
    while ((m = re.exec(q))) {
      phrases.push(normalizeText(m[1]));
    }
    remaining = q.replace(re, " ");
    tokenize(remaining).forEach((t) => rest.push(t));
    return { phrases, terms: rest };
  }

  function buildItemIndex(item) {
    const title = normalizeText(item.title);
    const description = normalizeText(item.description);
    const alt = normalizeText(item.image?.alt);
    const author = normalizeText(item.author?.name);
    const colorsArr = Array.isArray(item.colors)
      ? item.colors.map((c) => String(c).toLowerCase())
      : [];
    const detected = item._detectedColors ? [...item._detectedColors] : [];
    const colorSet = new Set([
      ...colorsArr,
      ...detected.map((c) => String(c).toLowerCase()),
    ]);
    // Add aliases
    for (const [alias, base] of Object.entries(COLOR_ALIASES)) {
      if (colorSet.has(alias)) colorSet.add(base);
    }
    return {
      title,
      description,
      alt,
      author,
      colors: colorSet,
      titleTokens: tokenize(title),
      descTokens: tokenize(description),
      altTokens: tokenize(alt),
      authorTokens: tokenize(author),
    };
  }

  function ensureSearchIndex() {
    if (searchIndexBuilt) return;
    allImages.forEach((img) => {
      img._index = buildItemIndex(img);
    });
    searchIndexBuilt = true;
  }

  function applyColorAliases(term) {
    if (!term) return term;
    return COLOR_ALIASES[term] || term;
  }

  // Compute a relevance score for an image given a parsed query
  function scoreItem(item, parsed) {
    if (!parsed || (!parsed.terms.length && !parsed.phrases.length)) return 0;
    const idx = item._index || buildItemIndex(item);
    // Field weights chosen based on importance
    const W = {
      title: 3.0,
      author: 2.2,
      alt: 1.2,
      description: 1.0,
      colors: 2.0,
    };
    let score = 0;

    // Helper: add boosts for a string field
    function scoreField(text, tokens, weight, term) {
      if (!text) return 0;
      let s = 0;
      // exact substring
      if (text.includes(term)) s += 50 * weight;
      // word equals
      if (tokens && tokens.includes(term)) s += 40 * weight;
      // starts-with on any token
      if (tokens && tokens.some((t) => t.startsWith(term))) s += 30 * weight;
      // fuzzy (1-2 edits) on any token, short-circuit at first good hit
      const maxD = term.length <= 4 ? 1 : 2;
      if (tokens) {
        for (const t of tokens) {
          const d = editDistanceAtMost(t, term, maxD);
          if (d === 1) {
            s += (term.length <= 4 ? 18 : 22) * weight;
            break;
          } else if (d === 2) {
            s += 12 * weight;
            break;
          }
        }
      }
      return s;
    }

    // Phrases get a big boost when found in title/desc/author
    for (const phrase of parsed.phrases) {
      if (!phrase) continue;
      if (idx.title.includes(phrase)) score += 140 * W.title;
      if (idx.description.includes(phrase)) score += 90 * W.description;
      if (idx.author.includes(phrase)) score += 110 * W.author;
      if (idx.alt.includes(phrase)) score += 60 * W.alt;
    }

    // Individual terms
    for (let term of parsed.terms) {
      term = applyColorAliases(term);
      score += scoreField(idx.title, idx.titleTokens, W.title, term);
      score += scoreField(idx.description, idx.descTokens, W.description, term);
      score += scoreField(idx.alt, idx.altTokens, W.alt, term);
      score += scoreField(idx.author, idx.authorTokens, W.author, term);

      // Color matches
      if (idx.colors.has(term)) score += 70 * W.colors;
    }

    return score;
  }

  /* =============================================================
     AUTO COLOR DETECTION (Canvas Sampling)
     - For each image we can fetch, sample a reduced-size bitmap (e.g. 32x32)
       to determine prominent color categories (red/orange/yellow/...)
     - Augments existing metadata colors[]; does NOT overwrite.
     ============================================================= */
  const COLOR_DEFS = [
    { name: "black", rgb: [0, 0, 0] },
    { name: "gray", rgb: [128, 128, 128] },
    { name: "white", rgb: [255, 255, 255] },
    { name: "red", rgb: [220, 20, 60] },
    { name: "orange", rgb: [255, 140, 0] },
    { name: "yellow", rgb: [255, 215, 0] },
    { name: "green", rgb: [34, 139, 34] },
    { name: "blue", rgb: [65, 105, 225] },
    { name: "purple", rgb: [138, 43, 226] },
    { name: "pink", rgb: [255, 105, 180] },
    { name: "brown", rgb: [139, 69, 19] },
  ];

  function classifyColor(r, g, b) {
    // function to classify color based on RGB values
    // Convert to HSL-lite metrics for gray/black/white detection
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    const saturation =
      max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
    if (saturation < 0.08) {
      if (lightness < 60) return "black";
      if (lightness > 200) return "white";
      return "gray";
    }
    // Choose nearest base color by Euclidean distance
    let best = null;
    let bestDist = 1e9;
    for (const c of COLOR_DEFS) {
      if (["black", "gray", "white"].includes(c.name)) continue; // already handled
      const [cr, cg, cb] = c.rgb;
      const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = c.name;
      }
    }
    return best || "gray";
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return [h * 360, s, l];
  }

  function distance3(a, b) {
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  }

  /* ===================== Advanced Color Space Helpers ===================== */
  function rgbToXyz(r, g, b) {
    // sRGB to XYZ (D65)
    r /= 255;
    g /= 255;
    b /= 255;
    // gamma correction
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
    return [x, y, z];
  }
  function xyzToLab(x, y, z) {
    // D65 reference white
    const refX = 0.95047,
      refY = 1.0,
      refZ = 1.08883;
    x /= refX;
    y /= refY;
    z /= refZ;
    const f = (t) => (t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116);
    const fx = f(x);
    const fy = f(y);
    const fz = f(z);
    const L = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const b = 200 * (fy - fz);
    return [L, a, b];
  }
  function rgbToLab(r, g, b) {
    const [x, y, z] = rgbToXyz(r, g, b);
    return xyzToLab(x, y, z);
  }
  function labDistance(a, b) {
    // CIE76
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  }

  function mapCentroidToCategory([r, g, b]) {
    const [h, s, l] = rgbToHsl(r, g, b);
    if (s < 0.08) {
      if (l < 0.23) return "black";
      if (l > 0.88) return "white";
      return "gray";
    }
    // brown detection (lowish lightness mid hue)
    if (l < 0.55 && h > 15 && h < 55 && s > 0.25) {
      if (r > 60 && g > 30 && b < 120) {
        return "brown";
      }
    }
    // map hue to nearest anchor
    let best = null;
    let bestDist = 1e9;
    for (const c of COLOR_DEFS) {
      const d = distance3([r, g, b], c.rgb);
      if (d < bestDist) {
        bestDist = d;
        best = c.name;
      }
    }
    return best || "gray";
  }

  function detectImageColorsForItem(imageObj) {
    return new Promise((resolve) => {
      const src = imageObj.image?.src;
      if (!src) return resolve(new Set());
      // Cache hit
      if (imageObj.id && colorCache[imageObj.id]) {
        return resolve(new Set(colorCache[imageObj.id]));
      }
      const imgEl = new Image();
      imgEl.crossOrigin = "anonymous"; // allow canvas sampling if CORS ok
      imgEl.decoding = "async";
      imgEl.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          // Adaptive target size: larger images get a bit more detail up to 72
          const longest = Math.max(
            imgEl.naturalWidth || imgEl.width,
            imgEl.naturalHeight || imgEl.height
          );
          const target = longest > 1600 ? 72 : longest > 900 ? 54 : 42; // tiers
          const w = imgEl.naturalWidth || imgEl.width;
          const h = imgEl.naturalHeight || imgEl.height;
          if (!w || !h) return resolve(new Set());
          const scale = Math.min(target / w, target / h, 1);
          canvas.width = Math.max(1, Math.round(w * scale));
          canvas.height = Math.max(1, Math.round(h * scale));
          ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          const pixels = [];
          const maxSamples = 3500; // cap for performance
          // Reservoir sampling over all pixels (step of 1 for fidelity)
          let seen = 0;
          for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3];
            if (a < 140) {
              continue;
            }
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Skip near-transparent or fully white filler regions aggressively
            if (r > 248 && g > 248 && b > 248) {
              continue;
            }
            seen++;
            if (pixels.length < maxSamples) {
              pixels.push([r, g, b]);
            } else {
              const j = Math.floor(Math.random() * seen);
              if (j < pixels.length) pixels[j] = [r, g, b];
            }
          }
          if (!pixels.length) return resolve(new Set());

          // Determine K adaptively with diminishing returns
          const K = Math.min(
            10,
            Math.max(3, Math.round(Math.sqrt(pixels.length / 400) + 3))
          );
          // Precompute Lab for all pixels
          const pixelsLab = pixels.map((p) => rgbToLab(p[0], p[1], p[2]));
          // k-means++ init
          const centroidsIdx = [];
          centroidsIdx.push(Math.floor(Math.random() * pixelsLab.length));
          while (centroidsIdx.length < K) {
            const dists = pixelsLab.map((lab, i) => {
              let best = 1e12;
              for (const ci of centroidsIdx) {
                const d = labDistance(lab, pixelsLab[ci]);
                if (d < best) best = d;
              }
              return best;
            });
            const sum = dists.reduce((a, b) => a + b, 0);
            if (sum === 0) break;
            let r = Math.random() * sum;
            let pick = 0;
            for (let i = 0; i < dists.length; i++) {
              r -= dists[i];
              if (r <= 0) {
                pick = i;
                break;
              }
            }
            if (!centroidsIdx.includes(pick)) centroidsIdx.push(pick);
            else break;
          }
          let centroidsLab = centroidsIdx.map((i) => pixelsLab[i].slice());
          const assignments = new Array(pixelsLab.length).fill(0);
          for (let iter = 0; iter < 12; iter++) {
            let moved = 0;
            for (let i = 0; i < pixelsLab.length; i++) {
              const lab = pixelsLab[i];
              let best = 0;
              let bestD = 1e18;
              for (let c = 0; c < centroidsLab.length; c++) {
                const d = labDistance(lab, centroidsLab[c]);
                if (d < bestD) {
                  bestD = d;
                  best = c;
                }
              }
              if (assignments[i] !== best) {
                assignments[i] = best;
                moved++;
              }
            }
            // Update centroids
            const sums = centroidsLab.map(() => [0, 0, 0, 0]);
            for (let i = 0; i < pixelsLab.length; i++) {
              const a = assignments[i];
              const lab = pixelsLab[i];
              sums[a][0] += lab[0];
              sums[a][1] += lab[1];
              sums[a][2] += lab[2];
              sums[a][3]++;
            }
            for (let c = 0; c < centroidsLab.length; c++) {
              if (sums[c][3] > 0) {
                centroidsLab[c][0] = sums[c][0] / sums[c][3];
                centroidsLab[c][1] = sums[c][1] / sums[c][3];
                centroidsLab[c][2] = sums[c][2] / sums[c][3];
              }
            }
            if (moved === 0) break;
          }
          // Cluster size tally & prune tiny noise clusters (<1.5% of samples) by merging to nearest big
          const counts = centroidsLab.map(() => 0);
          assignments.forEach((a) => counts[a]++);
          const minSize = Math.max(3, Math.floor(pixelsLab.length * 0.015));
          for (let c = 0; c < centroidsLab.length; c++) {
            if (counts[c] < minSize) {
              // find nearest cluster with >= minSize
              let target = -1;
              let best = 1e18;
              for (let d = 0; d < centroidsLab.length; d++) {
                if (d === c || counts[d] < minSize) continue;
                const dist = labDistance(centroidsLab[c], centroidsLab[d]);
                if (dist < best) {
                  best = dist;
                  target = d;
                }
              }
              if (target >= 0) {
                // reassign small cluster points
                for (let i = 0; i < assignments.length; i++)
                  if (assignments[i] === c) assignments[i] = target;
                counts[target] += counts[c];
                counts[c] = 0;
              }
            }
          }
          // Recompute final centroid average after merging
          centroidsLab.forEach((_, idx) => {
            centroidsLab[idx] = [0, 0, 0, 0];
          });
          for (let i = 0; i < pixelsLab.length; i++) {
            const a = assignments[i];
            const lab = pixelsLab[i];
            centroidsLab[a][0] += lab[0];
            centroidsLab[a][1] += lab[1];
            centroidsLab[a][2] += lab[2];
            centroidsLab[a][3]++;
          }
          centroidsLab.forEach((c) => {
            if (c[3] > 0) {
              c[0] /= c[3];
              c[1] /= c[3];
              c[2] /= c[3];
            }
          });
          // Map clusters to categories, weighting by saturation proxy (chroma in Lab)
          const categoryCounts = new Map();
          for (let i = 0; i < centroidsLab.length; i++) {
            if (counts[i] === 0) continue;
            const cLab = centroidsLab[i];
            const L = cLab[0],
              a = cLab[1],
              b = cLab[2];
            const chroma = Math.sqrt(a * a + b * b);
            // Convert approximate Lab back to RGB-ish for existing hue logic via inverse (approx by searching nearest pixel sample of that cluster)
            // Simpler: pick one pixel representative
            const repIndex = assignments.findIndex((v) => v === i);
            const rep = repIndex >= 0 ? pixels[repIndex] : [200, 200, 200];
            const cat = mapCentroidToCategory(rep);
            const weight = counts[i] * (1 + chroma / 100); // boost saturated clusters
            categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + weight);
          }
          const sorted = [...categoryCounts.entries()].sort(
            (a, b) => b[1] - a[1]
          );
          const topCats = sorted.slice(0, 6).map((e) => e[0]);
          if (imageObj.id) {
            colorCache[imageObj.id] = topCats;
          }
          resolve(new Set(topCats));
        } catch (e) {
          resolve(new Set());
        }
      };
      imgEl.onerror = () => resolve(new Set());
      imgEl.src = src;
    });
  }

  async function runAutoColorDetection() {
    if (colorDetectionInProgress || colorDetectionCompleted) return;
    // Load cache from localStorage once
    if (!Object.keys(colorCache).length) {
      try {
        const raw = localStorage.getItem("imgColorCache_v1");
        if (raw) colorCache = JSON.parse(raw);
      } catch (e) {}
    }
    colorDetectionInProgress = true;
    const tasks = allImages.map(async (img) => {
      // Skip if already has detected colors
      if (img._detectedColors instanceof Set && img._detectedColors.size)
        return;
      const detected = await detectImageColorsForItem(img);
      img._detectedColors = detected;
    });
    await Promise.all(tasks);
    colorDetectionCompleted = true;
    colorDetectionInProgress = false;
    // Merge detected colors into any built search index for better accuracy
    allImages.forEach((img) => {
      if (!img._detectedColors || !(img._detectedColors instanceof Set)) return;
      if (!img._index) return; // will be built lazily later
      const idx = img._index;
      // Merge and alias
      img._detectedColors.forEach((c) =>
        idx.colors.add(String(c).toLowerCase())
      );
      for (const [alias, base] of Object.entries(COLOR_ALIASES)) {
        if (idx.colors.has(alias)) idx.colors.add(base);
      }
    });
    // Persist cache
    try {
      localStorage.setItem("imgColorCache_v1", JSON.stringify(colorCache));
    } catch (e) {}
    // Do not auto-apply any filters here; user will click Search
  }

  /** Return HTML string for a single gallery <figure> card. */
  function figureTemplate(item, absoluteIndex) {
    const safeTitle = escapeHtml(item.title || "Untitled");
    const safeDesc = escapeHtml(item.description || "");
    const mainSrc = item.image?.src || "";
    const mainAlt = escapeHtml(item.image?.alt || safeTitle);
    const views = escapeHtml(item.views || "0");
    const avatar = item.author?.avatar || "";
    const avatarAlt = escapeHtml(item.author?.alt || "Author avatar");
    const idVal = item.id != null ? item.id : absoluteIndex + 1;
    return `
      <figure class="bento-item" data-id="${idVal}" tabindex="0" aria-describedby="img-${idVal}-title">
        <img src="${mainSrc}" class="bento-Image" alt="${mainAlt}" loading="lazy" />
        <div class="ImgInfo">
          <h3 id="img-${idVal}-title">${safeTitle}</h3>
          <p>${safeDesc}</p>
          <span class="views" aria-label="${views} views">${formatViews(
      views
    )} ${viewsIcon()}</span>
          <img src="${avatar}" alt="${avatarAlt}" />
        </div>
      </figure>
    `;
  }

  /** Inline SVG: small eye icon (shared between grid & detail view). */
  function viewsIcon() {
    return `<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
  <path fill-rule="evenodd" d="M4.998 7.78C6.729 6.345 9.198 5 12 5c2.802 0 5.27 1.345 7.002 2.78a12.713 12.713 0 0 1 2.096 2.183c.253.344.465.682.618.997.14.286.284.658.284 1.04s-.145.754-.284 1.04a6.6 6.6 0 0 1-.618.997 12.712 12.712 0 0 1-2.096 2.183C17.271 17.655 14.802 19 12 19c-2.802 0-5.27-1.345-7.002-2.78a12.712 12.712 0 0 1-2.096-2.183 6.6 6.6 0 0 1-.618-.997C2.144 12.754 2 12.382 2 12s.145-.754.284-1.04c.153-.315.365-.653.618-.997A12.714 12.714 0 0 1 4.998 7.78ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd"/>
</svg>`;
  }

  /** Build HTML for a promoted card (smaller, highlight). */
  function promotedTemplate(item) {
    const safeTitle = escapeHtml(item.title || "Untitled");
    const safeDesc = escapeHtml(item.description || "");
    const mainSrc = item.image?.src || "";
    const mainAlt = escapeHtml(item.image?.alt || safeTitle);
    const views = escapeHtml(item.views || "0");
    const avatar = item.author?.avatar || "";
    const avatarAlt = escapeHtml(item.author?.alt || "Author avatar");
    return `
      <article class="promoted-card" data-id="${
        item.id
      }" tabindex="0" aria-label="Promoted: ${safeTitle}">
        <img class="main" src="${mainSrc}" alt="${mainAlt}" loading="lazy" />
        <div class="pc-body">
          <h4><span class="badge-star">★</span>${safeTitle}</h4>
          <p class="desc">${safeDesc}</p>
          <div class="promoted-meta">
            <span class="views">${formatViews(views)} ${viewsIcon()}</span>
            <img class="avatar" src="${avatar}" alt="${avatarAlt}">
          </div>
        </div>
      </article>`;
  }

  /** Populate promoted row: picks top viewed (or flagged) images. */
  function renderPromoted() {
    if (!promotedEl) return;
    if (!promotedImages.length) {
      promotedEl.innerHTML = '<p class="promoted-empty">No promoted items.</p>';
      return;
    }
    promotedEl.innerHTML = promotedImages.map(promotedTemplate).join("");
    // Handlers for navigation to selected view
    promotedEl.querySelectorAll(".promoted-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-id");
        if (id) navigateToSelected(id);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const id = card.getAttribute("data-id");
          if (id) navigateToSelected(id);
        }
      });
    });
  }

  /** Normalize view strings (e.g., '1.2k' => '1.2 k' for spacing). */
  function formatViews(v) {
    // Insert a thin space before shorthand suffix like k / M if missing
    return v.replace(/(\d+(?:\.\d+)?)([kKmM])$/, "$1 $2");
  }

  /** Basic HTML entity escaping to prevent injection in dynamic strings. */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /** Render a single gallery page (paginate client-side). */
  function renderPage(page) {
    currentPage = page;
    let active;
    if (filteredImages.length) {
      active = filteredImages;
    } else if (filtersActive) {
      active = [];
    } else {
      active = allImages;
    }
    const start = (page - 1) * pageSize;
    const slice = active.slice(start, start + pageSize);
    galleryEl.setAttribute("aria-busy", "true");
    if (!slice.length && filtersActive) {
      galleryEl.innerHTML = `<p class="gallery-empty" style="padding:1rem;color:#9b9ba1;">No images match your filters.</p>`;
    } else {
      galleryEl.innerHTML = slice
        .map((item, i) => figureTemplate(item, start + i))
        .join("");
    }
    galleryEl.setAttribute("aria-busy", "false");
    if (slice.length) attachFigureHandlers();
    renderPagination();
  }

  /** Build / rebuild pagination control beneath the gallery. */
  function renderPagination() {
    // Remove old pagination nav if any
    const existing = document.querySelector(".gallery-pagination");
    if (existing) existing.remove();
    const active = filteredImages.length ? filteredImages : allImages;
    const totalPages = Math.ceil(active.length / pageSize) || 1;
    if (totalPages <= 1) return; // nothing to paginate

    const nav = document.createElement("nav");
    nav.className = "gallery-pagination";
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", "Gallery pagination");

    function pageButton(p) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = p;
      btn.className = "page-btn";
      if (p === currentPage) {
        btn.disabled = true;
        btn.setAttribute("aria-current", "page");
      }
      btn.addEventListener("click", () => renderPage(p));
      return btn;
    }

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "arrow prev";
    prev.textContent = "Previous";
    prev.disabled = currentPage === 1;
    prev.addEventListener(
      "click",
      () => currentPage > 1 && renderPage(currentPage - 1)
    );
    nav.appendChild(prev);

    const centerGroup = document.createElement("div");
    centerGroup.className = "numbers";
    const track = document.createElement("div");
    track.className = "numbers-track";

    // Build list of pages (simple version: show all if <= 7, else show first, current neighbors, last)
    let pages = [];
    if (totalPages <= 7) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      pages.push(1);
      const windowStart = Math.max(2, currentPage - 1);
      const windowEnd = Math.min(totalPages - 1, currentPage + 1);
      if (windowStart > 2) pages.push("ellipsis-start");
      for (let p = windowStart; p <= windowEnd; p++) pages.push(p);
      if (windowEnd < totalPages - 1) pages.push("ellipsis-end");
      pages.push(totalPages);
    }

    pages.forEach((p) => {
      if (typeof p === "number") {
        track.appendChild(pageButton(p));
      } else {
        const span = document.createElement("span");
        span.className = "ellipsis";
        span.textContent = "...";
        track.appendChild(span);
      }
    });

    centerGroup.appendChild(track);
    nav.appendChild(centerGroup);

    const next = document.createElement("button");
    next.type = "button";
    next.className = "arrow next";
    next.textContent = "Next";
    next.disabled = currentPage === totalPages;
    next.addEventListener(
      "click",
      () => currentPage < totalPages && renderPage(currentPage + 1)
    );
    nav.appendChild(next);

    // Insert after gallery
    galleryEl.parentElement.appendChild(nav);
  }

  /** Parse views string to numeric for sorting/filtering (e.g., '1.2k' => 1200). */
  function parseViewsString(str) {
    const s = String(str)
      .trim()
      .toLowerCase()
      .replace(/[,\s]+/g, "");
    const match = s.match(/^(\d+(?:\.\d+)?)([km])?$/);
    if (!match) return parseInt(str, 10) || 0;
    const num = parseFloat(match[1]);
    const suffix = match[2];
    if (suffix === "k") return Math.round(num * 1000);
    if (suffix === "m") return Math.round(num * 1000000);
    return Math.round(num);
  }

  /** Apply current filter state to allImages => filteredImages. */
  function applyFilters(silent = false) {
    const rawQuery = filterSearch?.value || "";
    const searchTerm = normalizeText(rawQuery);
    const rawMinViews = parseViewsString(filterMinViews?.value || "0");
    const selectedColor = (filterColor?.value || "").toLowerCase();
    const sortBy = filterSort?.value || "newest";

    // Only treat slider value as active if user actually moved it (minViewsDirty)
    const effectiveMinViews = viewRangePreset
      ? 0 // overridden by preset range
      : minViewsDirty
      ? rawMinViews
      : 0;

    filtersActive = Boolean(
      searchTerm ||
        viewRangePreset ||
        effectiveMinViews > 0 ||
        (selectedColor && selectedColor !== "any")
    );

    // Build index lazily for search
    ensureSearchIndex();
    const parsedQuery = parseQuery(rawQuery);

    // Pre-apply non-search constraints, then score remaining
    const prelim = allImages.filter((img) => {
      const numericViews = parseViewsString(img.views || 0);
      if (viewRangePreset) {
        if (
          numericViews < viewRangePreset.min ||
          numericViews > viewRangePreset.max
        )
          return false;
      } else if (effectiveMinViews > 0 && numericViews < effectiveMinViews) {
        return false; // only enforce if user touched slider
      }
      if (selectedColor && selectedColor !== "any") {
        const palette = Array.isArray(img.colors)
          ? img.colors.map((c) => String(c).toLowerCase())
          : [];
        const detected = img._detectedColors ? [...img._detectedColors] : [];
        const combined = new Set([...palette, ...detected]);
        // include aliases for color precision
        const colorToCheck = applyColorAliases(selectedColor);
        if (!combined.has(colorToCheck)) return false;
      }
      return true;
    });

    if (searchTerm) {
      const scored = prelim
        .map((img) => ({ img, score: scoreItem(img, parsedQuery) }))
        .filter((x) => x.score > 0);
      // Tie-breakers: relevance, then views, then recency
      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const bv = parseViewsString(b.img.views || 0);
        const av = parseViewsString(a.img.views || 0);
        if (bv !== av) return bv - av;
        return (b.img.created || 0) - (a.img.created || 0);
      });
      filteredImages = scored.map((s) => s.img);
    } else {
      filteredImages = prelim.slice();
    }

    if (sortBy === "relevance" && searchTerm) {
      // Already sorted by relevance above; keep ordering
    } else if (sortBy === "newest") {
      filteredImages.sort((a, b) => (b.created || 0) - (a.created || 0));
    } else if (sortBy === "oldest") {
      filteredImages.sort((a, b) => (a.created || 0) - (b.created || 0));
    } else if (sortBy === "views-desc") {
      filteredImages.sort(
        (a, b) =>
          parseViewsString(b.views || 0) - parseViewsString(a.views || 0)
      );
    } else if (sortBy === "views-asc") {
      filteredImages.sort(
        (a, b) =>
          parseViewsString(a.views || 0) - parseViewsString(b.views || 0)
      );
    } else if (sortBy === "title-asc") {
      filteredImages.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "")
      );
    } else if (sortBy === "title-desc") {
      filteredImages.sort((a, b) =>
        (b.title || "").localeCompare(a.title || "")
      );
    }

    if (filterMatchCount) {
      filterMatchCount.textContent = `${filteredImages.length}`;
    }

    if (!silent) renderPage(1);
  }

  /** Reset all filters to default state. */
  function resetFilters() {
    if (filterSearch) filterSearch.value = "";
    if (filterMinViews) filterMinViews.value = "0";
    if (filterColor) filterColor.value = ""; // matches 'Any Color' option
    if (filterSort) filterSort.value = "newest"; // reset explicit sort
    viewRangePreset = null;
    minViewsDirty = false;
    document
      .querySelectorAll("[data-views-preset]")
      .forEach((chip) => chip.setAttribute("aria-pressed", "false"));
    updateMinViewsDisplay();
    applyFilters();
  }

  /** Update the displayed value for the range slider. */
  function updateMinViewsDisplay() {
    if (filterMinViewsValue && filterMinViews) {
      const val = parseViewsString(filterMinViews.value);
      filterMinViewsValue.textContent =
        val === 0 ? "Any" : formatViews(String(val));
    }
  }

  /** Attach event handlers to figure elements. */
  function attachFigureHandlers() {
    galleryEl.querySelectorAll(".bento-item").forEach((fig) => {
      fig.addEventListener("click", () => {
        const id = fig.getAttribute("data-id");
        if (id) navigateToSelected(id);
      });
      fig.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const id = fig.getAttribute("data-id");
          if (id) navigateToSelected(id);
        }
      });
    });
  }

  /** Navigate to selected photo view. */
  function navigateToSelected(id) {
    // Store the selected photo ID for the selected photo view
    try {
      sessionStorage.setItem("selectedPhotoId", id);
    } catch (e) {}

    // Use the global showPanelByName function if available
    if (window.showPanelByName) {
      window.showPanelByName("selectedphoto");
    } else {
      // Fallback to hash navigation
      location.hash = `#selectedphoto-${id}`;
    }
  }

  /** Check for deep link to selected photo. */
  function checkSelectedPhotoDeepLink() {
    const hash = location.hash;
    const match = hash.match(/^#selectedphoto-(\d+)$/);
    if (match) {
      const id = match[1];
      try {
        sessionStorage.setItem("selectedPhotoId", id);
      } catch (e) {}
    }
  }

  /** Fetch images JSON (supports { images: [] } or bare array). */
  async function loadImages() {
    try {
      const res = await fetch("../data/images.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load images.json: " + res.status);
      const data = await res.json();
      allImages = Array.isArray(data)
        ? data
        : Array.isArray(data.images)
        ? data.images
        : [];
      allImages.forEach((img, i) => {
        if (img.id == null) img.id = i + 1;
        // derive synthetic created timestamp (for sorting demo) if missing
        if (!img.created) {
          // distribute pseudo dates backwards from now
          img.created = Date.now() - i * 86400000; // i days ago
        }
      });
      // Select promoted set: top 6 by numeric views
      promotedImages = [...allImages]
        .sort(
          (a, b) =>
            parseViewsString(b.views || 0) - parseViewsString(a.views || 0)
        )
        .slice(0, 6);
      if (promotedSub) promotedSub.textContent = `Refreshes weekly`;
      renderPromoted();
      applyFilters(true); // initialize counts silently
      renderPage(1); // show unfiltered first view
      checkSelectedPhotoDeepLink();
      // Kick off color detection asynchronously (non-blocking)
      runAutoColorDetection();
    } catch (err) {
      console.error(err);
      galleryEl.innerHTML = `<p style="padding:1rem;color:#f66;">Failed to load gallery.</p>`;
    }
  }

  // Filter event listeners (deferred apply model)
  if (filterMinViews) {
    filterMinViews.addEventListener("input", () => {
      updateMinViewsDisplay();
      // mark slider as intentionally changed
      minViewsDirty = true;
    });
  }
  if (filterApplyBtn) {
    filterApplyBtn.addEventListener("click", () => applyFilters());
  }
  if (filterResetBtn) {
    filterResetBtn.addEventListener("click", resetFilters);
  }

  // No live auto-update: results change only when Search/Reset is clicked

  // View range preset chips logic
  document.querySelectorAll("[data-views-preset]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const active = chip.getAttribute("aria-pressed") === "true";
      // Toggle off if already active
      if (active) {
        chip.setAttribute("aria-pressed", "false");
        viewRangePreset = null;
        // Wait for explicit Search click
        return;
      }
      // Deactivate others
      document
        .querySelectorAll("[data-views-preset]")
        .forEach((c) => c.setAttribute("aria-pressed", "false"));
      chip.setAttribute("aria-pressed", "true");
      const range = chip.getAttribute("data-views-preset"); // e.g. 1000-3000
      const [minStr, maxStr] = range.split("-");
      const min = parseInt(minStr, 10) || 0;
      const max = parseInt(maxStr, 10) || 0;
      viewRangePreset = { min, max };
      // Sync slider to lower bound for visual consistency
      if (filterMinViews) {
        filterMinViews.value = String(min);
        updateMinViewsDisplay();
      }
      // Do not auto-apply; user must press Search
    });
  });

  // Initialize displays
  updateMinViewsDisplay();

  // Load gallery data
  loadImages();

  // Fetch footer content
  fetchFooter.innerHTML = `
    <ul>
      <li><a href="#" data-tab="careers">Careers</a></li>
      <li><a href="#" data-tab="events">About Us</a></li>
      <li><a href="#" data-tab="perminov-pro">Try Perminov Pro</a></li>
      <li><a href="#" data-tab="terms-of-service">Terms of Service</a></li>
      <li><a href="#" data-tab="privacy-policy">Privacy Policy</a></li>
      <li><a href="#" data-tab="help-center">Help Center</a></li>
    </ul>
  `;
});
