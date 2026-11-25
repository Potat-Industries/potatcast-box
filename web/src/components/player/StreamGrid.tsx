import type { ReactNode } from "react";
import ReactGridLayout, { useContainerWidth } from "react-grid-layout";
import type { StreamSession } from "./session/StreamSession";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const GRID_COLUMNS = 12;
const TILES_PER_ROW = 2;
const TILE_COLUMN_SPAN = GRID_COLUMNS / TILES_PER_ROW;
const ROW_HEIGHT_PX = 16;
const GAP_PX = 8;
const DRAG_CANCEL_SELECTOR = ".player-drag-cancel,button,input,select,textarea,a,[role='button']";

interface StreamGridProps {
  sessions: StreamSession[];
  /** Dragging and resizing need a pointer and room to move; on small or touch screens tiles stack. */
  canRearrange: boolean;
  renderTile(session: StreamSession, index: number): ReactNode;
}

export function StreamGrid({ sessions, canRearrange, renderTile }: StreamGridProps) {
  if (canRearrange) {
    return <RearrangeableGrid sessions={sessions} renderTile={renderTile} />;
  }

  return (
    <div className="flex flex-col gap-2">
      {sessions.map((session, index) => (
        <div key={session.streamKey} className="aspect-video w-full">
          {renderTile(session, index)}
        </div>
      ))}
    </div>
  );
}

// A component of its own because useContainerWidth starts observing its container once, on mount:
// the hook and the measured element have to appear and disappear together.
function RearrangeableGrid({ sessions, renderTile }: Omit<StreamGridProps, "canRearrange">) {
  const { width, containerRef } = useContainerWidth();

  const tileWidthPx = (width - GAP_PX * (TILES_PER_ROW - 1)) / TILES_PER_ROW;
  const tileHeightPx = (tileWidthPx * 9) / 16;
  const tileRows = Math.max(1, Math.round((tileHeightPx + GAP_PX) / (ROW_HEIGHT_PX + GAP_PX)));

  return (
    <div ref={containerRef} className="w-full">
      <ReactGridLayout
        width={width}
        dragConfig={{ enabled: true, handle: ".player-drag-handle", cancel: DRAG_CANCEL_SELECTOR }}
        resizeConfig={{ enabled: true }}
        gridConfig={{
          cols: GRID_COLUMNS,
          rowHeight: ROW_HEIGHT_PX,
          margin: [GAP_PX, GAP_PX],
          containerPadding: [0, 0],
        }}
        layout={sessions.map((session, index) => ({
          i: session.streamKey,
          x: (index % TILES_PER_ROW) * TILE_COLUMN_SPAN,
          y: Math.floor(index / TILES_PER_ROW) * tileRows,
          w: TILE_COLUMN_SPAN,
          h: tileRows,
        }))}
      >
        {sessions.map((session, index) => (
          <div key={session.streamKey} className="overflow-hidden rounded-md">
            {renderTile(session, index)}
          </div>
        ))}
      </ReactGridLayout>
    </div>
  );
}
