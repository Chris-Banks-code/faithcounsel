"use client";

import { useState } from "react";

export default function CookieBanner() {
  const [accepted, setAccepted] = useState(false);

  if (accepted) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800 text-white p-4 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm">
          We use cookies to improve your experience. By using our site, you agree to our{" "}
          <a href="/privacy-policy" className="underline hover:text-teal-300">Privacy Policy</a>.
        </p>
        <button
          onClick={() => setAccepted(true)}
          className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
