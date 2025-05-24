'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/client';
import { PostModal } from '@/components/create_form/PostModal';
import { Button } from '@heroui/button';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalContent } from '@heroui/modal';
import { addToast } from '@heroui/toast';
import Link from 'next/link';
import { PostAddButton } from '@/components/create_form/callbutton';

export default function MyPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [editPost, setEditPost] = useState<any | null>(null);
  const [deletePost, setDeletePost] = useState<any | null>(null);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
        if (user && !user.isAnonymous) {
        setUserId(user.uid);
        const res = await fetch(`/api/user-posts/${user.uid}`);
        const data = await res.json();

        if (Array.isArray(data)) {
            setPosts(data);
        } else {
            console.error('❌ Expected array but got:', data);
            setPosts([]); // fallback to empty
        }
        }
    });

    return () => unsub();
    }, []);

  if (!userId) return <p className="text-center text-gray-500">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">📝 My Posts</h1>
        <PostAddButton />
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-gray-500">You have no posts yet.</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="bg-white border rounded p-4 mb-4 shadow-sm">
            <h2 className="font-bold text-lg">{post.title}</h2>
            <p className="text-sm text-gray-600 mb-3">{post.shortDesc}</p>
            <div className="flex gap-3">
              <Button color="primary" onPress={() => setEditPost(post)}>Edit Post</Button>
              <Button color="danger" variant="light" onPress={() => {
                setDeletePost(post);
                setConfirmText('');
              }}>Delete Post</Button>
            </div>
          </div>
        ))
      )}

      {editPost && (
        <PostModal
          isOpen={!!editPost}
          onClose={() => setEditPost(null)}
          initialData={editPost}
          isEdit
        />
      )}

      {deletePost && (
        <Modal isOpen={true} onClose={() => setDeletePost(null)}>
          <ModalContent>
            <ModalHeader>Confirm Deletion</ModalHeader>
            <ModalBody>
              <p className="mb-2">
                To confirm deletion, type the post title: <strong>{deletePost.title}</strong>
              </p>
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Type title here..."
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={() => setDeletePost(null)}>Cancel</Button>
              <Button
                color="danger"
                onPress={async () => {
                  if (confirmText === deletePost.title) {
                    await fetch(`/api/posts/${deletePost.id}`, { method: 'DELETE' });
                    setPosts(posts.filter((p) => p.id !== deletePost.id));
                    addToast({ title: "Post Deleted", color: "success" });
                    setDeletePost(null);
                  } else {
                    addToast({ title: "Incorrect title", color: "danger" });
                  }
                }}
              >
                Confirm Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
