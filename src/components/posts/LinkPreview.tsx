import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, X } from 'lucide-react';

interface LinkPreviewProps {
  url: string;
  onRemove?: () => void;
  showRemove?: boolean;
}

interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

export function LinkPreview({ url, onRemove, showRemove = false }: Readonly<LinkPreviewProps>) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchLinkMetadata = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      
      // For demo purposes, we'll create mock metadata based on the URL
      // In a real implementation, you'd call an API that fetches Open Graph data
      const mockMetadata = generateMockMetadata(url);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMetadata(mockMetadata);
    } catch (err) {
      console.error('Failed to fetch link metadata:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchLinkMetadata();
  }, [fetchLinkMetadata]);

  const generateMockMetadata = (url: string): LinkMetadata => {
    const domain = new URL(url).hostname;
    
    // Generate metadata based on domain
    if (domain.includes('github.com')) {
      return {
        title: 'GitHub Repository',
        description: 'A repository hosted on GitHub with source code and documentation.',
        image: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
        siteName: 'GitHub',
        url
      };
    } else if (domain.includes('linkedin.com')) {
      return {
        title: 'LinkedIn Profile or Post',
        description: 'Professional content shared on LinkedIn.',
        image: 'https://static.licdn.com/aero-v1/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
        siteName: 'LinkedIn',
        url
      };
    } else if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
      return {
        title: 'YouTube Video',
        description: 'A video shared on YouTube platform.',
        image: 'https://www.youtube.com/s/desktop/f506bd45/img/favicon_32.png',
        siteName: 'YouTube',
        url
      };
    } else if (domain.includes('medium.com')) {
      return {
        title: 'Medium Article',
        description: 'An insightful article published on Medium platform.',
        image: 'https://miro.medium.com/max/1200/1*emiGsBgJu2KHWyjluhKXQw.png',
        siteName: 'Medium',
        url
      };
    } else {
      return {
        title: domain.charAt(0).toUpperCase() + domain.slice(1),
        description: `Content from ${domain}`,
        image: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        siteName: domain,
        url
      };
    }
  };

  const openLink = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <Card className="border border-slate-200 animate-pulse">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="w-16 h-16 bg-slate-200 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              <div className="h-3 bg-slate-200 rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metadata) {
    return (
      <Card className="border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ExternalLink className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-900 truncate">{url}</p>
                <p className="text-xs text-slate-500">Unable to load preview</p>
              </div>
            </div>
            {showRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 hover:border-slate-300 transition-colors group">
      <CardContent className="p-0">
        <button 
          className="flex w-full text-left" 
          onClick={openLink}
          aria-label={`Open link to ${metadata.title}`}
        >
          {metadata.image && (
            <div className="w-20 h-20 flex-shrink-0">
              <img
                src={metadata.image}
                alt={metadata.title}
                className="w-full h-full object-cover rounded-l"
                onError={(e) => {
                  e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
                }}
              />
            </div>
          )}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                {metadata.title && (
                  <h3 className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600">
                    {metadata.title}
                  </h3>
                )}
                {metadata.description && (
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {metadata.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                  <p className="text-xs text-slate-500 truncate">
                    {metadata.siteName || new URL(url).hostname}
                  </p>
                </div>
              </div>
              {showRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove?.();
                  }}
                  className="text-slate-400 hover:text-red-500 ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </button>
      </CardContent>
    </Card>
  );
}
