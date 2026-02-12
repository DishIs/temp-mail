// components/blog/CommentForm.tsx
"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { postCommentAction } from "@/app/blog/actions";
import { Loader2, Send } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="mt-4">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Posting...
        </>
      ) : (
        <>
          Post Comment
          <Send className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}

export function CommentForm({ postSlug }: { postSlug: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await postCommentAction(formData);
        formRef.current?.reset();
      }}
      className="mt-8 p-6 bg-card border rounded-lg shadow-sm"
    >
      <h3 className="text-lg font-semibold mb-4">Leave a Reply</h3>
      <input type="hidden" name="postSlug" value={postSlug} />
      <textarea
        name="content"
        required
        placeholder="Share your thoughts..."
        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}