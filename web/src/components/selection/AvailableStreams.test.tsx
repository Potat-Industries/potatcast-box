import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StatusProvider } from "../../providers/StatusProvider";
import AvailableStreams from "./AvailableStreams";

function renderWithStatus(statusBody: unknown, props: { hiddenStreamKeys?: string[] } = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(statusBody), { status: 200 })),
  );

  render(
    <StatusProvider>
      <AvailableStreams onSelect={() => {}} {...props} />
    </StatusProvider>,
  );
}

const liveStream = (streamKey: string) => ({
  streamKey,
  motd: `Welcome to ${streamKey}`,
  videoTracks: [{ rid: "high" }],
  audioTracks: [],
  sessions: [{ id: "viewer" }],
});

describe("AvailableStreams", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the empty state when the server reports no streams as null", async () => {
    renderWithStatus(null);

    expect(await screen.findByText("No streams currently available")).toBeDefined();
  });

  it("shows the empty state for an empty list", async () => {
    renderWithStatus([]);

    expect(await screen.findByText("No streams currently available")).toBeDefined();
  });

  it("lists live streams in alphabetical order and leaves out hidden ones", async () => {
    renderWithStatus([liveStream("zebra"), liveStream("alpha"), liveStream("watching")], {
      hiddenStreamKeys: ["Watching"],
    });

    await screen.findByText("alpha");

    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
      expect.stringContaining("alpha"),
      expect.stringContaining("zebra"),
    ]);
  });

  it("does not list sessions that have viewers but no broadcaster", async () => {
    renderWithStatus([{ ...liveStream("waiting"), videoTracks: [] }]);

    expect(await screen.findByText("No streams currently available")).toBeDefined();
    expect(screen.queryByText("waiting")).toBeNull();
  });
});
