const parseTorrentTitle = require('parse-torrent-title');

const LANGUAGE_FILTERS = [
  'English',
  'Tamil',
  'Hindi',
  'Malayalam',
  'Kannada',
  'Telugu',
  'Chinese',
  'Russian',
  'Arabic',
  'Japanese',
  'Korean',
  'Taiwanese',
  'Latino',
  'French',
  'Spanish',
  'Portuguese',
  'Italian',
  'German',
  'Ukrainian',
  'Polish',
  'Czech',
  'Thai',
  'Indonesian',
  'Vietnamese',
  'Dutch',
  'Bengali',
  'Turkish',
  'Greek',
  'Swedish',
  'Romanian',
  'Hungarian',
  'Finnish',
  'Norwegian',
  'Danish',
  'Hebrew',
  'Lithuanian',
  'Punjabi',
  'Marathi',
  'Gujarati',
  'Bhojpuri',
  'Nepali',
  'Urdu',
  'Tagalog',
  'Filipino',
  'Malay',
  'Mongolian',
  'Armenian',
  'Georgian'
];

const LANGUAGE_SYNONYMS = {
  English: ['english', 'ingles', 'inglés', 'anglais', 'englisch', 'en subtitles', 'eng'],
  Tamil: ['tamil', 'tam'],
  Hindi: ['hindi', 'hind', 'hin', 'hindustani'],
  Malayalam: ['malayalam', 'mal'],
  Kannada: ['kannada', 'kan'],
  Telugu: ['telugu', 'tel'],
  Chinese: ['chinese', 'chs', 'chi', 'mandarin'],
  Russian: ['russian', 'rus', 'russk'],
  Arabic: ['arabic', 'ara', 'arab'],
  Japanese: ['japanese', 'jap', 'jpn'],
  Korean: ['korean', 'kor'],
  Taiwanese: ['taiwanese', 'taiwan'],
  Latino: ['latino', 'latin spanish', 'lat'],
  French: ['french', 'français', 'fra', 'fre', 'vostfr'],
  Spanish: ['spanish', 'español', 'esp', 'spa'],
  Portuguese: ['portuguese', 'portugues', 'por', 'ptbr', 'brazilian'],
  Italian: ['italian', 'italiano', 'ita'],
  German: ['german', 'deutsch', 'ger', 'deu'],
  Ukrainian: ['ukrainian', 'ukr'],
  Polish: ['polish', 'polski', 'pol'],
  Czech: ['czech', 'cesky', 'cz', 'cze', 'ces'],
  Thai: ['thai'],
  Indonesian: ['indonesian', 'indo', 'id'],
  Vietnamese: ['vietnamese', 'viet'],
  Dutch: ['dutch', 'nederlands', 'dut', 'nld'],
  Bengali: ['bengali', 'bangla'],
  Turkish: ['turkish', 'turk', 'trk', 'tur'],
  Greek: ['greek', 'ellinika'],
  Swedish: ['swedish', 'svenska', 'swe'],
  Romanian: ['romanian', 'romana'],
  Hungarian: ['hungarian', 'magyar', 'hun'],
  Finnish: ['finnish', 'suomi', 'fin'],
  Norwegian: ['norwegian', 'norsk', 'nor'],
  Danish: ['danish', 'dansk', 'dan'],
  Hebrew: ['hebrew', 'heb'],
  Lithuanian: ['lithuanian', 'lietuvos', 'lit'],
  Punjabi: ['punjabi', 'panjabi', 'pan'],
  Marathi: ['marathi', 'mar'],
  Gujarati: ['gujarati', 'guj'],
  Bhojpuri: ['bhojpuri'],
  Nepali: ['nepali', 'nep'],
  Urdu: ['urdu'],
  Tagalog: ['tagalog'],
  Filipino: ['filipino'],
  Malay: ['malay', 'bahasa melayu'],
  Mongolian: ['mongolian'],
  Armenian: ['armenian'],
  Georgian: ['georgian']
};

const LANGUAGE_PATTERNS = Object.fromEntries(
  LANGUAGE_FILTERS.map((language) => {
    const tokens = LANGUAGE_SYNONYMS[language] || [language];
    const patterns = tokens.map((token) => buildLanguagePattern(token));
    return [language, patterns];
  })
);

const RESOLUTION_PREFERENCES = [
  '4320p',
  '2160p',
  '1440p',
  '1080p',
  '720p',
  '576p',
  '540p',
  '480p',
  '360p',
  '240p'
];

