import { createMemo, type Accessor } from "solid-js";

type Crumb = {
  label: string;
  prefix: string;
};

export default function useBreadcrumbs(prefix: Accessor<string>) {
  const parts = createMemo(() => {
    const current = prefix();
    if (!current) return [] as string[];
    return current.split("/").filter(Boolean);
  });

  const crumbs = createMemo<Crumb[]>(() => {
    const list = parts();
    if (list.length === 0) return [{ label: "Root", prefix: "" }];
    const result: Crumb[] = [{ label: "Root", prefix: "" }];
    let acc = "";
    for (const part of list) {
      acc += `${part}/`;
      result.push({ label: part, prefix: acc });
    }
    return result;
  });

  const getBackPrefix = () => {
    const list = parts();
    const next = list.slice(0, -1);
    return next.length ? `${next.join("/")}/` : "";
  };

  return { crumbs, getBackPrefix };
}
