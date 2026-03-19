import { onCleanup, onMount } from "solid-js";
import Breadcrumbs from "./components/Breadcrumbs";
import FolderGrid from "./components/FolderGrid";
import PaginationControls from "./components/PaginationControls";
import VideoDialog from "./components/VideoDialog";
import VideoGrid from "./components/VideoGrid";
import useBreadcrumbs from "./hooks/useBreadcrumbs";
import useUrlState from "./hooks/useUrlState";
import useVideoDialog from "./hooks/useVideoDialog";
import useVideos from "./hooks/useVideos";

const DEFAULT_TITLE = "S3 Video Streaming";

export default function App() {
  const { page, setPage, prefix, setPrefix } = useUrlState();
  const { crumbs, getBackPrefix } = useBreadcrumbs(prefix);
  const { loading, error, videos, folders, pagination } = useVideos(
    page,
    prefix,
  );
  const dialog = useVideoDialog(DEFAULT_TITLE);

  const handleFolderClick = (folderPrefix: string) => {
    setPrefix(folderPrefix);
    setPage(1);
  };

  const handleBack = () => {
    setPrefix(getBackPrefix());
    setPage(1);
  };

  const formatSize = (bytes: number) =>
    `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString() : "-";

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dialog.open()) {
        dialog.closeDialog();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => document.removeEventListener("keydown", onKeyDown));
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
          <Breadcrumbs
            crumbs={crumbs()}
            canGoBack={prefix().length > 0}
            onBack={handleBack}
            onSelect={handleFolderClick}
          />

          {loading() && (
            <div class="mt-8 text-center text-sm font-medium text-slate-500">
              Loading videos from S3...
            </div>
          )}

          {error() && (
            <div class="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
              {error()}
            </div>
          )}

          {!loading() && (
            <div class="mt-6 flex flex-col gap-8">
              <FolderGrid folders={folders()} onSelect={handleFolderClick} />
              <VideoGrid
                videos={videos()}
                formatSize={formatSize}
                formatDate={formatDate}
                onPlay={dialog.openDialog}
              />
              <PaginationControls
                pagination={pagination()}
                onPrev={() =>
                  pagination()?.hasPrevPage &&
                  setPage((p) => Math.max(1, p - 1))
                }
                onNext={() =>
                  pagination()?.hasNextPage && setPage((p) => p + 1)
                }
              />
            </div>
          )}
        </section>
      </div>

      <VideoDialog
        open={dialog.open()}
        title={dialog.title()}
        url={dialog.url()}
        onClose={dialog.closeDialog}
        setVideoRef={dialog.setVideoRef}
      />
    </div>
  );
}
