import React, { useState, useRef } from 'react';
import { Check, Copy, Link as LinkIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../../hooks/use-toast';

interface ShareExamLinkProps {
  testId: string;
  className?: string;
}

const ShareExamLink: React.FC<ShareExamLinkProps> = ({ testId, className = '' }) => {
  const [isCopied, setIsCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Construct the full URL for the exam
  const baseUrl = window.location.origin;
  const examUrl = `${baseUrl}/tests/take/${testId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(examUrl);
      setIsCopied(true);
      toast({
        title: 'Link copied!',
        description: 'The exam link has been copied to your clipboard.',
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast({
        title: 'Failed to copy',
        description: 'Could not copy the link to clipboard. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor="share-link" className="text-sm font-medium text-gray-700 flex items-center">
        <LinkIcon className="h-4 w-4 mr-2" />
        Shareable Exam Link
      </label>
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            id="share-link"
            type="text"
            value={examUrl}
            readOnly
            onFocus={handleFocus}
            className="pr-10 font-mono text-sm"
          />
        </div>
        <Button
          type="button"
          onClick={handleCopy}
          variant="outline"
          className="shrink-0"
        >
          {isCopied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Share this link with others to allow them to take this exam. They will need to log in first.
      </p>
    </div>
  );
};

export default ShareExamLink;
