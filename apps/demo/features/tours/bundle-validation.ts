import { createHash } from "node:crypto";
import type { TourAsset, TourDocument } from "./document";

export function validateAssetBytes(asset: TourAsset, bytes: Uint8Array) {
  if (bytes.length !== asset.bytes || createHash("sha256").update(bytes).digest("hex") !== asset.sha256) throw new Error(`Asset ${asset.id}: byte count or SHA-256 does not match.`);
  const value = Buffer.from(bytes);
  const valid = asset.mediaType === "image/png" ? value.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : asset.mediaType === "image/jpeg" ? value[0] === 255 && value[1] === 216 && value[2] === 255
    : asset.mediaType === "image/webp" ? value.toString("ascii", 0, 4) === "RIFF" && value.toString("ascii", 8, 12) === "WEBP"
    : asset.mediaType === "video/webm" ? value.subarray(0, 4).equals(Buffer.from([26,69,223,163]))
    : asset.mediaType === "video/mp4" ? value.toString("ascii", 4, 8) === "ftyp"
    : !value.includes(0) && (() => { try { new TextDecoder("utf-8", { fatal: true }).decode(value); return true; } catch { return false; } })();
  if (!valid) throw new Error(`Asset ${asset.id}: file content does not match supported ${asset.mediaType} format.`);
}
export function validateTourUpdate(previous: TourDocument, next: TourDocument) {
  if (previous.version !== 2) return;
  if (next.version !== 2) throw new Error("Version 2 tours cannot lose evidence through a version downgrade.");
  for (const record of previous.evidence) {
    const current = next.evidence.find((item) => item.id === record.id);
    if (!current) throw new Error(`Retain historical evidence ${record.id}; reruns require new IDs.`);
    const { assessments: before, ...original } = record;
    const { assessments: after, ...updated } = current;
    if (JSON.stringify(original) !== JSON.stringify(updated) || before.some((item, index) => JSON.stringify(item) !== JSON.stringify(after[index]))) throw new Error(`Evidence ${record.id} is immutable. Retain its run and append assessments or a superseding record.`);
  }
  for (const asset of previous.assets) {
    if (JSON.stringify(asset) !== JSON.stringify(next.assets.find((item) => item.id === asset.id))) throw new Error(`Retain historical asset ${asset.id} unchanged.`);
  }
}
