import React, { useState } from "react";
// import { useRouter } from "next/router";
import { PostModal } from "./PostModal";

export const PostAddButton = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    // const router = useRouter();

    // const handleAddPost = () => {
    //     router.push("/dashboard/new-post");
    // };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-6 right-6 z-50 rounded-full px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold shadow-lg"
            >
                + Add Post
            </button>
            <PostModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};
