import { createCn } from "cn/config";

const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["label", "small", "ui", "body", "title"] }],
    },
  },
});

export { cn };
