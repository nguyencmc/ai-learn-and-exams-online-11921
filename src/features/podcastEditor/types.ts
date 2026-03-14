import type { RefObject } from 'react';

export interface PodcastCategory {
  id: string;
  name: string;
}

export interface PodcastBasicInfoProps {
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  difficulty: string;
  hostName: string;
  episodeNumber: number;
  durationMinutes: number;
  durationSeconds: number;
  categories: PodcastCategory[];
  isEditing: boolean;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryIdChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  onHostNameChange: (value: string) => void;
  onEpisodeNumberChange: (value: number) => void;
  onDurationMinutesChange: (value: number) => void;
  onDurationSecondsChange: (value: number) => void;
}

export interface PodcastMediaContentProps {
  audioUrl: string;
  thumbnailUrl: string;
  uploadingAudio: boolean;
  uploadingThumbnail: boolean;
  uploadProgress: number;
  audioInputRef: RefObject<HTMLInputElement | null>;
  thumbnailInputRef: RefObject<HTMLInputElement | null>;
  onAudioUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onThumbnailUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAudioUrlChange: (value: string) => void;
  onThumbnailUrlChange: (value: string) => void;
}

export interface PodcastTranscriptProps {
  transcript: string;
  audioUrl: string;
  durationMinutes: number;
  durationSeconds: number;
  generatingTranscript: boolean;
  onTranscriptChange: (value: string) => void;
  onGenerateTranscript: () => Promise<void>;
}
