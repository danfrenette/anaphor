import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { expect, test, vi } from "vitest";
import { useShortcut, type ShortcutBinding, type ShortcutOptions } from "@anaphor/system";

function Shortcut({ binding = "J", callback, options }: { binding?: ShortcutBinding | null; callback: () => void; options?: ShortcutOptions }) {
  useShortcut(binding, callback, options);
  return null;
}

test("uses current callbacks and bindings, supports disabling, and cleans up", async () => {
  const user = userEvent.setup();
  const first = vi.fn(); const second = vi.fn();
  const { rerender, unmount } = render(<Shortcut callback={first} />);
  await user.keyboard("j");
  expect(first).toHaveBeenCalledTimes(1);
  rerender(<Shortcut callback={second} binding="K" />);
  await user.keyboard("jk");
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
  rerender(<Shortcut callback={second} binding="K" options={{ enabled: false }} />);
  await user.keyboard("k");
  unmount();
  await user.keyboard("k");
  expect(second).toHaveBeenCalledTimes(1);
});

test("leaves editing, widgets, composition, and already-handled events alone", async () => {
  const user = userEvent.setup(); const callback = vi.fn();
  render(<><Shortcut callback={callback} /><input aria-label="Text" /><div contentEditable suppressContentEditableWarning aria-label="Editor" /><div role="listbox" tabIndex={0} aria-label="Choices" /><button onKeyDown={event => event.preventDefault()}>Owned</button><button>Plain</button></>);
  await user.click(screen.getByRole("textbox")); await user.keyboard("j");
  expect(screen.getByRole("textbox")).toHaveValue("j");
  await user.click(screen.getByLabelText("Editor")); await user.keyboard("j");
  screen.getByRole("listbox").focus(); await user.keyboard("j");
  screen.getByRole("button", { name: "Owned" }).focus(); await user.keyboard("j");
  fireEvent.keyDown(document.body, { key: "j", isComposing: true });
  expect(callback).not.toHaveBeenCalled();
  screen.getByRole("button", { name: "Plain" }).focus(); await user.keyboard("j");
  expect(callback).toHaveBeenCalledTimes(1);
});

test("requires two real presses within one second and cancels on focus or another key", async () => {
  const user = userEvent.setup(); const callback = vi.fn();
  render(<><Shortcut callback={callback} binding={["G", "G"]} /><button>Elsewhere</button></>);
  await user.keyboard("g");
  fireEvent.keyDown(document.body, { key: "g", repeat: true });
  expect(callback).not.toHaveBeenCalled();
  await user.keyboard("g");
  expect(callback).toHaveBeenCalledTimes(1);
  await user.keyboard("gxg");
  expect(callback).toHaveBeenCalledTimes(1);
  screen.getByRole("button").focus();
  await user.keyboard("g");
  expect(callback).toHaveBeenCalledTimes(1);
  const now = Date.now();
  const clock = vi.spyOn(Date, "now").mockReturnValue(now + 1001);
  await user.keyboard("g");
  expect(callback).toHaveBeenCalledTimes(1);
  clock.mockRestore();
});

test("allows held navigation keys only when requested", () => {
  const callback = vi.fn();
  const { rerender } = render(<Shortcut callback={callback} />);
  fireEvent.keyDown(document.body, { key: "j", repeat: true });
  expect(callback).not.toHaveBeenCalled();
  rerender(<Shortcut callback={callback} options={{ repeat: true }} />);
  fireEvent.keyDown(document.body, { key: "j", repeat: true });
  expect(callback).toHaveBeenCalledTimes(1);
});

test("focused scopes outrank global shortcuts, including inside modal dialogs", async () => {
  const user = userEvent.setup(); const global = vi.fn(); const local = vi.fn();
  function Scoped({ modal }: { modal: boolean }) {
    const scope = useRef<HTMLDivElement>(null);
    useShortcut("J", local, { scope });
    return <div role={modal ? "dialog" : undefined} aria-modal={modal || undefined}><div ref={scope}><button>Local</button></div></div>;
  }
  const { rerender } = render(<><Shortcut callback={global} /><Scoped modal={false} /></>);
  screen.getByRole("button").focus(); await user.keyboard("j");
  expect(local).toHaveBeenCalledTimes(1); expect(global).not.toHaveBeenCalled();
  rerender(<><Shortcut callback={global} /><Scoped modal /></>);
  await user.keyboard("j");
  expect(local).toHaveBeenCalledTimes(2); expect(global).not.toHaveBeenCalled();
  screen.getByRole("button").blur(); await user.keyboard("j");
  expect(global).not.toHaveBeenCalled();
});

test("supports several sequences sharing a prefix", async () => {
  const user = userEvent.setup(); const first = vi.fn(); const inbox = vi.fn();
  render(<><Shortcut binding={["G", "G"]} callback={first} /><Shortcut binding={["G", "I"]} callback={inbox} /></>);
  await user.keyboard("gi");
  expect(inbox).toHaveBeenCalledTimes(1); expect(first).not.toHaveBeenCalled();
  await user.keyboard("gg");
  expect(first).toHaveBeenCalledTimes(1); expect(inbox).toHaveBeenCalledTimes(1);
});

test("respects explicitly marked modals and ignores hidden mounted dialogs", async () => {
  const user = userEvent.setup(); const callback = vi.fn();
  const { rerender } = render(<><Shortcut callback={callback} /><div data-shortcut-modal=""><button>Dialog action</button></div></>);
  screen.getByRole("button").focus(); await user.keyboard("j");
  expect(callback).not.toHaveBeenCalled();
  rerender(<><Shortcut callback={callback} /><div aria-modal="true" hidden /></>);
  await user.keyboard("j");
  expect(callback).toHaveBeenCalledTimes(1);
});