const RESOLUTION_NUMERIC_PATTERNS = [
  { label: '4320p', regex: /\b4320p\b/i },
  { label: '2160p', regex: /\b2160p\b/i },
  { label: '1440p', regex: /\b1440p\b/i },
  { label: '1080p', regex: /\b1080p\b|fullhd|fhd/i },
  { label: '720p', regex: /\b720p\b|hd\b/i },
  { label: '576p', regex: /\b576p\b/i },
  { label: '540p', regex: /\b540p\b/i },
  { label: '480p', regex: /\b480p\b|sd\b/i },
  { label: '360p', regex: /\b360p\b/i },
  { label: '240p', regex: /\b240p\b/i }
];

const RESOLUTION_SYNONYM_PATTERNS = [
  { label: '4320p', regex: /\b8k\b/i },
  { label: '2160p', regex: /\b(4k|uhd)\b/i },
];

const QUALITY_SCORE_MAP = RESOLUTION_PREFERENCES.reduce((acc, label, index) => {
  acc[label] = RESOLUTION_PREFERENCES.length - index;
  return acc;
}, {});

// Audio codec detection
const AUDIO_CODECS = [
  { name: 'Atmos', patterns: [/atmos/i, /dd\+?atmos/i] },
  { name: 'DTS-HD.MA', patterns: [/dts[\s.-]?hd[\s.-]?ma/i, /dts-hd\.ma/i] },
  { name: 'DTS-HD.HRA', patterns: [/dts[\s.-]?hd[\s.-]?hra/i] },
  { name: 'DTS-X', patterns: [/dts[\s.-]?x\b/i] },
  { name: 'TrueHD', patterns: [/truehd/i, /true[\s.-]?hd/i] },
  { name: 'DTS', patterns: [/\bdts\b/i] },
  { name: 'DD+', patterns: [/dd\+|ddp|e-?ac-?3/i] },
  { name: 'DD', patterns: [/\bdd[\s.]?[257]\.?[01]\b/i, /ac-?3/i] },
  { name: 'AAC', patterns: [/\baac\b/i] },
  { name: 'MP3', patterns: [/\bmp3\b/i] },
  { name: 'FLAC', patterns: [/\bflac\b/i] },
  { name: 'PCM', patterns: [/\bpcm\b/i] },
];

// Video codec detection
const VIDEO_CODECS = [
  { name: 'HEVC', patterns: [/\bhevc\b/i, /\bh\.?265\b/i, /\bx265\b/i] },
  { name: 'AVC', patterns: [/\bavc\b/i, /\bh\.?264\b/i, /\bx264\b/i] },
  { name: 'AV1', patterns: [/\bav1\b/i] },
  { name: 'VP9', patterns: [/\bvp9\b/i] },
  { name: 'MPEG-2', patterns: [/mpeg-?2/i] },
];

// Source detection
const SOURCES = [
  { name: 'Remux', patterns: [/remux/i], rank: 10 },
  { name: 'BluRay', patterns: [/blu-?ray/i, /\bbrrip\b/i, /\bbdrip\b/i], rank: 9 },
  { name: 'WEB-DL', patterns: [/web-?dl/i, /webdl/i], rank: 8 },
  { name: 'WEBRip', patterns: [/web-?rip/i, /webrip/i], rank: 7 },
  { name: 'HDTV', patterns: [/hdtv/i], rank: 6 },
  { name: 'DVDRip', patterns: [/dvdrip/i], rank: 5 },
  { name: 'DVD', patterns: [/\bdvd\b/i], rank: 4 },
  { name: 'CAM', patterns: [/\bcam\b/i, /hdcam/i], rank: 2 },
  { name: 'TS', patterns: [/\bts\b/i, /telesync/i], rank: 1 },
];

// HDR detection
const HDR_TYPES = [
  { name: 'DV', patterns: [/\bdv\b/i, /dolby[\s.-]?vision/i, /dovi/i] },
  { name: 'HDR10+', patterns: [/hdr10\+/i, /hdr10plus/i] },
  { name: 'HDR10', patterns: [/hdr10\b/i] },
  { name: 'HDR', patterns: [/\bhdr\b/i] },
  { name: 'HLG', patterns: [/\bhlg\b/i] },
  { name: 'SDR', patterns: [/\bsdr\b/i] },
];

