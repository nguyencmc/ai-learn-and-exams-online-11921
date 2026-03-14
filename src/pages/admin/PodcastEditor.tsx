import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Headphones, ArrowLeft, Save } from 'lucide-react';
import { usePodcastEditor } from '@/features/podcastEditor/hooks';
import { PodcastBasicInfo } from '@/features/podcastEditor/components/PodcastBasicInfo';
import { PodcastMediaContent } from '@/features/podcastEditor/components/PodcastMediaContent';
import { PodcastTranscript } from '@/features/podcastEditor/components/PodcastTranscript';

const PodcastEditor = () => {
  const editor = usePodcastEditor();

  if (editor.roleLoading || editor.loading) {
    return (
      <div className="min-h-screen bg-background">
<div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!editor.hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
<main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin/podcasts">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Headphones className="w-8 h-8 text-pink-500" />
                {editor.isEditing ? 'Chỉnh sửa podcast' : 'Tạo podcast mới'}
              </h1>
            </div>
          </div>
          <Button onClick={editor.handleSave} disabled={editor.saving} className="gap-2">
            <Save className="w-4 h-4" />
            {editor.saving ? 'Đang lưu...' : 'Lưu podcast'}
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <PodcastBasicInfo
            title={editor.title}
            slug={editor.slug}
            description={editor.description}
            categoryId={editor.categoryId}
            difficulty={editor.difficulty}
            hostName={editor.hostName}
            episodeNumber={editor.episodeNumber}
            durationMinutes={editor.durationMinutes}
            durationSeconds={editor.durationSeconds}
            categories={editor.categories}
            isEditing={editor.isEditing}
            onTitleChange={editor.handleTitleChange}
            onSlugChange={editor.setSlug}
            onDescriptionChange={editor.setDescription}
            onCategoryIdChange={editor.setCategoryId}
            onDifficultyChange={editor.setDifficulty}
            onHostNameChange={editor.setHostName}
            onEpisodeNumberChange={editor.setEpisodeNumber}
            onDurationMinutesChange={editor.setDurationMinutes}
            onDurationSecondsChange={editor.setDurationSeconds}
          />

          <PodcastMediaContent
            audioUrl={editor.audioUrl}
            thumbnailUrl={editor.thumbnailUrl}
            uploadingAudio={editor.uploadingAudio}
            uploadingThumbnail={editor.uploadingThumbnail}
            uploadProgress={editor.uploadProgress}
            audioInputRef={editor.audioInputRef}
            thumbnailInputRef={editor.thumbnailInputRef}
            onAudioUpload={editor.handleAudioUpload}
            onThumbnailUpload={editor.handleThumbnailUpload}
            onAudioUrlChange={editor.setAudioUrl}
            onThumbnailUrlChange={editor.setThumbnailUrl}
          />

          <PodcastTranscript
            transcript={editor.transcript}
            audioUrl={editor.audioUrl}
            durationMinutes={editor.durationMinutes}
            durationSeconds={editor.durationSeconds}
            generatingTranscript={editor.generatingTranscript}
            onTranscriptChange={editor.setTranscript}
            onGenerateTranscript={editor.handleGenerateTranscript}
          />
        </div>
      </main>
    </div>
  );
};

export default PodcastEditor;
