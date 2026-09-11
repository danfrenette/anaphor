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
