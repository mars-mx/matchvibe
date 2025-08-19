'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { VibeAnalysisResult } from '@/features/vibe-analysis/types';
import { generateShareText, generateShareUrl } from '@/features/vibe-analysis/lib/api-client';
import { cn } from '@/lib/utils';
import { Share2, Twitter, Link, Check, Copy } from 'lucide-react';

interface ShareResultsProps {
  result: VibeAnalysisResult;
  className?: string;
  variant?: 'default' | 'compact';
}

export function ShareResults({ result, className, variant = 'default' }: ShareResultsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = generateShareUrl(result);
  const shareText = generateShareText(result);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: 'Vibe Check Results',
        text: shareText,
        url: shareUrl,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Failed to share');
      }
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex gap-2', className)}>
        <Button
          size="sm"
          onClick={handleShareTwitter}
          className="gap-2 border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/20"
        >
          <Twitter className="h-3 w-3" />
          Tweet
        </Button>
        <Button
          size="sm"
          onClick={handleCopyLink}
          className="gap-2 border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/20"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </Button>
        <Button
          size="sm"
          onClick={handleNativeShare}
          className="gap-2 border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/20"
        >
          <Share2 className="h-3 w-3" />
          Share
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="default" onClick={handleShareTwitter} className="flex-1 gap-2">
          <Twitter className="h-4 w-4" />
          Share on X
        </Button>

        <Button variant="outline" onClick={handleCopyLink} className="flex-1 gap-2">
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Link Copied!
            </>
          ) : (
            <>
              <Link className="h-4 w-4" />
              Copy Link
            </>
          )}
        </Button>

        <Button variant="outline" onClick={handleNativeShare} className="flex-1 gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>

      <div className="bg-muted/30 rounded-lg border p-3">
        <p className="text-muted-foreground text-xs">
          Share your vibe compatibility results with friends and see how you match up!
        </p>
      </div>
    </div>
  );
}
