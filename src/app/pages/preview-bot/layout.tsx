/**
 * Override the pages layout for preview-bot.
 * The parent layout injects <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
 * We negate those paddings with negative margins and fix the height so the
 * simulator fills the remaining viewport without any outer scroll.
 *
 * Header height: h-14 (56px) on mobile, lg:h-[60px] (60px) on desktop.
 */
export default function PreviewBotLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="-m-4 lg:-m-6 overflow-hidden flex flex-col"
            style={{ height: "calc(100vh - 56px)" }}
        >
            {children}
        </div>
    );
}
