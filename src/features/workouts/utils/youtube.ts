const ID = /^[A-Za-z0-9_-]{11}$/;

/** Only well-formed ids are ever put into a URL or HTML, so catalog data can't inject markup. */
export const isYouTubeId = (id: string): boolean => ID.test(id);

export const youtubeEmbedUrl = (id: string): string =>
  `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0&modestbranding=1`;

export const youtubeWatchUrl = (id: string): string => `https://www.youtube.com/watch?v=${id}`;

/** Fallback when an exercise has no curated video. */
export const youtubeSearchUrl = (exerciseName: string): string =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exerciseName} proper form`)}`;
