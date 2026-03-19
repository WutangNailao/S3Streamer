import { Show } from "solid-js";

type Props = {
  open: boolean;
  title: string;
  url: string;
  onClose: () => void;
  setVideoRef: (element: HTMLVideoElement) => void;
};

export default function VideoDialog(props: Props) {
  return (
    <Show when={props.open}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-4 py-10"
        onClick={(event) => {
          if (event.currentTarget === event.target) props.onClose();
        }}
      >
        <div class="w-full max-w-5xl">
          <div class="mb-4 flex items-center justify-between gap-4 text-white">
            <div class="truncate text-base font-semibold sm:text-lg">
              {props.title}
            </div>
            <button
              type="button"
              onClick={props.onClose}
              class="rounded-full border border-white/20 px-3 py-1 text-sm transition hover:bg-white/10"
            >
              Close
            </button>
          </div>
          <div class="relative w-full overflow-hidden rounded-3xl bg-black shadow-2xl">
            <div class="relative w-full pt-[56.25%]">
              <video
                ref={props.setVideoRef}
                class="absolute inset-0 h-full w-full"
                controls
                autoplay
                src={props.url}
              />
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}
