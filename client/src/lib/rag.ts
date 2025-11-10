import { mapUserMessageToTags } from "./topicMapping";

const LOCAL_DATA_ROOT = "/local_data";
const KNOWLEDGE_BASE_PATH = `${LOCAL_DATA_ROOT}/knowledgeBase.json`;
const CACHE_PREFIX = "mate_persona_context";
const FALLBACK_TAG = "__none__";

interface KnowledgeBaseTopic {
  key: string;
  name?: string;
  specialty?: string;
  description?: string;
  datasetPath: string;
  entryCount?: number;
  domains?: string[];
  tags?: string[];
}

interface KnowledgeBaseIndex {
  topics: KnowledgeBaseTopic[];
}

interface SpecialistMeta {
  key: string;
  name?: string;
  specialty?: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface SpecialistEntry {
  domain?: string;
  title: string;
  content: string;
  source?: string;
  researcherAuthors?: string;
  publicationYear?: number;
  journalInstitution?: string;
  evidenceLevel?: string;
  tags?: string[];
}

interface SpecialistDataset {
  specialist: SpecialistMeta;
  knowledgeBase: SpecialistEntry[];
}

interface PersonaSnippet {
  title: string;
  content: string;
  source?: string;
  publicationYear?: number;
  evidenceLevel?: string;
  domain?: string;
  tags: string[];
}

interface PersonaContextResult {
  specialist: SpecialistMeta | null;
  snippets: PersonaSnippet[];
  context: string;
  tags: string[];
}

interface CachedPersonaContext {
  tags: string[];
  context: string;
  specialist: SpecialistMeta | null;
  snippets: PersonaSnippet[];
  timestamp: number;
}

const knowledgeIndexPromise: { current: Promise<KnowledgeBaseIndex | null> | null } = {
  current: null,
};

const datasetPromises = new Map<string, Promise<SpecialistDataset | null>>();

function normaliseTags(tags: string[]): string[] {
  if (!tags.length) return [FALLBACK_TAG];
  const normalised = tags.map((tag) => tag.toLowerCase()).filter(Boolean);
  if (!normalised.length) return [FALLBACK_TAG];
  normalised.sort();
  return normalised;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { cache: "force-cache" });
    if (!res.ok) {
      console.warn(`Failed to load ${path}: ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    console.warn(`Error fetching ${path}:`, error);
    return null;
  }
}

async function loadKnowledgeIndex(): Promise<KnowledgeBaseIndex | null> {
  if (!knowledgeIndexPromise.current) {
    knowledgeIndexPromise.current = fetchJson<KnowledgeBaseIndex>(KNOWLEDGE_BASE_PATH);
  }
  return knowledgeIndexPromise.current;
}

async function loadDataset(datasetPath: string): Promise<SpecialistDataset | null> {
  if (!datasetPromises.has(datasetPath)) {
    const normalisedPath = datasetPath.startsWith("/")
      ? datasetPath
      : `${LOCAL_DATA_ROOT}/${datasetPath.replace(/^\/+/, "")}`;

    datasetPromises.set(
      datasetPath,
      fetchJson<SpecialistDataset>(normalisedPath).then((data) => data)
    );
  }
  return datasetPromises.get(datasetPath) ?? null;
}

function buildSnippet(entry: SpecialistEntry): PersonaSnippet {
  const trimmedContent = entry.content.length > 700
    ? `${entry.content.slice(0, 697).trimEnd()}...`
    : entry.content;
  return {
    title: entry.title,
    content: trimmedContent,
    source: entry.source,
    publicationYear: entry.publicationYear,
    evidenceLevel: entry.evidenceLevel,
    domain: entry.domain,
    tags: Array.isArray(entry.tags) ? entry.tags : [],
  };
}

function buildContextBlock(meta: SpecialistMeta | null, snippets: PersonaSnippet[]): string {
  if (!meta && snippets.length === 0) {
    return "";
  }

  const headerLines: string[] = [];
  if (meta) {
    const personaName = meta.name || meta.key || "Specialist";
    const specialty = meta.specialty ? ` — ${meta.specialty}` : "";
    headerLines.push(`Persona: ${personaName}${specialty}`);
    if (meta.description) {
      headerLines.push(`Focus: ${meta.description}`);
    }
  }

  if (!snippets.length) {
    return headerLines.join("\n");
  }

  const snippetText = snippets
    .map((snippet, index) => {
      const lines: string[] = [];
      lines.push(`${index + 1}. ${snippet.title}`);
      if (snippet.source || snippet.publicationYear) {
        const details = [snippet.source, snippet.publicationYear?.toString()].filter(Boolean).join(", ");
        if (details) {
          lines.push(`   Source: ${details}`);
        }
      }
      if (snippet.evidenceLevel) {
        lines.push(`   Evidence: ${snippet.evidenceLevel}`);
      }
      if (snippet.tags.length) {
        lines.push(`   Tags: ${snippet.tags.slice(0, 6).join(", ")}`);
      }
      lines.push(`   Summary: ${snippet.content}`);
      return lines.join("\n");
    })
    .join("\n\n");

  return `${headerLines.join("\n")}${headerLines.length ? "\n\n" : ""}Evidence snippets:\n${snippetText}`;
}

function loadFromCache(cacheKey: string, tagSignature: string[]): PersonaContextResult | null {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const cached: CachedPersonaContext = JSON.parse(raw);
    const cachedSignature = normaliseTags(cached.tags);
    if (cachedSignature.join("|") !== tagSignature.join("|")) {
      return null;
    }
    return {
      specialist: cached.specialist,
      snippets: cached.snippets,
      context: cached.context,
      tags: cached.tags,
    };
  } catch (error) {
    console.warn("Failed to parse cached persona context", error);
    return null;
  }
}

function saveToCache(cacheKey: string, payload: PersonaContextResult): void {
  try {
    const data: CachedPersonaContext = {
      specialist: payload.specialist,
      snippets: payload.snippets,
      context: payload.context,
      tags: payload.tags,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to cache persona context", error);
  }
}

export async function getPersonaContext({
  specialistKey,
  userMessage,
  conversationId,
  detectedTags,
  snippetLimit = 3,
}: {
  specialistKey?: string | null;
  userMessage: string;
  conversationId: string;
  detectedTags?: string[];
  snippetLimit?: number;
}): Promise<PersonaContextResult> {
  const baseTags = Array.isArray(detectedTags) && detectedTags.length
    ? detectedTags
    : mapUserMessageToTags(userMessage);
  const tagSignature = normaliseTags(baseTags);
  const cacheKey = `${CACHE_PREFIX}_${conversationId}_${specialistKey || "general"}`;

  if (typeof localStorage !== "undefined") {
    const cached = loadFromCache(cacheKey, tagSignature);
    if (cached) {
      return cached;
    }
  }

  const knowledgeIndex = await loadKnowledgeIndex();
  if (!knowledgeIndex) {
    const emptyContext: PersonaContextResult = { specialist: null, snippets: [], context: "", tags: tagSignature };
    if (typeof localStorage !== "undefined") {
      saveToCache(cacheKey, emptyContext);
    }
    return emptyContext;
  }

  let datasetMeta: KnowledgeBaseTopic | undefined;
  if (specialistKey) {
    datasetMeta = knowledgeIndex.topics.find((topic) => topic.key === specialistKey);
  }
  if (!datasetMeta && knowledgeIndex.topics.length === 1) {
    datasetMeta = knowledgeIndex.topics[0];
  }

  if (!datasetMeta) {
    const emptyContext: PersonaContextResult = { specialist: null, snippets: [], context: "", tags: tagSignature };
    if (typeof localStorage !== "undefined") {
      saveToCache(cacheKey, emptyContext);
    }
    return emptyContext;
  }

  const dataset = await loadDataset(datasetMeta.datasetPath);
  if (!dataset) {
    const emptyContext: PersonaContextResult = { specialist: null, snippets: [], context: "", tags: tagSignature };
    if (typeof localStorage !== "undefined") {
      saveToCache(cacheKey, emptyContext);
    }
    return emptyContext;
  }

  const normalisedTagsSet = new Set(tagSignature.filter((tag) => tag !== FALLBACK_TAG));
  const filteredEntries = dataset.knowledgeBase
    .filter((entry) => {
      if (!normalisedTagsSet.size) return true;
      if (!entry.tags || !entry.tags.length) return false;
      const entryTags = entry.tags.map((tag) => tag.toLowerCase());
      for (const tag of normalisedTagsSet) {
        if (entryTags.some((entryTag) => entryTag.includes(tag))) {
          return true;
        }
      }
      return false;
    })
    .slice(0, snippetLimit);

  const snippets = (filteredEntries.length ? filteredEntries : dataset.knowledgeBase.slice(0, snippetLimit))
    .map(buildSnippet)
    .filter((snippet) => snippet.content);

  const contextBlock = buildContextBlock(dataset.specialist || null, snippets);

  const result: PersonaContextResult = {
    specialist: dataset.specialist || null,
    snippets,
    context: contextBlock,
    tags: tagSignature,
  };

  if (typeof localStorage !== "undefined") {
    saveToCache(cacheKey, result);
  }

  return result;
}
