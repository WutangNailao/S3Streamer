import { createEffect, createSignal, type Accessor } from "solid-js";
import type { ListResponse, Pagination, VideoItem } from "../types/api";

export default function useVideos(
  page: Accessor<number>,
  prefix: Accessor<string>,
) {
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [videos, setVideos] = createSignal<VideoItem[]>([]);
  const [folders, setFolders] = createSignal<string[]>([]);
  const [pagination, setPagination] = createSignal<Pagination | null>(null);

  let activeRequest = 0;

  const fetchVideos = async () => {
    const requestId = ++activeRequest;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/videos?page=${page()}&prefix=${encodeURIComponent(prefix())}`,
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

  createEffect(() => {
    fetchVideos();
  });

  return {
    loading,
    error,
    videos,
    folders,
    pagination,
    refetch: fetchVideos,
  };
}
