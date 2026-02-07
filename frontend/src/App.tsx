import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";

type VideoItem = {
  key: string;
  size: number;
  lastModified?: string | null;
  streamUrl: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalPages: number;
  totalVideos: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type ListResponse = {
  prefix: string;
  folders: string[];
  videos: VideoItem[];
  pagination: Pagination;
};

const DEFAULT_TITLE = "S3 Video Streaming";

export default function App() {
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [videos, setVideos] = createSignal<VideoItem[]>([]);
  const [folders, setFolders] = createSignal<string[]>([]);
  const [pagination, setPagination] = createSignal<Pagination | null>(null);
  const [currentPage, setCurrentPage] = createSignal(1);
  const [currentPrefix, setCurrentPrefix] = createSignal("");

  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [dialogTitle, setDialogTitle] = createSignal("");
  const [dialogUrl, setDialogUrl] = createSignal("");

  let videoRef: HTMLVideoElement | undefined;
  let activeRequest = 0;

  const breadcrumbParts = createMemo(() => {
    const prefix = currentPrefix();
    if (!prefix) return [] as string[];
    return prefix.split("/").filter(Boolean);
  });

  const breadcrumbCrumbs = createMemo(() => {
    const parts = breadcrumbParts();
    if (parts.length === 0) return [{ label: "Root", prefix: "" }];
    const crumbs = [{ label: "Root", prefix: "" }];
    let acc = "";
    for (const part of parts) {
      acc += `${part}/`;
      crumbs.push({ label: part, prefix: acc });
    }
    return crumbs;
  });

  const fetchVideos = async (page: number, prefix: string) => {
    const requestId = ++activeRequest;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/videos?page=${page}&prefix=${encodeURIComponent(prefix)}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch videos (${response.status})`);
      }
      const data = (await response.json()) as ListResponse;
      if (requestId !== activeRequest) return;

      setVideos(data.videos || []);
      setFolders(data.folders || []);
      setPagination(data.pagination);
      setLoading(false);
    } catch (err) {
      if (requestId !== activeRequest) return;
      setLoading(false);
      setError("Error loading videos. Please try again later.");
      console.error("Error fetching videos:", err);
    }
  };

  const updateUrl = (page: number, prefix: string) => {
    const url = new URL(window.location.href);
    if (page === 1) url.searchParams.delete("page");
    else url.searchParams.set("page", String(page));

    if (!prefix) url.searchParams.delete("prefix");
    else url.searchParams.set("prefix", prefix);

    window.history.replaceState({}, "", url);
  };

  const openVideoDialog = (streamUrl: string, title: string) => {
    setDialogUrl(streamUrl);
    setDialogTitle(title);
    setDialogOpen(true);
  };

  const closeVideoDialog = () => {
    if (videoRef) {
      videoRef.pause();
      videoRef.src = "";
    }
    setDialogOpen(false);
    setDialogTitle("");
    setDialogUrl("");
  };

  const handleFolderClick = (folderPrefix: string) => {
    setCurrentPrefix(folderPrefix);
    setCurrentPage(1);
  };

  const handleBack = () => {
    const parts = breadcrumbParts();
    parts.pop();
    const prefix = parts.length ? `${parts.join("/")}/` : "";
    setCurrentPrefix(prefix);
    setCurrentPage(1);
  };

  const formatSize = (bytes: number) =>
    `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString() : "-";

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = Number(params.get("page"));
    const prefixParam = params.get("prefix") ?? "";
    if (Number.isFinite(pageParam) && pageParam > 0) setCurrentPage(pageParam);
    if (prefixParam) setCurrentPrefix(prefixParam);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dialogOpen()) {
        closeVideoDialog();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => document.removeEventListener("keydown", onKeyDown));
  });

  createEffect(() => {
    fetchVideos(currentPage(), currentPrefix());
  });

  createEffect(() => {
    updateUrl(currentPage(), currentPrefix());
  });

  createEffect(() => {
    if (dialogOpen()) {
      document.body.classList.add("dialog-open");
      document.title = `Playing: ${dialogTitle()} | ${DEFAULT_TITLE}`;
    } else {
      document.body.classList.remove("dialog-open");
      document.title = DEFAULT_TITLE;
    }
  });

  return (
    <div class="min-h-screen px-4 py-10 text-ink sm:px-8">
      <div class="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header class="flex flex-col items-center gap-4 text-center">
          <div class="rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow">
            S3 Explorer
          </div>
          <h1 class="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            {DEFAULT_TITLE}
          </h1>
          <p class="max-w-2xl text-sm text-slate-600 sm:text-base">
            Browse folders and stream videos directly from your S3 bucket with
            pagination and instant playback.
          </p>
        </header>

        <section class="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-card backdrop-blur">
          <div class="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <button
              type="button"
              onClick={handleBack}
              class={`rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow ${
                currentPrefix() ? "" : "pointer-events-none opacity-40"
              }`}
            >
              Back
            </button>
            <div class="flex flex-wrap items-center gap-2">
              <For each={breadcrumbCrumbs()}>
                {(crumb, index) => (
                  <>
                    <button
                      type="button"
                      onClick={() => handleFolderClick(crumb.prefix)}
                      class="text-sm font-medium text-blue-700 hover:text-blue-900"
                    >
                      {crumb.label}
                    </button>
                    <Show when={index() < breadcrumbCrumbs().length - 1}>
                      <span class="text-slate-400">/</span>
                    </Show>
                  </>
                )}
              </For>
            </div>
          </div>

          <Show when={loading()}>
            <div class="mt-8 text-center text-sm font-medium text-slate-500">
              Loading videos from S3...
            </div>
          </Show>

          <Show when={error()}>
            <div class="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
              {error()}
            </div>
          </Show>

          <Show when={!loading()}>
            <div class="mt-6 flex flex-col gap-8">
              <Show when={folders().length > 0}>
                <div class="flex flex-col gap-4">
                  <h2 class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Folders
                  </h2>
                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <For each={folders()}>
                      {(folder) => {
                        const parts = folder.split("/").filter(Boolean);
                        const name = parts[parts.length - 1] ?? folder;
                        return (
                          <button
                            type="button"
                            onClick={() => handleFolderClick(folder)}
                            class="group flex flex-col gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-left transition hover:-translate-y-1 hover:bg-white hover:shadow-card"
                          >
                            <span class="text-sm font-semibold text-blue-900">
                              {name}
                            </span>
                            <span class="text-xs text-blue-700/70">
                              {folder}
                            </span>
                          </button>
                        );
                      }}
                    </For>
                  </div>
                </div>
              </Show>

              <div class="flex flex-col gap-4">
                <h2 class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Videos
                </h2>
                <Show
                  when={videos().length > 0}
                  fallback={
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No videos found in this folder.
                    </div>
                  }
                >
                  <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <For each={videos()}>
                      {(video) => {
                        const fileName = video.key.split("/").pop() ?? video.key;
                        return (
                          <button
                            type="button"
                            onClick={() => openVideoDialog(video.streamUrl, fileName)}
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
                                {formatSize(video.size)}
                              </span>
                              <span class="rounded-full bg-slate-100 px-3 py-1">
                                Modified: {formatDate(video.lastModified)}
                              </span>
                            </div>
                          </button>
                        );
                      }}
                    </For>
                  </div>
                </Show>
              </div>

              <Show when={pagination() && (pagination()?.totalPages ?? 1) > 1}>
                <div class="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      pagination()?.hasPrevPage &&
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                    class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300"
                    disabled={!pagination()?.hasPrevPage}
                  >
                    Previous
                  </button>
                  <div class="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
                    Page {pagination()?.page} of {pagination()?.totalPages}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      pagination()?.hasNextPage &&
                      setCurrentPage((p) => p + 1)
                    }
                    class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300"
                    disabled={!pagination()?.hasNextPage}
                  >
                    Next
                  </button>
                </div>
              </Show>
            </div>
          </Show>
        </section>
      </div>

      <Show when={dialogOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-4 py-10"
          onClick={(event) => {
            if (event.currentTarget === event.target) closeVideoDialog();
          }}
        >
          <div class="w-full max-w-5xl">
            <div class="mb-4 flex items-center justify-between gap-4 text-white">
              <div class="truncate text-base font-semibold sm:text-lg">
                {dialogTitle()}
              </div>
              <button
                type="button"
                onClick={closeVideoDialog}
                class="rounded-full border border-white/20 px-3 py-1 text-sm transition hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <div class="relative w-full overflow-hidden rounded-3xl bg-black shadow-2xl">
              <div class="relative w-full pt-[56.25%]">
                <video
                  ref={videoRef}
                  class="absolute inset-0 h-full w-full"
                  controls
                  autoplay
                  src={dialogUrl()}
                />
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
