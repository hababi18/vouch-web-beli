import { useRef, useState } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  onExpand?: () => void;
}

export const VideoPlayer = ({ src, onExpand }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-black"
      onClick={togglePlay}
      onDoubleClick={onExpand}
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        webkit-playsinline="true"
        muted
        loop
        className="aspect-[4/5] w-full object-cover"
      />

      {!isPlaying && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
            <Play className="ml-1 h-6 w-6 fill-white text-white" />
          </div>
        </div>
      )}

      <button
        onClick={toggleMute}
        className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1.5 text-white backdrop-blur-sm"
      >
        {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
};
