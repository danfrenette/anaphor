import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Badge } from "@anaphor/system";
import { expect, test } from "vitest";

test("exposes a descriptive label without adding a keyboard stop", async () => {
  const user = userEvent.setup();
  render(<><button>Before</button><Badge variant="outline" shape="round">Study 01</Badge><button>After</button></>);
  expect(screen.getByText("Study 01")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Study 01" })).not.toBeInTheDocument();
  await user.tab();
  expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
});
