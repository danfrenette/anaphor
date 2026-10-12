export const phases = ["selected", "uploading", "finishing", "processing", "complete", "upload-error", "processing-error"] as const;
export const scenarios = ["Steady", "Quick", "Unknown total", "Transfer failure", "Processing failure"] as const;
export type Phase = (typeof phases)[number];
export type Scenario = (typeof scenarios)[number];

export type UploadItem = {
  id: string;
  file: File;
  phase: Phase;
  fraction: number;
  unknown: boolean;
};

type Simulation = {
  startedAt: number;
  transferDuration: number;
  processingDuration: number;
  failure: "transfer" | "processing" | null;
  fromProcessing: boolean;
};

type SimulatedUpload = UploadItem & { simulation: Simulation | null };
type UploadState = {
  items: SimulatedUpload[];
  activeId: string | null;
  nextId: number;
  error: string;
  announcement: string;
};

type UploadAction =
  | { type: "select"; files: File[] }
  | { type: "start"; id: string | null; scenario: Scenario; now: number }
  | { type: "tick"; now: number }
  | { type: "cancel"; id: string }
  | { type: "remove"; id: string }
  | { type: "inspect"; id: string }
  | { type: "preview"; phase: Phase; fallbackFile: File; scenario: Scenario }
  | { type: "fraction"; fraction: number }
  | { type: "mixed"; files: File[] }
  | { type: "reset" };

export const initialUploadState: UploadState = {
  items: [], activeId: null, nextId: 1, error: "", announcement: "",
};

export function isBusy(phase: Phase) {
  return phase === "uploading" || phase === "finishing" || phase === "processing";
}

export function inspectedUpload(state: UploadState) {
  return state.items.find(item => item.id === state.activeId) ?? state.items[0];
}

function createUpload(file: File, id: number): SimulatedUpload {
  return { id: `file-${id}`, file, phase: "selected", fraction: 0, unknown: false, simulation: null };
}

function createUploads(files: File[], nextId: number) {
  return files.map((file, index) => createUpload(file, nextId + index));
}

function rejectionReason(file: File) {
  if (!/\.(pdf|md|txt)$/i.test(file.name)) return "choose PDF, Markdown, or plain text.";
  if (file.size > 10 * 1024 * 1024) return "over the demo’s 10 MB limit.";
  if (file.size === 0) return "the file is empty.";
  return null;
}

function startUpload(item: SimulatedUpload, scenario: Scenario, now: number): SimulatedUpload {
  const retry = item.phase === "upload-error" || item.phase === "processing-error";
  const fromProcessing = item.phase === "processing-error";
  return {
    ...item,
    phase: fromProcessing ? "processing" : "uploading",
    fraction: fromProcessing ? 1 : 0,
    unknown: scenario === "Unknown total",
    simulation: {
      startedAt: now,
      transferDuration: scenario === "Quick" ? 1600 : 2500 + Math.min(item.file.size / 256, 6000),
      processingDuration: scenario === "Quick" ? 900 : 2400,
      failure: retry ? null : scenario === "Transfer failure" ? "transfer" : scenario === "Processing failure" ? "processing" : null,
      fromProcessing,
    },
  };
}

function advanceUpload(item: SimulatedUpload, now: number): SimulatedUpload {
  const simulation = item.simulation;
  if (!simulation) return item;
  const elapsed = now - simulation.startedAt;
  const confirmationDuration = 700;
  const processingElapsed = simulation.fromProcessing ? elapsed : elapsed - simulation.transferDuration - confirmationDuration;
  let phase: Phase;
  let fraction = 1;

  if (!simulation.fromProcessing && simulation.failure === "transfer" && elapsed >= simulation.transferDuration * 0.45) {
    phase = "upload-error";
    fraction = 0.45;
  } else if (!simulation.fromProcessing && elapsed < simulation.transferDuration) {
    fraction = Math.min(1, Math.floor(elapsed / simulation.transferDuration * 20) / 20);
    phase = "uploading";
  } else if (!simulation.fromProcessing && elapsed < simulation.transferDuration + confirmationDuration) {
    phase = "finishing";
  } else if (simulation.failure === "processing" && processingElapsed >= simulation.processingDuration * 0.6) {
    phase = "processing-error";
  } else {
    phase = processingElapsed >= simulation.processingDuration ? "complete" : "processing";
  }

  if (item.phase === phase && item.fraction === fraction) return item;
  return { ...item, phase, fraction, simulation: isBusy(phase) ? simulation : null };
}

