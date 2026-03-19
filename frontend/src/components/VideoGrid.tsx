import { For, Show } from "solid-js";
import type { VideoItem } from "../types/api";

type Props = {
  videos: VideoItem[];
  formatSize: (bytes: number) => string;
  formatDate: (value?: string | null) => string;
  onPlay: (streamUrl: string, title: string) => void;
};

export default function VideoGrid(props: Props) {
  return (
    <div class="flex flex-col gap-4">
      <h2 class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        Videos
      </h2>
      <Show
        when={props.videos.length > 0}
        fallback={
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No videos found in this folder.
          </div>
        }
      >
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <For each={props.videos}>
            {(video) => {
              const fileName = video.key.split("/").pop() ?? video.key;
              return (
                <button
                  type="button"
                  onClick={() => props.onPlay(video.streamUrl, fileName)}
                  class="group flex h-full flex-col gap-3 rounded-2xl border border-white bg-white p-5 text-left shadow-card transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex-1">
                      <div class="text-sm font-semibold text-slate-900">
                        {fileName}
                      </div>
                      <div class="mt-1 text-xs text-slate-500 break-all">
                        {video.key}
                      </div>
                    </div>
                    <div class="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                      Play
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span class="rounded-full bg-slate-100 px-3 py-1">
                      {props.formatSize(video.size)}
                    </span>
                    <span class="rounded-full bg-slate-100 px-3 py-1">
                      Modified: {props.formatDate(video.lastModified)}
                    </span>
                  </div>
                </button>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}
