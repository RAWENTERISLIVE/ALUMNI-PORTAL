import { PostCard } from './PostCard';
import { EmptyState } from '@/components/common/EmptyState';
import { MessageSquare } from 'lucide-react';

interface PostAuthor {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface Post {
  id: string;
  title?: string;
  content: string;
  author: PostAuthor;
  category?: string;
  imageUrl?: string;
  isFeatured: boolean;
  isSchoolUpdate: boolean;
  likes: string[];
  visibility: 'public' | 'alumni_only' | 'private';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PostListProps {
  posts: Post[];
  onPostUpdated?: (updatedPost: Post) => void;
  onPostDeleted?: (deletedPostId: string) => void;
  currentUser?: any;
  showActions?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
}

export function PostList({
  posts,
  onPostUpdated,
  onPostDeleted,
  currentUser,
  showActions = false,
  emptyMessage = "No posts yet",
  emptyDescription = "Be the first to share something with your fellow alumni!"
}: PostListProps) {
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-12 w-12" />}
        title={emptyMessage}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onPostUpdated={onPostUpdated}
          onPostDeleted={onPostDeleted}
        />
      ))}
    </div>
  );
}
