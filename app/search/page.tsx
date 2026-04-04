import { Metadata } from "next";
import { Suspense } from "react";
import SearchFilters from "@/components/SearchFilters";

export const metadata: Metadata = {
  title: "Search Therapists",
  description: "Search for faith-based Christian therapists and counselors by location and specialty.",
};

export default function SearchPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Find a Therapist</h1>
      <p className="text-slate-500 mb-8">Filter by city, state, or specialty to find the right match.</p>
      <Suspense fallback={<div className="text-slate-500">Loading...</div>}>
        <SearchFilters />
      </Suspense>
    </div>
  );
}
