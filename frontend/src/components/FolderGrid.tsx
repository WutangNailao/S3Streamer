import { For, Show } from "solid-js";

type Props = {
  folders: string[];
  onSelect: (prefix: string) => void;
};

export default function FolderGrid(props: Props) {
  return (
    <Show when={props.folders.length > 0}>
      <div class="flex flex-col gap-4">
        <h2 class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Folders
        </h2>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <For each={props.folders}>
            {(folder) => {
              const parts = folder.split("/").filter(Boolean);
              const name = parts[parts.length - 1] ?? folder;
              return (
                <button
                  type="button"
                  onClick={() => props.onSelect(folder)}
                  class="group flex flex-col gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-left transition hover:-translate-y-1 hover:bg-white hover:shadow-card"
                >
                  <span class="text-sm font-semibold text-blue-900">
                    {name}
                  </span>
                  <span class="text-xs text-blue-700/70">{folder}</span>
                </button>
              );
            }}
          </For>
        </div>
      </div>
    </Show>
  );
}
