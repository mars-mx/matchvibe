'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UsernameInput } from './username-input';
import { analyzeVibeAction, type FormState } from '@/features/vibe-analysis/actions/analyze.action';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';

interface VibeAnalyzerFormProps {
  onSuccess?: (result: FormState) => void;
  className?: string;
  defaultUserOne?: string;
  defaultUserTwo?: string;
}

const initialState: FormState = {
  success: false,
};

export function VibeAnalyzerForm({
  onSuccess,
  className,
  defaultUserOne = '',
  defaultUserTwo = '',
}: VibeAnalyzerFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (prevState: FormState | null, formData: FormData) => {
      const result = await analyzeVibeAction(prevState, formData);
      if (result.success && onSuccess) {
        onSuccess(result);
      }
      return result;
    },
    initialState
  );

  const hasGeneralError = state?.errors?.general && state.errors.general.length > 0;
  const hasAnyError = hasGeneralError || state?.message;

  return (
    <form action={formAction} className={cn('space-y-4', className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <UsernameInput
          id="userOne"
          name="userOne"
          label="First User"
          placeholder="marsc_hb"
          defaultValue={defaultUserOne}
          disabled={isPending}
          error={state?.errors?.userOne}
          required
        />

        <UsernameInput
          id="userTwo"
          name="userTwo"
          label="Second User"
          placeholder="richkuo7"
          defaultValue={defaultUserTwo}
          disabled={isPending}
          error={state?.errors?.userTwo}
          required
        />
      </div>

      <input type="hidden" name="analysisDepth" value="standard" />

      {hasAnyError && !state?.success && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {state?.message || state?.errors?.general?.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isPending} className="w-full gap-2" size="lg">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing Vibe Compatibility...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Analyze Vibe Match
          </>
        )}
      </Button>

      <p className="text-muted-foreground text-center text-xs">
        Powered by AI analysis of public X profiles and interactions
      </p>
    </form>
  );
}
