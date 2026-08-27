"use client";

import { useEffect, useState, type ReactNode } from "react";

const TABS = [
  { key: "stats", label: "스탯" },
  { key: "games", label: "게임" },
  { key: "profile", label: "프로필" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function isTabKey(value: string | null): value is TabKey {
  return TABS.some((t) => t.key === value);
}

export default function PlayerTabs({
  statTab,
  gameTab,
  profileTab,
}: {
  statTab: ReactNode;
  gameTab: ReactNode;
  profileTab: ReactNode;
}) {
  // Starts at "stats" to match the server-rendered markup, then syncs to the
  // ?tab= query param (if any) right after mount — this is pure client-side
  // display state, so a direct history.replaceState avoids a round trip
  // through Next's router (and the useSearchParams/Suspense machinery that
  // comes with it) just to flip which already-rendered tab is visible.
  const [active, setActiveState] = useState<TabKey>("stats");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (isTabKey(tabParam) && tabParam !== "stats") setActiveState(tabParam);
  }, []);

  const activeIndex = TABS.findIndex((t) => t.key === active);

  function setActive(key: TabKey) {
    setActiveState(key);
    const params = new URLSearchParams(window.location.search);
    if (key === "stats") params.delete("tab");
    else params.set("tab", key);
    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }

  const content: Record<TabKey, ReactNode> = {
    stats: statTab,
    games: gameTab,
    profile: profileTab,
  };

  return (
    <div>
      <div className="relative flex">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`w-24 py-2.5 text-sm font-bold transition-colors ${
              active === tab.key
                ? "text-blue-600 dark:text-blue-400"
                : "text-neutral-500 dark:text-neutral-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="absolute bottom-0 h-0.5 w-full bg-neutral-200 dark:bg-neutral-800" />
        <div
          className="absolute bottom-0 h-0.5 w-24 bg-blue-600 transition-all duration-300 dark:bg-blue-400"
          style={{ left: `${activeIndex * 6}rem` }}
        />
      </div>
      <div className="pt-5">{content[active]}</div>
    </div>
  );
}
