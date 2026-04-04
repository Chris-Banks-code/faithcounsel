"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?specialty=${encodeURIComponent(query)}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Anxiety, Depression, Couples Therapy..."
          className="flex-1 px-4 py-3 rounded-lg text-slate-800 bg-white border border-white/20 focus:border-white focus:outline-none text-lg"
        />
        <button
          type="submit"
          className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition text-lg"
        >
          Search
        </button>
      </div>
    </form>
  );
}
