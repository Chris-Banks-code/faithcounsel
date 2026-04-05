"""
stage4_enrichment_passA.py
Stage 4: Niche verification — confirm therapists are genuinely Christian/faith-based.
Uses Crawl4AI to visit each website and assess faith-based alignment.
Adds: is_verified (bool), confidence (0-5), reason (str)
"""

import asyncio
import csv
import os
import sys
import re
from pathlib import Path
from typing import Optional

import crawl4ai
from crawl4ai import AsyncWebCrawler


# ─── Faith-based indicators ───────────────────────────────────────────────────

CHRISTIAN_KEYWORDS = [
    "christian", "christian counseling", "christian therapist", "christian therapy",
    "faith-based", "faith based", "faith based counseling", "biblical", "biblical counseling",
    "biblical principles", "christian worldview", "spiritual integration",
    "christian integration", "gospel-centered", "gospel centered", "christ-centered",
    "christ centered", "lord", "jesus christ", "jesus", "god", "holy bible",
    "church", "spiritual direction", "spiritual guidance", "christian integration",
    "christian psychology", "integration of faith", "prayer", "worship",
    "christian values", "christian worldview", "spiritual formation",
    "christian mental health", "faith and psychology", "christian perspective",
    "christian counselor", "christian therapist", "christian coaching",
    "kingdom of god", "soul care", "discipleship", "christian living",
]

REJECTION_PATTERNS = [
    "therapy for all faiths", "non-religious", "secular", "no religious",
    "lgbtq+", "queer", "affirming", "all orientations", "all beliefs",
    "atheist", "agnostic", "multifaith", "interfaith", "跨信仰",
]

HIGH_CONFIDENCE_PHRASES = [
    "christian counselor", "christian therapist", "biblical counseling",
    "faith-based therapy", "christian counseling", "gospel-centered",
    "christ-centered therapy", "biblical principles", "christian psychologist",
    "integration of christian faith", "christian mental health",
]

MEDIUM_CONFIDENCE_PHRASES = [
    "faith-based", "spiritual", "christian integration", "biblical",
    "prayer", "worship", "church", "spiritual direction", "soul care",
]


def assess_faith_alignment(text: str, url: str) -> tuple[bool, int, str]:
    """
    Returns (is_verified, confidence, reason)
    """
    text_lower = text.lower()
    url_lower = url.lower()

    # Check rejection patterns first
    for pattern in REJECTION_PATTERNS:
        if pattern in text_lower or pattern in url_lower:
            return False, 0, f"Explicitly non-Christian or conflicting niche: '{pattern}'"

    # Check for high-confidence phrases
    matched_high = [p for p in HIGH_CONFIDENCE_PHRASES if p in text_lower]
    matched_medium = [p for p in MEDIUM_CONFIDENCE_PHRASES if p in text_lower]

    # Count keyword matches
    keyword_matches = sum(1 for kw in CHRISTIAN_KEYWORDS if kw in text_lower)

    if matched_high:
        confidence = min(5, 4 + len(matched_high) // 2)
        return True, confidence, f"Strong indicators: {', '.join(matched_high[:3])}"

    if matched_medium or keyword_matches >= 3:
        # Medium confidence — requires human review flag but passes
        confidence = min(4, 3)
        reasons = matched_medium[:2] if matched_medium else [f"{keyword_matches} keyword matches"]
        return True, confidence, f"Moderate indicators: {', '.join(reasons)}"

    if keyword_matches >= 1:
        return True, 2, f"Weak but present: {', '.join([p for p in CHRISTIAN_KEYWORDS if p in text_lower][:2])}"

    # No clear indicators
    return False, 1, "No faith-based keywords found on site"


# ─── Main enrichment ─────────────────────────────────────────────────────────

async def enrich_therapists(csv_path: str, output_path: str):
    """
    Reads master-raw.csv, crawls each website, writes enriched CSV.
    """
    rows = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Loaded {len(rows)} listings from {csv_path}")

    results = []
    verified_count = 0
    rejected_count = 0

    async with AsyncWebCrawler(verbose=False) as crawler:
        for i, row in enumerate(rows, 1):
            website = row.get("website", "").strip()
            name = row.get("name", "Unknown")

            if not website or not website.startswith("http"):
                print(f"[{i}/{len(rows)}] ⏭  No valid URL for {name}")
                row["is_verified"] = "false"
                row["confidence"] = "0"
                row["reason"] = "No website URL provided"
                rejected_count += 1
                results.append(row)
                continue

            print(f"[{i}/{len(rows)}] 🔍 Crawling: {name}")
            print(f"           URL: {website}")

            try:
                result = await crawler.arun(url=website, bypass_cache=True)
                page_text = result.cleaned_text or result.raw_text or ""

                is_verified, confidence, reason = assess_faith_alignment(page_text, website)

                row["is_verified"] = "true" if is_verified else "false"
                row["confidence"] = str(confidence)
                row["reason"] = reason

                if is_verified:
                    verified_count += 1
                    status = "✅"
                else:
                    rejected_count += 1
                    status = "❌"

                print(f"           {status} Verified={row['is_verified']} Conf={confidence} — {reason}")

            except Exception as e:
                print(f"           ⚠️  Error crawling: {e}")
                row["is_verified"] = "false"
                row["confidence"] = "0"
                row["reason"] = f"Crawl error: {str(e)[:100]}"
                rejected_count += 1

            results.append(row)

            # Rate limit between requests
            if i < len(rows):
                await asyncio.sleep(2)

    # Write output
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    fieldnames = list(results[0].keys())
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

    print(f"\n✅ Enrichment complete: {output_path}")
    print(f"   Verified: {verified_count} ✅")
    print(f"   Rejected: {rejected_count} ❌")
    print(f"   Total:    {len(results)}")

    return verified_count, rejected_count, len(results)


# ─── Entry Point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    INPUT_CSV = Path("data/master-raw.csv")
    OUTPUT_CSV = Path("output/enriched_passA.csv")

    verified, rejected, total = asyncio.run(enrich_therapists(str(INPUT_CSV), str(OUTPUT_CSV)))
    print(f"\n📊 Pass A complete — {verified}/{total} verified")
