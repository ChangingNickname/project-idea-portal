'use client';

import React, { useState } from "react";
// import { useRouter } from "next/router";
import { PostModal } from "./PostModal";
import {Button, ButtonGroup} from "@heroui/button";
export const PostAddButton = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    // const router = useRouter();

    // const handleAddPost = () => {
    //     router.push("/dashboard/new-post");
    // };

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
