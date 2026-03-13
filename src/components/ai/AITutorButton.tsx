import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { AITutorChat } from './AITutorChat';

interface AITutorButtonProps {
  context?: string;
}

export const AITutorButton: React.FC<AITutorButtonProps> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg z-40"
        size="icon"
      >
        <Sparkles className="w-6 h-6" />
      </Button>
      
      <AITutorChat 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        context={context}
      />
    </>
  );
};
