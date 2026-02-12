// app/blog/actions.ts (Create this new file)
"use server";

import { blogClient } from "@/lib/blog-client";
import { revalidatePath } from "next/cache";

// This is an example of getting user data. Replace with your actual auth system.
// import { auth } from '@/auth'; 

export async function postCommentAction(formData: FormData) {
  // const session = await auth(); // 1. Get user session (e.g., from NextAuth.js)
  // if (!session?.user) {
  //   throw new Error("You must be logged in to comment.");
  // }
  
  const postSlug = formData.get("postSlug") as string;
  const content = formData.get("content") as string;
  const parentId = formData.get("parentId") as string | undefined;

  if (!postSlug || !content) {
    throw new Error("Post slug and content are required.");
  }

  try {
    // 2. Call the SDK using your secure, server-side client
    await blogClient.postComment({
      postSlug,
      content,
      parentId,
      // 3. Pass the user's token or ID for your API's user authentication
      userToken: "example_user_jwt_or_id", // Replace with session.accessToken or similar
    });

    // 4. Revalidate the path to show the new comment instantly
    revalidatePath(`/blog/${postSlug}`);
  } catch (error: any) {
    // In a real app, you'd handle this more gracefully
    console.error("Failed to post comment:", error);
    throw new Error("Could not post comment. Please try again.");
  }
}