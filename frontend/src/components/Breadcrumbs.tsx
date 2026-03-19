import { For, Show } from "solid-js";

type Crumb = {
  label: string;
  prefix: string;
};

type Props = {
  crumbs: Crumb[];
  canGoBack: boolean;
  onBack: () => void;
  onSelect: (prefix: string) => void;
};

export default function Breadcrumbs(props: Props) {
  return (
    <div class="flex flex-wrap items-center gap-3 text-sm text-slate-600">
      <button
        type="button"
        onClick={props.onBack}
        class={`rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow ${
          props.canGoBack ? "" : "pointer-events-none opacity-40"
        }`}
      >
        Back
      </button>
      <div class="flex flex-wrap items-center gap-2">
        <For each={props.crumbs}>
          {(crumb, index) => (
            <>
              <button
                type="button"
                onClick={() => props.onSelect(crumb.prefix)}
                class="text-sm font-medium text-blue-700 hover:text-blue-900"
              >
                {crumb.label}
              </button>
              <Show when={index() < props.crumbs.length - 1}>
                <span class="text-slate-400">/</span>
              </Show>
            </>
          )}
        </For>
      </div>
    </div>
  );
}
