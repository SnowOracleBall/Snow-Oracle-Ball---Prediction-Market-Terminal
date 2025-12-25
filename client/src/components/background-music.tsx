import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player("yt-player", {
        height: "0",
        width: "0",
        videoId: "n8xGzkizA34",
        playerVars: {
          autoplay: 1,
          loop: 1,
          playlist: "n8xGzkizA34",
          controls: 0,
        },
        events: {
          onReady: (event: any) => {
            setIsReady(true);
            event.target.setVolume(30);
            event.target.playVideo();
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              playerRef.current?.playVideo();
            }
          },
        },
      });
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const toggleMusic = () => {
    if (!playerRef.current || !isReady) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      playerRef.current.setVolume(30);
      setIsPlaying(true);
    }
  };

  return (
    <>
      <div id="yt-player" style={{ display: "none" }} />
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMusic}
        disabled={!isReady}
        className="relative"
        data-testid="button-music-toggle"
        title={isPlaying ? "Mute music" : "Play Christmas music"}
      >
        {isPlaying ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
        {isPlaying && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
        )}
      </Button>
    </>
  );
}
