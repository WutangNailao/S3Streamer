import { Show } from "solid-js";
import type { Pagination } from "../types/api";

type Props = {
  pagination: Pagination | null;
  onPrev: () => void;
  onNext: () => void;
};

export default function PaginationControls(props: Props) {
  const hasPages = () => (props.pagination?.totalPages ?? 1) > 1;

  return (
    <Show when={props.pagination && hasPages()}>
      <div class="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={props.onPrev}
          class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300"
          disabled={!props.pagination?.hasPrevPage}
        >
          Previous
        </button>
        <div class="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
          Page {props.pagination?.page} of {props.pagination?.totalPages}
        </div>
        <button
          type="button"
          onClick={props.onNext}
          class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300"
          disabled={!props.pagination?.hasNextPage}
        >
          Next
        </button>
      </div>
    </Show>
  );
}
