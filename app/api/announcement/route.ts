import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { auth } from "@/auth";

export const runtime = "nodejs";

const redis = Redis.fromEnv();

const ANNOUNCEMENT_KEY = "announcement:active";

export interface Announcement {
  active: boolean;
  alwaysShow: boolean;
  title: string;
  message: string;
  link?: string;
  visibleOnMobile: boolean;
  isVisibleToPro: boolean;
  proDismissTime: number;
  freeDismissTime: number;
  delayBeforeShowing: number;
  showAfter1stEmailArrives: boolean;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  position: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

const DEFAULT_ANNOUNCEMENT: Announcement = {
  active: false,
  alwaysShow: false,
  title: "",
  message: "",
  visibleOnMobile: true,
  isVisibleToPro: true,
  proDismissTime: 3000,
  freeDismissTime: 5000,
  delayBeforeShowing: 0,
  showAfter1stEmailArrives: false,
  backgroundColor: "#0f172a",
  textColor: "#f8fafc",
  accentColor: "#f59e0b",
  position: "top-right",
};

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userPlan = session?.user?.plan as string | undefined;
    const isPro = userPlan === "pro" || userPlan === "growth" || userPlan === "enterprise";
    const isProBoolean = Boolean(isPro);

    const announcementData = await redis.get<Announcement>(ANNOUNCEMENT_KEY);
    const announcement = { ...DEFAULT_ANNOUNCEMENT, ...announcementData };

    if (!announcement.active) {
      return NextResponse.json({ show: false });
    }

    if (!announcement.isVisibleToPro && isProBoolean) {
      return NextResponse.json({ show: false });
    }

    const userAgent = req.headers.get("user-agent") || "";
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    if (!announcement.visibleOnMobile && isMobile) {
      return NextResponse.json({ show: false });
    }

    if (!announcement.alwaysShow && session?.user?.email) {
      const dismissedKey = `announcement:dismissed:${session.user.email}`;
      const isDismissed = await redis.get(dismissedKey);
      if (isDismissed) {
        return NextResponse.json({ show: false });
      }
    }

    return NextResponse.json({
      show: true,
      announcement: {
        id: "announcement-1",
        title: announcement.title,
        message: announcement.message,
        link: announcement.link,
        backgroundColor: announcement.backgroundColor,
        textColor: announcement.textColor,
        accentColor: announcement.accentColor,
        position: announcement.position,
        dismissTime: isProBoolean ? announcement.proDismissTime : announcement.freeDismissTime,
        delayBeforeShowing: announcement.delayBeforeShowing,
        showAfter1stEmailArrives: announcement.showAfter1stEmailArrives,
      },
    });
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json({ show: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, announcementId } = await req.json();

    const viewKey = `announcement:views:${announcementId}`;
    const clickKey = `announcement:clicks:${announcementId}`;

    if (action === "view") {
      await redis.incr(viewKey);
      return NextResponse.json({ success: true });
    }

    if (action === "click") {
      await redis.incr(clickKey);
      return NextResponse.json({ success: true });
    }

    if (action === "dismiss") {
      const session = await auth();
      if (session?.user?.email) {
        const userEmail = session.user.email;
        const dismissedKey = `announcement:dismissed:${userEmail}`;
        await redis.setex(dismissedKey, 86400 * 7, "1");
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error tracking announcement:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}