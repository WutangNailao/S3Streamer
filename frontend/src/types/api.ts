export type VideoItem = {
  key: string;
  size: number;
  lastModified?: string | null;
  streamUrl: string;
};

export type Pagination = {
  page: number;
  pageSize: number;
  totalPages: number;
  totalVideos: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type ListResponse = {
  prefix: string;
  folders: string[];
  videos: VideoItem[];
  pagination: Pagination;
};
