'use client';

import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { PostModal } from "./PostModal";
import { Button } from "@heroui/button";
import { app } from '@/lib/firebase/client'; // ✅ Make sure this points to your Firebase client app

export const PostAddButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) {
        setIsAllowed(true);  // ✅ Logged in & not anonymous
      } else {
        setIsAllowed(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!isAllowed) return null; // 🔒 hide the button

  return (
    <>
      <Button
        color="primary"
        variant="solid"
        className="fixed bottom-6 right-6 z-50 rounded-full px-6 py-3"
        onPress={() => setIsModalOpen(true)}
      >
        + Add Post
      </Button>
      <PostModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
