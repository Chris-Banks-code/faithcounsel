import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { BLOG_POSTS, getBlogPost } from "@/lib/blog";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Not Found" };
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://faithcounsel.vercel.app";
  return {
    title: `${post.title} | FaithCounsel`,
    description: post.description,
    alternates: { canonical: `${baseUrl}/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${baseUrl}/blog/${slug}`,
      type: "article",
      publishedTime: post.date,
      siteName: "FaithCounsel",
    },
  };
}

// Render plain-text markdown-lite: ## headings, ** bold, paragraphs
function renderContent(content: string) {
  const paragraphs = content.split(/\n\n+/);
  return paragraphs.map((block, i) => {
    if (block.startsWith("## ")) {
      return (
        <h2 key={i} className="text-xl font-bold text-slate-800 mt-8 mb-3">
          {block.slice(3)}
        </h2>
      );
    }
    if (block.startsWith("- ")) {
      const items = block.split("\n").filter((l) => l.startsWith("- "));
      return (
        <ul key={i} className="list-disc pl-5 space-y-1 mb-4 text-slate-600">
          {items.map((item, j) => {
            const text = item.slice(2);
            return <li key={j} dangerouslySetInnerHTML={{ __html: boldify(text) }} />;
          })}
        </ul>
      );
    }
    return (
      <p key={i} className="text-slate-600 leading-relaxed mb-4"
        dangerouslySetInnerHTML={{ __html: boldify(block) }}
      />
    );
  });
}

function boldify(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const otherPosts = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/blog" className="text-teal-700 font-semibold hover:text-teal-800 text-sm mb-6 inline-block">
        ← Back to Blog
      </Link>

      <article>
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </time>
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-4 leading-snug">{post.title}</h1>
        <p className="text-slate-500 text-lg mb-8 leading-relaxed">{post.description}</p>

        <div className="border-t border-slate-100 pt-8">
          {renderContent(post.content)}
        </div>
      </article>

      {/* CTA */}
      <div className="mt-12 bg-teal-50 border border-teal-100 rounded-xl p-6 text-center">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Ready to find a therapist?</h2>
        <p className="text-slate-600 text-sm mb-4">
          Search our directory of licensed, faith-based Christian therapists across all 50 states.
        </p>
        <Link
          href="/search"
          className="inline-block bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-teal-800 transition"
        >
          Search the Directory
        </Link>
      </div>

      {/* Related posts */}
      {otherPosts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-slate-800 mb-4">More Articles</h2>
          <div className="space-y-4">
            {otherPosts.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="block bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-teal-300 transition"
              >
                <p className="font-semibold text-slate-800 hover:text-teal-700 transition mb-1">{p.title}</p>
                <p className="text-sm text-slate-500">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
