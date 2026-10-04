# Desktop bottom bars: reference research

Checked 2026-10-04. The supplied sketch shows a thin strip along the **entire bottom edge of a desktop application**, below a left rail, sidebar, main content, and right sidebar. This note treats that as an app-wide **status/utility bar** and compares concrete placement, content, and behavior.

## Short answer

**Linear is a direct structural and visual precedent.** A read-only inspection of the user's running Linear desktop app on 2026-10-04 showed a thin, dark utility bar spanning the entire window below the sidebar and content. It has a circular Help control at bottom left; at bottom right are an Agent control and a history/clock control. The accessibility tree named these **Open Help menu**, **Agent**, and **Chat history**. This is firsthand observation of the current app, not a claim established by public Linear documentation. No private project or workspace data is recorded here.

**VS Code is the clearest documented status-bar precedent.** Its [official layout documentation](https://code.visualstudio.com/docs/editing/getting-started/userinterface) names a primary sidebar, secondary sidebar, editor, and status bar in one workbench. Its [status-bar UX guide](https://code.visualstudio.com/api/ux-guidelines/status-bar) places the bar at the bottom and assigns global workspace information to the left and contextual information to the right.

Linear's [March 2026 redesign account](https://linear.app/now/behind-the-latest-design-refresh) documents a quieter sidebar, compact **top** tabs, restrained icons, and softer separators; it does not describe the observed bottom strip. Its [desktop application documentation](https://linear.app/docs/get-the-app) says sync status appears beside the workspace name at the **top of the sidebar**. The [January 2026 bottom-toolbar announcement](https://linear.app/changelog/2026-01-22-customize-your-navigation-in-linear-mobile) explicitly concerns **Linear Mobile**, a separate navigation pattern.

**shadcn/ui and coss ui do not currently list a ready-made app-wide status bar.** Their public component inventories list sidebar and related primitives instead: [shadcn/ui components](https://ui.shadcn.com/docs/components), [coss ui inventory](https://coss.com/ui/llms.txt). This is an inventory observation as of the checked date, not a claim that custom registries or future releases cannot offer one.

## Reference anatomy

| Reference | Placement and content | Interaction and useful lesson | Fit to sketch |
| --- | --- | --- | --- |
| Linear desktop (firsthand inspection, 2026-10-04) | Thin full-window strip below sidebar and content; Help at far left, Agent and history at far right. | The accessibility tree exposes Help as a menu and names the two right controls Agent and Chat history. [Linear Agent docs](https://linear.app/docs/linear-agent) independently describe opening prior chats through Chat history, though they do not place that control in the bottom strip. A sparse utility strip can reserve opposite edges for secondary features without turning into primary navigation. [Linear's redesign account](https://linear.app/now/behind-the-latest-design-refresh) supplies the documented visual principle of subdued supporting chrome. | **Direct** structural and visual match. |
| [VS Code](https://code.visualstudio.com/api/ux-guidelines/status-bar) | Full-width bottom of workbench; global status, problems, sync at left; contextual language, spacing, feedback at right. | Status items can expose actions. Official guide calls for short labels, few icons, and few contributed items. Its [source-control docs](https://code.visualstudio.com/docs/sourcecontrol/repos-remotes) show clickable branch and sync states. | **Direct** structural match. |
| [JupyterLab](https://jupyterlab.readthedocs.io/en/stable/extension/extension_points.html#status-bar) | App status bar for small contextual widgets; [API](https://jupyterlab.readthedocs.io/en/stable/api/interfaces/statusbar.IStatusBar.IItem.html) supports left, middle, and right alignment. | Widgets can appear only when active and have rank/priority. The docs demonstrate a central Busy/Idle state. Useful if a future bar hosts extensible app or plugin status. | **Direct** lower-density alternative. |
| [Blender](https://docs.blender.org/manual/en/3.3/interface/window_system/status_bar.html) | Bottom of window; active-tool shortcuts on left, operation messages in middle, statistics on right. | Can be hidden; running-task progress reveals an estimate on hover. Useful for transient work feedback without a large notification. | **Direct** layout precedent, more tool-heavy. |
| [Figma UI3](https://www.figma.com/blog/making-the-move-to-ui3-a-guide-to-figmas-next-chapter/) | Bottom-center **floating action toolbar**, not an edge-to-edge status strip. | Houses design tools and mode switching; Figma says it frees canvas space. The [first-party feedback forum](https://forum.figma.com/suggest-a-feature-11/allow-us-to-dock-move-the-new-ui3-toolbar-7861/index8.html?fid=11&tid=7861) also records requests to move or dock it, including complaints that it covers work. | **Adjacent, different pattern**; shows desktop placement tradeoffs. |

### Component-library check

- [shadcn/ui's component index](https://ui.shadcn.com/docs/components) has no Status Bar entry. Its [SidebarFooter](https://ui.shadcn.com/docs/components/base/sidebar) is sticky **inside the sidebar** and intended for user menus/settings/actions, so it cannot represent the sketch's full-width strip by itself.
- [coss ui's official inventory](https://coss.com/ui/llms.txt) likewise has no Status Bar entry. Its [Toolbar](https://coss.com/ui/docs/components/toolbar) groups buttons and controls; [Sidebar](https://coss.com/ui/llms.txt) is a collapsible side panel. These are parts from which a bar might be composed, not a complete status-bar layout.
- [Radix Toolbar](https://www.radix-ui.com/primitives/docs/components/toolbar) offers keyboard navigation for grouped interactive controls. It is useful **within an action cluster**, but a status strip may also contain passive text. Avoid giving the entire bar toolbar semantics solely because it sits at the bottom.

## Original X conversation

The following **post text** was inspected in the user's logged-in X browser on 2026-10-04; linked media was not relied on for these claims. This is a useful design discussion around the same Linear surface, not a survey of general preference.

| Original post | Verified text and design implication |
| --- | --- |
| [Karri Saarinen's April 5, 2026 reply about the Agent affordance](https://x.com/karrisaarinen/status/2040915477560795412) | Linear's CEO says opening the Agent as a new tab in the desktop app feels natural, while web lacks affordances available in the **bottom bar**. He adds that Linear is still working on both the Agent UI and bottom bar to address the problems raised. This independently corroborates the desktop bar's existence, shows it remains under iteration, and suggests desktop and web may need different access paths. |
| [Jesse Hanley's navigation complaint](https://x.com/jessethanley/status/2040913962225836122) | Jesse says they could not figure out how to return to the Agent or start a new chat. The useful test case is whether an Agent control and its history/new-chat routes are discoverable after leaving the Agent view. |
| [Karri Saarinen's note on screenshots](https://x.com/karrisaarinen/status/2040883401994248238) | Karri says screenshots can miss the navigation sidebar and product view. This cautions against deriving a whole app-shell pattern from a cropped product image; the live desktop observation above resolves placement more directly. |

For an adjacent, **different** bottom-toolbar pattern, [Figma's forum thread](https://forum.figma.com/suggest-a-feature-11/allow-us-to-dock-move-the-new-ui3-toolbar-7861/index8.html?fid=11&tid=7861) records participants asking to move or dock the toolbar because it can cover work or require long pointer travel on desktop. The takeaway is to test a bar at large desktop sizes and keep it below, rather than floating over, the main content if its role is ambient status.

## Direction to test for Anaphor

These are design inferences from the sketch and sources, not facts established by the products above.

1. Build a **quiet app-wide status surface** below all columns, separate from a sidebar footer. The closest content model is VS Code's global-left / contextual-right division, with room for a transient middle message if needed. [VS Code](https://code.visualstudio.com/api/ux-guidelines/status-bar), [JupyterLab](https://jupyterlab.readthedocs.io/en/stable/api/interfaces/statusbar.IStatusBar.IItem.html), and [Blender](https://docs.blender.org/manual/en/3.3/interface/window_system/status_bar.html) support those zones.
2. Keep always-visible content small: for example, workspace or connection state on the left, selection/view metadata or help on the right, and progress only during a real operation. Follow [VS Code's short-label/icon restraint](https://code.visualstudio.com/api/ux-guidelines/status-bar) and [JupyterLab's limited-space guidance](https://jupyterlab.readthedocs.io/en/stable/extension/extension_points.html#status-bar).
3. Use the observed Linear bar as the **sparse utility-strip** starting point: one help affordance at the far left, a couple of small feature controls at the far right, and generous quiet space in between. For status-heavy apps, compare that with VS Code's richer global/contextual model rather than filling the strip by default. [Linear's redesign account](https://linear.app/now/behind-the-latest-design-refresh) supports the visual aim of keeping ancillary chrome from competing with the task.
4. Ensure actions in the bar are discoverable and have adequate hit targets. Test the [Agent return/new-chat path raised by Jesse Hanley](https://x.com/jessethanley/status/2040913962225836122), plus zoom and narrow desktop windows so right-side items do not collide. The sources do not establish exact dimensions for Anaphor.

## Evidence boundaries

The attachment establishes the requested geometry but contains placeholder strokes, so it does not identify intended bar content. The Linear bar details come from a read-only inspection of the user's running desktop app on 2026-10-04; public Linear material reviewed here does not document the strip's anatomy. The controls were identified from the app accessibility tree; no interaction outcome was tested. Component-inventory absence is date-bound. The three original X post texts were inspected in the user's logged-in browser; their media was not characterized. Other product anatomy comes from official documentation and first-party source material.
