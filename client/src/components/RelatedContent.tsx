
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface RelatedLink {
  title: string;
  description: string;
  url: string;
  category?: string;
}

interface RelatedContentProps {
  title?: string;
  links: RelatedLink[];
  columns?: 2 | 3;
}

export function RelatedContent({ 
  title = "Related Articles", 
  links, 
  columns = 3 
}: RelatedContentProps) {
  const fontFamily = 'AxLLCircular, Helvetica, Arial, sans-serif';
  
  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-6 md:px-12 lg:px-20">
        <h2 
          className="text-2xl md:text-3xl font-normal mb-8" 
          style={{ fontFamily }}
        >
          {title}
        </h2>
        
        <div className={`grid gap-6 ${columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {links.map((link, index) => (
            <Link key={index} href={link.url}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  {link.category && (
                    <p 
                      className="text-xs uppercase tracking-wider text-gray-600 mb-2"
                      style={{ fontFamily }}
                    >
                      {link.category}
                    </p>
                  )}
                  <CardTitle 
                    className="text-lg font-semibold flex items-start justify-between gap-2"
                    style={{ fontFamily }}
                  >
                    <span>{link.title}</span>
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p 
                    className="text-sm text-gray-600"
                    style={{ fontFamily }}
                  >
                    {link.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