function phaseAnnouncement(phase: Phase) {
  switch (phase) {
    case "finishing": return "Transfer finished. Waiting for confirmation.";
    case "processing": return "Processing file.";
    case "complete": return "Upload complete.";
    case "upload-error":
    case "processing-error": return "Interrupted. Retry is available.";
    case "selected": return "Ready to upload.";
    case "uploading": return "Uploading file.";
  }
}

export function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case "select": {
      if (!action.files.length) return state;
      const accepted: File[] = [];
      const rejected: string[] = [];
      for (const file of action.files) {
        const reason = rejectionReason(file);
        if (reason) rejected.push(`${file.name}: ${reason}`);
        else accepted.push(file);
      }
      const added = createUploads(accepted, state.nextId);
      return {
        ...state,
        items: [...state.items, ...added],
        activeId: added[0]?.id ?? state.activeId,
        nextId: state.nextId + added.length,
        error: rejected.join(" "),
        announcement: added.length ? `${added.length} ${added.length === 1 ? "file" : "files"} added. Ready to upload.` : state.announcement,
      };
    }
    case "start": {
      let started = 0;
      let retrying = false;
      const items = state.items.map(item => {
        const eligible = action.id === null ? item.phase === "selected" : item.id === action.id && !isBusy(item.phase) && item.phase !== "complete";
        if (!eligible) return item;
        started += 1;
        retrying ||= item.phase === "upload-error" || item.phase === "processing-error";
        return startUpload(item, action.scenario, action.now);
      });
      if (!started) return state;
      return { ...state, items, announcement: `${retrying ? "Retrying" : "Uploading"} ${started} ${started === 1 ? "file" : "files"}.` };
    }
    case "tick": {
      const notices: string[] = [];
      let changed = false;
      const items = state.items.map(item => {
        const next = advanceUpload(item, action.now);
        changed ||= next !== item;
        if (next.phase !== item.phase) notices.push(`${item.file.name}: ${phaseAnnouncement(next.phase)}`);
        return next;
      });
      return changed ? { ...state, items, announcement: notices.length ? notices.join(" ") : state.announcement } : state;
    }
    case "cancel":
      return {
        ...state,
        items: state.items.map(item => item.id === action.id ? { ...item, phase: "selected", fraction: 0, unknown: false, simulation: null } : item),
        announcement: "Upload canceled. The selected file is kept; other uploads continue.",
      };
    case "remove":
      return { ...state, items: state.items.filter(item => item.id !== action.id), announcement: "File removed. Other files are kept." };
    case "inspect":
      return { ...state, activeId: action.id };
    case "preview": {
      const current = inspectedUpload(state);
      const item = current ?? createUpload(action.fallbackFile, state.nextId);
      const preview: SimulatedUpload = {
        ...item,
        phase: action.phase,
        fraction: action.phase === "uploading" || action.phase === "upload-error" ? 0.4 : action.phase === "selected" ? 0 : 1,
        unknown: action.scenario === "Unknown total",
        simulation: null,
      };
      return {
        ...state,
        items: current ? state.items.map(item => item.id === current.id ? preview : item) : [preview],
        activeId: preview.id,
        nextId: state.nextId + (current ? 0 : 1),
        announcement: "",
      };
    }
    case "fraction": {
      const active = inspectedUpload(state);
      return { ...state, items: state.items.map(item => item.id === active?.id ? { ...item, fraction: action.fraction } : item) };
    }
    case "mixed": {
      const items = createUploads(action.files, state.nextId).map((item, index): SimulatedUpload => ({
        ...item, phase: index === 0 ? "uploading" : index === 1 ? "complete" : "upload-error", fraction: index === 1 ? 1 : 0.4,
      }));
      return {
        ...state, items, activeId: items[0]?.id ?? null, nextId: state.nextId + items.length, error: "",
        announcement: "Showing independent uploading, complete, and failed files.",
      };
    }
    case "reset":
      return { ...initialUploadState, nextId: state.nextId };
  }
}
