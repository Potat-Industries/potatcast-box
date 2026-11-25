import { HeartIcon } from "@heroicons/react/20/solid";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { StreamSession } from "./session/StreamSession";

const MAX_VISIBLE_REACTIONS = 8;
const MAX_HORIZONTAL_DRIFT_PX = 16;

interface FloatingReaction {
  id: number;
  horizontalDriftPx: number;
}

export function ReactionOverlay({ session }: { session: StreamSession }) {
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const nextIdRef = useRef(0);

  useEffect(
    () =>
      session.onReaction(() => {
        const reaction: FloatingReaction = {
          id: nextIdRef.current++,
          horizontalDriftPx: Math.round((Math.random() * 2 - 1) * MAX_HORIZONTAL_DRIFT_PX),
        };

        setReactions((current) => [...current.slice(1 - MAX_VISIBLE_REACTIONS), reaction]);
      }),
    [session],
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute right-5 bottom-14 z-10 size-14">
      {reactions.map((reaction) => (
        <HeartIcon
          key={reaction.id}
          className="animate-reaction-float absolute right-0 bottom-0 size-7 text-rose-500 drop-shadow"
          style={{ "--reaction-x": `${reaction.horizontalDriftPx}px` } as CSSProperties}
          onAnimationEnd={() =>
            setReactions((current) => current.filter((item) => item.id !== reaction.id))
          }
        />
      ))}
    </div>
  );
}
