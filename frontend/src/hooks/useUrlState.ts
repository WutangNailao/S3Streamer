import { createEffect, createSignal, onMount } from "solid-js";

export default function useUrlState() {
  const [page, setPage] = createSignal(1);
  const [prefix, setPrefix] = createSignal("");

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = Number(params.get("page"));
    const prefixParam = params.get("prefix") ?? "";
    if (Number.isFinite(pageParam) && pageParam > 0) setPage(pageParam);
    if (prefixParam) setPrefix(prefixParam);
  });

  createEffect(() => {
    const url = new URL(window.location.href);
    if (page() === 1) url.searchParams.delete("page");
    else url.searchParams.set("page", String(page()));

    if (!prefix()) url.searchParams.delete("prefix");
    else url.searchParams.set("prefix", prefix());

    window.history.replaceState({}, "", url);
  });

  return { page, setPage, prefix, setPrefix };
}
