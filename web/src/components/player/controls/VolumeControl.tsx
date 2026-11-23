import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/20/solid";
import { useContext } from "react";
import { LocaleContext } from "../../../providers/LocaleProvider";
import { ControlButton } from "./ControlButton";

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  canSetVolume: boolean;
  onToggleMute(): void;
  onVolumeChange(volume: number): void;
}

export function VolumeControl(props: VolumeControlProps) {
  const { volume, isMuted, canSetVolume, onToggleMute, onVolumeChange } = props;
  const { locale } = useContext(LocaleContext);
  const displayedPercent = isMuted ? 0 : Math.round(volume * 100);

  return (
    <div className="flex items-center">
      <ControlButton
        label={isMuted ? locale.player.button_unmute : locale.player.button_mute}
        onClick={onToggleMute}
      >
        {isMuted ? <SpeakerXMarkIcon className="size-5" /> : <SpeakerWaveIcon className="size-5" />}
      </ControlButton>

      {canSetVolume && (
        <input
          type="range"
          min={0}
          max={100}
          value={displayedPercent}
          aria-label={locale.player.volume_label}
          onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
          className="player-drag-cancel hidden h-1 w-20 cursor-pointer accent-white @md:block"
        />
      )}
    </div>
  );
}
