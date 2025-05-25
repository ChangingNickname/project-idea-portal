import { CardPost } from './CardPost';
import { Input } from '@heroui/input';
import { useState } from 'react';

type Post = {
  id: string;
  name: string;
  shortDesc: string;
  fullDesc: string;
  authorId: string;
  createdAt: string;
  status: 'Open' | 'Closed' | 'In Progress';
  tags: string[];
  image: string;
  email?: string;
};

type PostContainerProps = {
  posts: Post[];
  editable?: boolean;
  onDelete?: (id: string) => void;
};

export function PostContainer({ posts, editable, onDelete }: PostContainerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = posts.filter(post => {
    const query = searchQuery.toLowerCase();
    return (
      (post.name?.toLowerCase().includes(query) || false) ||
      (post.authorId?.toLowerCase().includes(query) || false) ||
      (post.email?.toLowerCase().includes(query) || false)
    );
  });

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search by title, email, or author uid..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full"
      />
      <div className="flex flex-wrap gap-6 max-w-7xl mx-auto justify-center items-stretch">
        {filteredPosts.map((post) => (
          <CardPost key={post.id} post={post} editable={editable} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
} 