// Edition detection
const EDITIONS = [
  'IMAX',
  'Extended',
  'Director\'s Cut',
  'Theatrical',
  'Unrated',
  'Remastered',
  'Hybrid',
  'Criterion',
  'Uncut',
  'Anniversary'
];

function buildLanguagePattern(token) {
  if (token instanceof RegExp) return token;
  const normalized = token.trim().toLowerCase();
  if (!normalized) {
    return /$a/; // never matches
  }
  if (normalized.includes(' ')) {
    return new RegExp(normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
}

function detectLanguages(title) {
  const normalizedTitle = (title || '').toLowerCase();
  if (!normalizedTitle) return [];
  const matches = new Set();
  for (const [language, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(normalizedTitle))) {
      matches.add(language);
    }
  }
  return Array.from(matches);
}

function detectResolution(rawTitle, parsed) {
  if (parsed?.resolution) {
    const normalized = normalizeResolutionLabel(parsed.resolution);
    if (normalized) return normalized;
  }
  const title = rawTitle || '';
  for (const entry of RESOLUTION_NUMERIC_PATTERNS) {
    if (entry.regex.test(title)) {
      return entry.label;
    }
  }
  if (parsed?.quality) {
    const normalized = normalizeResolutionLabel(parsed.quality);
    if (normalized) return normalized;
  }
  for (const entry of RESOLUTION_SYNONYM_PATTERNS) {
    if (entry.regex.test(title)) {
      return entry.label;
    }
  }
  return null;
}

function normalizeResolutionLabel(label) {
  if (label === undefined || label === null) return null;
  const value = label.toString().toLowerCase();
  if (!value) return null;
  if (value.includes('4320') || value.includes('8k')) return '4320p';
  if (value.includes('2160') || value.includes('4k') || value.includes('uhd')) return '2160p';
  if (value.includes('1440')) return '1440p';
  if (value.includes('1080')) return '1080p';
  if (value.includes('720')) return '720p';
  if (value.includes('576')) return '576p';
  if (value.includes('540')) return '540p';
  if (value.includes('480')) return '480p';
  if (value.includes('360')) return '360p';
  if (value.includes('240')) return '240p';
  return null;
}

function detectPattern(title, patterns) {
  for (const item of patterns) {
    if (item.patterns.some(p => p.test(title))) {
      return item.name;
    }
  }
  return null;
}

function detectAudioCodec(title) {
  return detectPattern(title, AUDIO_CODECS);
}

function detectVideoCodec(title) {
  return detectPattern(title, VIDEO_CODECS);
}

function detectSource(title) {
  const match = SOURCES.find(s => s.patterns.some(p => p.test(title)));
  return match ? { name: match.name, rank: match.rank } : null;
}

function detectHDR(title) {
  return detectPattern(title, HDR_TYPES);
}

function detectEdition(title) {
  const found = [];
  for (const edition of EDITIONS) {
    const pattern = new RegExp(`\\b${edition.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(title)) {
      found.push(edition);
    }
  }
  return found.length > 0 ? found : null;
}

function extractReleaseGroup(title) {
  // Release group is usually at the end after a dash or in brackets
  const match = title.match(/[-.]([A-Za-z0-9]+)$/);
  return match ? match[1] : null;
}

function parseReleaseMetadata(title) {
  const rawTitle = typeof title === 'string' ? title : '';
  const parsed = (() => {
    try {
      return parseTorrentTitle(rawTitle) || {};
    } catch (error) {
      return {};
    }
  })();
  
  const resolution = detectResolution(rawTitle, parsed);
  const languages = detectLanguages(rawTitle);
  const qualityLabel = parsed.quality || parsed.source || parsed.codec || null;
  const qualityScore = QUALITY_SCORE_MAP[resolution] || 0;
  
  // NEW EXTRACTIONS
  const audioCodec = detectAudioCodec(rawTitle);
  const videoCodec = detectVideoCodec(rawTitle);
  const source = detectSource(rawTitle);
  const hdr = detectHDR(rawTitle);
  const edition = detectEdition(rawTitle);
  const releaseGroup = extractReleaseGroup(rawTitle);

  return {
    resolution,
    languages,
    qualityLabel,
    qualityScore,
    audioCodec,
    videoCodec,
    source: source?.name || null,
    sourceRank: source?.rank || 0,
    hdr,
    edition,
    releaseGroup,
  };
}

module.exports = {
  LANGUAGE_FILTERS,
  LANGUAGE_SYNONYMS,
  parseReleaseMetadata,
};