import { createEffect, createSignal } from "solid-js";

export default function useVideoDialog(defaultTitle: string) {
  const [open, setOpen] = createSignal(false);
  const [title, setTitle] = createSignal("");
  const [url, setUrl] = createSignal("");

  let videoRef: HTMLVideoElement | undefined;

  const setVideoRef = (element: HTMLVideoElement) => {
    videoRef = element;
  };

  const openDialog = (streamUrl: string, name: string) => {
    setUrl(streamUrl);
    setTitle(name);
    setOpen(true);
  };

  const closeDialog = () => {
    if (videoRef) {
      videoRef.pause();
      videoRef.src = "";
    }
    setOpen(false);
    setTitle("");
    setUrl("");
  };

  createEffect(() => {
    if (open()) {
      document.body.classList.add("dialog-open");
      document.title = `Playing: ${title()} | ${defaultTitle}`;
    } else {
      document.body.classList.remove("dialog-open");
      document.title = defaultTitle;
    }
  });

  return { open, title, url, openDialog, closeDialog, setVideoRef };
}
