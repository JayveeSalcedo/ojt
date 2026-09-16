"use client";
import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function InstallButton() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIsIOS(
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const onClick = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } else {
      setSheet(true);
    }
  };

  return (
    <>
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-full bg-sun px-3 py-1.5 text-[13px] font-semibold text-[#1a1300] transition active:scale-95"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add to Home Screen
      </button>
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setSheet(false)}>
          <div className="card m-3 w-full max-w-md p-5 pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-300" />
            <h3 className="text-xl font-bold">Install OJT Tracker</h3>
            {isIOS ? (
              <ol className="mt-3 space-y-3 text-[15px]">
                <li className="flex gap-3"><span className="font-bold text-brand-2">1</span><span>Tap the <b>Share</b> button in Safari.</span></li>
                <li className="flex gap-3"><span className="font-bold text-brand-2">2</span><span>Scroll and choose <b>Add to Home Screen</b>.</span></li>
                <li className="flex gap-3"><span className="font-bold text-brand-2">3</span><span>Tap <b>Add</b>.</span></li>
              </ol>
            ) : (
              <p className="muted mt-3 text-[15px]">
                Open your browser menu (⋮) and choose <b>Install app</b> or <b>Add to Home screen</b>.
              </p>
            )}
            <button className="btn btn-blue mt-5 w-full" onClick={() => setSheet(false)}>Got it</button>
          </div>
        </div>
      )}
    </>
  );
}
