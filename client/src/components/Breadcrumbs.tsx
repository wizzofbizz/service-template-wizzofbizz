import { ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {item.url ? (
            <>
              <Link href={item.url}>
                <a className="hover:text-foreground transition-colors">{item.name}</a>
              </Link>
              {index < items.length - 1 && <ChevronRight className="h-4 w-4" />}
            </>
          ) : (
            <span className="text-foreground font-medium">{item.name}</span>
          )}
        </div>
      ))}
    </nav>
  );
}