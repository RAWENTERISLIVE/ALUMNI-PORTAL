import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { LinkIcon } from 'lucide-react';

interface Attachment {
  type: string;
  url: string;
  name: string;
  size?: number;
  extension?: string;
}

interface SharedPostProps {
  post: {
    id: string;
    content: string;
    author: {
      id?: string;
      name: string;
      profileImage?: string;
    };
    createdAt: string;
    imageUrl?: string;
    attachments?: Attachment[];
  };
}

export function SharedPost({ post }: SharedPostProps) {
  return (
    <Card className="mt-3 border-border shadow-sm">
      <CardHeader className="p-3 pb-0">
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={post.author.profileImage || '/placeholder.svg'} />
            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{post.author.name}</p>
            <p className="text-xs text-muted/300">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap line-clamp-4">
          {post.content}
        </p>
        
        {post.imageUrl && (
          <div className="mt-2 rounded-lg overflow-hidden">
            <img
              src={post.imageUrl}
              alt="Shared post image"
              className="w-full h-auto max-h-40 object-cover rounded-lg"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* Display attachments if present, but limit to first one */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mt-2">
            <div 
              className="flex items-center p-2 rounded-lg border border-border bg-muted/30"
            >
              <div className="mr-2 text-foreground">
                {post.attachments[0].type === 'document' && <div className="text-lg">📄</div>}
                {post.attachments[0].type === 'image' && <div className="text-lg">🖼️</div>}
                {post.attachments[0].type === 'video' && <div className="text-lg">🎬</div>}
                {post.attachments[0].type === 'link' && <LinkIcon className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <a 
                  href={post.attachments[0].url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-foreground/90 hover:underline font-medium text-xs truncate block"
                >
                  {post.attachments[0].name}
                </a>
                {post.attachments.length > 1 && (
                  <p className="text-xs text-muted/300">+{post.attachments.length - 1} more</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SharedPost;
