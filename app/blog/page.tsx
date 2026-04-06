import Link from "next/link";
import { Metadata } from "next";
import { BLOG_POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Faith-Based Counseling Resources | FaithCounsel",
  description:
    "Articles and guides on Christian therapy, faith-based mental health, and finding the right counselor for your journey.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL || "https://faithcounsel.vercel.app"}/blog`,
  },
};

export default function BlogPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Blog</h1>
      <p className="text-slate-500 mb-10">
        Resources and guides on faith-based counseling, Christian therapy, and finding mental health support.
      </p>

      <div className="space-y-8">
        {BLOG_POSTS.map((post) => (
          <article key={post.slug} className="bg-white border border-slate-200 rounded-xl p-7 hover:shadow-md transition">
            <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </time>
              <span>·</span>
              <span>{post.readingTime}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2 hover:text-teal-700 transition">
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">{post.description}</p>
            <Link
              href={`/blog/${post.slug}`}
              className="text-teal-700 font-semibold text-sm hover:text-teal-800 transition"
            >
              Read more →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
