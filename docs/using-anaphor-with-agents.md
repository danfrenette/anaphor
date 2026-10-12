# Use Anaphor with an agent

The reusable skill draft lives in [`skills/anaphor`](../skills/anaphor/SKILL.md). It supports Paper design, code implementation, and consistency review. It reads current sources rather than embedding a duplicate palette or component catalog.

## Try the draft

Attach `skills/anaphor/SKILL.md` or give the agent its full path. Keep `paper.md` and `implementation.md` beside it so its branch references resolve. For a different project, also provide the Anaphor checkout location or repository access.

Example requests:

> Use the Anaphor skill at [path to SKILL.md]. Design a minimal article page in Paper in a new project file, with Light and Carbon versions. Use the system's existing typography and reading layout; flag missing patterns before inventing new ones.

> Use the Anaphor skill at [path to SKILL.md]. Build this settings page in this repository using the existing Anaphor components. Inspect the project setup before installing anything. The Anaphor source checkout is [path].

> Use the Anaphor skill at [path to SKILL.md] to review this page for system consistency. Report differences without changing it.

## Make it available across projects

Check the installed skill's authorship before selecting its destination. The
personal [software factory](https://github.com/danfrenette/skills/tree/main/skills/software-factory)
also names its coordinator `anaphor`; it is a different skill from this
repository's design-system guide. Install that nine-skill family together from
`danfrenette/skills`. Do not replace its coordinator with this guide.

When the factory already occupies `~/.agents/skills/anaphor`, read this guide
directly from the checkout, including its adjacent references. Alternatively,
choose an unused destination with `--destination` and confirm how your harness
discovers skill names from frontmatter; a different folder name alone does not
resolve two skills declaring `name: anaphor`. The installer deliberately reports
the conflict and leaves the existing skill untouched.

In the managed workspace, `/workspace/.agents/skills` is a harness-provided
discovery location. Node's home directory can still be `/home/agent`, so the
installer's default `~/.agents/skills` does not automatically target that workspace
path. Use an explicit `--destination` for a different harness location and inspect
the existing skill there first. A supplied archive/copy is not a live source link.

From a local Anaphor checkout, run:

```sh
node scripts/install-skill.mjs
```

This links the complete skill into `~/.agents/skills/anaphor`, the shared personal
skill location used by this project. It needs Node.js but no dependency install
or network access. Running it again is safe; an existing directory or different
link is left untouched and reported as a conflict.

For an agent that reads a different skill directory, pass the complete destination:

```sh
node scripts/install-skill.mjs --destination "$HOME/.codex/skills/anaphor"
```

Choose one location your agent discovers. Keep the checkout in place: this is a
live link, so local edits and pulled updates become available without reinstalling.
To use a frozen snapshot instead, copy the complete `skills/anaphor` directory to
an unused personal skill location. Reopen your agent session and confirm
`anaphor` appears in its available skills.

Once discovered, use `$anaphor` explicitly or say “design this page using the Anaphor system.” The skill's description covers that phrase, but availability and automatic selection depend on the agent loading the installed skill. The repository draft by itself is not a global installation.

The skill does not bundle components or fonts, grant private-repository access, or create a synchronized Paper library. The source repository remains authoritative for implementation; Paper supplies the saved visual references. Installation and token copying are separate steps handled by the selected workflow.

## Draft checks

Test the installer without touching personal skills:

```sh
node --test scripts/install-skill.test.mjs
```

Before promoting an edited skill, run these scenarios with a fresh agent and inspect its actions, not whether it repeats the instructions:

| Request / condition | Expected observable behavior |
| --- | --- |
| Design an article in a new Paper file | Inspects Anaphor, creates or requests a separate destination, verifies copied token bindings and fonts; preserves the source file. |
| Implement a settings page in another repository | Inspects compatibility and installed source; follows the registry path rather than installing the private workspace package from npm. |
| Review a screen only | Reports evidence-backed differences without mutations. |
| Paper or private source access is unavailable | Identifies the blocked branch and requests the missing access or reference; makes no completion claim. |
| Existing consumer has customized components | Preserves those changes and scopes any upstream update explicitly. |

For a rule whose value is uncertain, compare runs with and without it. Keep changes that alter the desired behavior. Structural validation and a manual walkthrough are useful draft checks, not a substitute for this fresh-agent evaluation.
