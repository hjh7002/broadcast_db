import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getSports } from "@/lib/data";
import ChatWidget from "@/components/ChatWidget";
import HeaderSearch from "@/components/HeaderSearch";
import NavSportGroup from "@/components/NavSportGroup";
import type { Sport } from "@/lib/supabase/types";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "중계 데이터베이스",
  description: "MLB · NBA · KBO 팀/선수 기록 관리",
};

// Sports/teams/players change via the chatbot at runtime, so this app must
// never be statically prerendered — always fetch fresh from Supabase.
export const dynamic = "force-dynamic";

function groupSportsForNav(sports: Sport[]): (Sport | { category: string; sports: Sport[] })[] {
  const seenCategories = new Set<string>();
  const items: (Sport | { category: string; sports: Sport[] })[] = [];
  for (const sport of sports) {
    const category = sport.extra?.category as string | undefined;
    if (!category) {
      items.push(sport);
      continue;
    }
    if (seenCategories.has(category)) continue;
    seenCategories.add(category);
    items.push({ category, sports: sports.filter((s) => (s.extra?.category as string | undefined) === category) });
  }
  return items;
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const sports = await getSports();
  const navItems = groupSportsForNav(sports);

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <header className="border-b border-neutral-200 dark:border-neutral-800">
          <nav className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-3">
            <Link href="/" className="mr-4 font-semibold">
              중계 DB
            </Link>
            <Link
              href="/broadcast"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              오늘의 중계
            </Link>
            <Link
              href="/broadcast/tomorrow"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              내일의 중계
            </Link>
            <span className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
            {navItems.map((item) =>
              "category" in item ? (
                <NavSportGroup key={item.category} category={item.category} sports={item.sports} />
              ) : (
                <Link
                  key={item.id}
                  href={`/${item.code}`}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {item.name}
                </Link>
              ),
            )}
            <HeaderSearch />
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
        <ChatWidget />
      </body>
    </html>
  );
}
