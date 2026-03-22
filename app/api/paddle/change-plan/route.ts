// app/api/paddle/change-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { callInternalAPI } from '@/lib/api';

const PLAN_ORDER = ['free', 'developer', 'startup', 'growth', 'enterprise'] as const;
type ApiPlanName = typeof PLAN_ORDER[number];

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  let body: { targetPlan?: string; reason?: string; comment?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { targetPlan, reason, comment } = body;

  if (!targetPlan || !PLAN_ORDER.includes(targetPlan as ApiPlanName)) {
    return NextResponse.json(
      { success: false, message: 'Invalid or missing targetPlan' },
      { status: 400 }
    );
  }

  try {
    const data = await callInternalAPI(req, '/user/api-plan/change', {
      method: 'POST',
      body: JSON.stringify({
        userId: session.user.id,
        targetPlan,
        reason: reason ?? null,
        comment: comment ?? null,
      }),
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}