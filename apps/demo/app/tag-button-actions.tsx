"use client";

import { useState } from "react";
import { ButtonLabel, TagButton, Text } from "@anaphor/system";
import { ArrowUpRight, Plus, X } from "@phosphor-icons/react/dist/ssr";

export function TagButtonActions() {
  const [tags, setTags] = useState(["Research"]);
  const [origin, setOrigin] = useState(false);
  return <div className="space-y-4">
    <div className="flex flex-wrap items-start gap-2" role="group" aria-label="Tag actions">
      {["Research", "Analysis"].map(label => {
        const assigned = tags.includes(label);
        return <TagButton key={label} size="xs" tone="neutral" variant={assigned ? "soft" : "outline"} loading={false}
          aria-label={`${assigned ? "Remove" : "Add"} ${label}`}
          onClick={() => setTags(current => assigned ? current.filter(tag => tag !== label) : [...current, label])}>
          {!assigned && <Plus aria-hidden="true" />}
          <ButtonLabel>{label}</ButtonLabel>
          {assigned && <X aria-hidden="true" />}
        </TagButton>;
      })}
      <TagButton size="xs" tone="neutral" variant="soft" loading={false} aria-label="Inspect Methods on Research notes" aria-expanded={origin} aria-controls="tag-origin" onClick={() => setOrigin(!origin)}>
        <ButtonLabel>Methods <span className="font-normal">from Research notes</span></ButtonLabel>
        <ArrowUpRight aria-hidden="true" />
      </TagButton>
    </div>
    <Text as="p" variant="caption">Assigned tags: {tags.length ? tags.join(", ") : "None"}</Text>
    {origin && <Text as="p" variant="caption" id="tag-origin">Methods belongs to Research notes. Manage it on that source.</Text>}
  </div>;
}
