import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t py-10">
      <div className="container mx-auto grid gap-8 px-4 md:grid-cols-4">
        <div>
          <div className="font-bold text-lg">AIAtlas</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Open-source AI tools directory.
          </p>
        </div>
        <div>
          <div className="font-semibold mb-2">Explore</div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li><Link href="/tools">Tools</Link></li>
            <li><Link href="/models">Models</Link></li>
            <li><Link href="/resources">Resources</Link></li>
            <li><Link href="/compare">Compare</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Community</div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li><Link href="/submit">Submit a tool</Link></li>
            <li><a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Legal</div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li><Link href="/about">About</Link></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto mt-8 px-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} AIAtlas. MIT License.
      </div>
    </footer>
  );
}
