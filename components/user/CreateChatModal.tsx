import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useState } from "react";

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string) => Promise<void>;
  user: {
    displayName: string | null;
    email: string | null;
  };
}

export function CreateChatModal({ isOpen, onClose, onConfirm, user }: CreateChatModalProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      await onConfirm(message);
      onClose();
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Create Chat</ModalHeader>
        <ModalBody>
          <p className="mb-4">
            Start a chat with {user.displayName || user.email || 'User'}
          </p>
          <Input
            label="Initial Message"
            placeholder="Type your first message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            autoFocus
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleConfirm}
            isLoading={loading}
            isDisabled={!message.trim()}
          >
            Create Chat
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 