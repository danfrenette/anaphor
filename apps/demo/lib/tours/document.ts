export type TourProvenance = {
  repository: string;
  pullRequest: number;
  revision: string;
};

export type TourSection = {
  id: string;
  heading: string;
  body: string;
};

export type TourDocument = {
  schemaVersion: 1;
  title: string;
  overview: string;
  provenance: TourProvenance[];
  sections: TourSection[];
};

export type TourDiagnostic = {
  path: string;
  message: string;
};

export type TourValidation =
  | { ok: true; document: TourDocument }
  | { ok: false; diagnostics: TourDiagnostic[] };

const reservedSectionIds = new Set(["overview", "provenance"]);
const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const revisionPattern = /^[0-9a-f]{40}$/;
const sectionIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function add(diagnostics: TourDiagnostic[], path: string, message: string) {
  if (diagnostics.length < 20) diagnostics.push({ path, message });
}

function containsSecret(value: string, secrets: readonly string[]): boolean {
  return secrets.some((secret) => {
    if (value.includes(secret)) return true;
    const trimmed = secret.trim();
    return trimmed.length >= 16 && value.includes(trimmed);
  });
}

function readable(value: unknown, path: string, max: number, diagnostics: TourDiagnostic[], secrets: readonly string[]): string | null {
  if (typeof value !== "string") {
    add(diagnostics, path, "Expected text.");
    return null;
  }
  if (containsSecret(value, secrets)) {
    add(diagnostics, path, "Remove server credentials from this field before publishing.");
    return null;
  }
  const text = value.trim();
  if (!text) {
    add(diagnostics, path, "This text is required.");
    return null;
  }
  if (text.length > max) {
    add(diagnostics, path, `Use at most ${max} characters.`);
    return null;
  }
  return text;
}

function unknownKeys(record: Record<string, unknown>, allowed: readonly string[], path: string, diagnostics: TourDiagnostic[], secrets: readonly string[]) {
  for (const key of Object.keys(record)) {
    if (allowed.includes(key)) continue;
    const safePath = containsSecret(key, secrets) ? path : path ? `${path}.${key}` : key;
    add(diagnostics, safePath, "Remove this unsupported field.");
  }
}

export function validateTour(input: unknown, secrets: readonly string[]): TourValidation {
  const diagnostics: TourDiagnostic[] = [];
  if (!isRecord(input)) {
    return { ok: false, diagnostics: [{ path: "", message: "The tour document must be a JSON object." }] };
  }
  unknownKeys(input, ["schemaVersion", "title", "overview", "provenance", "sections"], "", diagnostics, secrets);

  if (input.schemaVersion !== 1) add(diagnostics, "schemaVersion", "schemaVersion must be 1.");
  const title = readable(input.title, "title", 200, diagnostics, secrets);
  const overview = readable(input.overview, "overview", 8_000, diagnostics, secrets);

  const provenance: TourProvenance[] = [];
  if (!Array.isArray(input.provenance)) {
    add(diagnostics, "provenance", "List the participating pull requests.");
  } else if (input.provenance.length < 1 || input.provenance.length > 20) {
    add(diagnostics, "provenance", "Include between 1 and 20 participating pull requests.");
  } else {
    input.provenance.forEach((entry, index) => {
      const path = `provenance[${index}]`;
      if (!isRecord(entry)) {
        add(diagnostics, path, "Each participating pull request must be an object.");
        return;
      }
      unknownKeys(entry, ["repository", "pullRequest", "revision"], path, diagnostics, secrets);
      const repository = readable(entry.repository, `${path}.repository`, 200, diagnostics, secrets);
      if (repository && !repositoryPattern.test(repository)) {
        add(diagnostics, `${path}.repository`, "Use a repository name like owner/name.");
      }
      const pullRequest = entry.pullRequest;
      if (typeof pullRequest !== "number" || !Number.isInteger(pullRequest) || pullRequest < 1) {
        add(diagnostics, `${path}.pullRequest`, "Use the pull request number.");
      }
      const revision = readable(entry.revision, `${path}.revision`, 40, diagnostics, secrets);
      if (revision && !revisionPattern.test(revision)) {
        add(diagnostics, `${path}.revision`, "Use the full 40-character lowercase commit SHA.");
      }
      if (repository && repositoryPattern.test(repository) && typeof pullRequest === "number" && Number.isInteger(pullRequest) && pullRequest >= 1 && revision && revisionPattern.test(revision)) {
        provenance.push({ repository, pullRequest, revision });
      }
    });
  }

  const sections: TourSection[] = [];
  const seen = new Set<string>();
  if (!Array.isArray(input.sections)) {
    add(diagnostics, "sections", "Include at least one reader section.");
  } else if (input.sections.length < 1 || input.sections.length > 30) {
    add(diagnostics, "sections", "Include between 1 and 30 reader sections.");
  } else {
    input.sections.forEach((entry, index) => {
      const path = `sections[${index}]`;
      if (!isRecord(entry)) {
        add(diagnostics, path, "Each reader section must be an object.");
        return;
      }
      unknownKeys(entry, ["id", "heading", "body"], path, diagnostics, secrets);
      const id = readable(entry.id, `${path}.id`, 64, diagnostics, secrets);
      if (id && !sectionIdPattern.test(id)) add(diagnostics, `${path}.id`, "Use a lowercase section id such as reader-notes.");
      if (id && reservedSectionIds.has(id)) add(diagnostics, `${path}.id`, "This section id is reserved.");
      if (id && seen.has(id)) add(diagnostics, `${path}.id`, "Section ids must be unique.");
      if (id) seen.add(id);
      const heading = readable(entry.heading, `${path}.heading`, 200, diagnostics, secrets);
      const body = readable(entry.body, `${path}.body`, 20_000, diagnostics, secrets);
      if (id && sectionIdPattern.test(id) && !reservedSectionIds.has(id) && heading && body && seen.has(id)) {
        const duplicate = sections.some((section) => section.id === id);
        if (!duplicate) sections.push({ id, heading, body });
      }
    });
  }

  if (diagnostics.length > 0 || !title || !overview || provenance.length === 0 || sections.length === 0) {
    return { ok: false, diagnostics: diagnostics.length > 0 ? diagnostics : [{ path: "", message: "The tour document is invalid." }] };
  }
  return { ok: true, document: { schemaVersion: 1, title, overview, provenance, sections } };
}
