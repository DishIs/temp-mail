// app/actions/rating.ts
"use server";

import { Redis } from "@upstash/redis";
import { cookies } from "next/headers";
import { auth } from "@/auth";

export async function submitRating(rating: number) {
  // Allow half-star values (0.5 to 5.0)
  if (rating < 0.5 || rating > 5) throw new Error("Invalid rating");

  const redis = Redis.fromEnv();
  const session = await auth();
  let raterId = session?.user?.id;
  const cookieStore = await cookies();

  if (!raterId) {
    let deviceId = cookieStore.get("device_id")?.value;
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      cookieStore.set("device_id", deviceId, {
        maxAge: 60 * 60 * 24 * 365 * 10,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    }
    raterId = deviceId;
  }

  const userKey = `rating:user:${raterId}`;

  try {
    const oldRating = await redis.get<number>(userKey);
    const p = redis.pipeline();

    if (oldRating) {
      // Update existing rating using INCRBYFLOAT for half-stars
      p.incrbyfloat("rating:total_stars", rating - oldRating);
    } else {
      // New rating
      p.incr("rating:total_count");
      p.incrbyfloat("rating:total_stars", rating);
    }
    p.set(userKey, rating);

    await p.exec();

    const [newTotalStars, newTotalCount] = await Promise.all([
      redis.get<number>("rating:total_stars"),
      redis.get<number>("rating:total_count"),
    ]);

    return {
      totalStars: newTotalStars || 0,
      totalCount: newTotalCount || 0,
      userRating: rating,
    };
  } catch (error) {
    console.error("Error saving rating to Redis", error);
    throw new Error("Failed to save rating");
  }
}