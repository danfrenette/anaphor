# Domain vocabulary

- **Design system**: the independent package owning shared tokens, styles, and
  controls used by consuming projects.
- **Reference manual**: the demo application consuming the design system and
  demonstrating its supported behavior and bounded experiments.
- **Registry consumer**: a project that installs and owns a copy of the design
  system’s distributed source.
- **Button**: an action control owning interaction state, appearance, and spacing
  between its label and icons.
- **Button label**: one coherent text phrase inside a Button, including
  interpolated values and inline formatting; owns optical text alignment.

- **Authored diagram**: a reference-manual illustration whose connections and
  sequences are chosen by its author, rather than edited by its viewer.
- **Diagram playback**: one authored diagram’s active sequence, including its
  concurrent branches and transient visual feedback.
- **Connection direction**: the attachment sides and route linking two nodes.
- **Reverse playback**: travel backward along an existing connection, without
  changing its attachment sides or route.

- **Private tour**: an owner-only explanation of a change, with pinned pull-request
  provenance and authored reader sections at a stable URL.
- **Device request**: a pending request from an authoring CLI for the owner to
  review and explicitly approve or deny in the browser.
- **Private access**: the owner's permission to read or publish a private tour
  during an authenticated session for a selected environment.

## Tour evidence

- **Review step**: One action or responsibility in the implementation path of a tour section.
- **Evidence record**: An immutable account of one check, including its action,
  expected and observed outcomes, result, tested source, and execution context.
- **Applicability**: Whether an evidence record supports the current source state:
  current, stale, or unknown. It does not change the recorded result.
- **Supersession**: A newer record replaces an older record for the same criterion.
  The older record remains part of the history.
- **Asset**: Captured media or a receipt identified by its content hash and provenance.
- **Callout**: A numbered explanation at a normalized location in a screenshot.
- **Video moment**: A labelled timestamp that explains a point in a recording.
- **Authored region**: A source range selected by the tour author for explanation.
  It remains separate from a reader's temporary code selection.
