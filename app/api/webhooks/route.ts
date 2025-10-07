import { createErrorResponse, createSuccessResponse } from '@/app/lib/api-utils';
import { AuthContext, withApiAuth } from '@/app/lib/auth-middleware';
import { addWebhook, getWebhooks, type Webhook } from '@/app/lib/utils/webhooks';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// Type guard function
function isWebhookCreateRequest(obj: unknown): obj is { url: string; event: string; enabled?: boolean } {
  if (!obj || typeof obj !== 'object') return false;
  const req = obj as Record<string, unknown>;
  return typeof req.url === 'string' &&
    typeof req.event === 'string' &&
    req.url.trim().length > 0 &&
    req.event.trim().length > 0;
}

// GET: Get all webhooks
export async function GET() {
  try {
    const webhooks = getWebhooks();
    return NextResponse.json(createSuccessResponse({
      webhooks,
      count: webhooks.length
    }, 'Webhooks retrieved successfully'));
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(createErrorResponse('Failed to fetch webhooks', 500));
  }
}

// POST: Create new webhook
export const POST = withApiAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    if (!context.user || context.user.role !== 'admin') {
      return NextResponse.json(createErrorResponse('Admin access required', 403));
    }

    let requestData;
    try {
      requestData = await request.json();
    } catch {
      return NextResponse.json(createErrorResponse('Invalid JSON data', 400));
    }

    if (!isWebhookCreateRequest(requestData)) {
      return NextResponse.json(createErrorResponse(
        'Invalid webhook data. Required: url (string), event (string)',
        400
      ));
    }

    const { url, event, enabled = true } = requestData;

    // URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json(createErrorResponse('Invalid URL format', 400));
    }

    // Create webhook
    const newWebhook: Webhook = {
      id: randomUUID(),
      url: url.trim(),
      event: event.trim() as 'post_created' | 'post_updated' | 'comment_created',
      enabled,
      createdAt: new Date().toISOString()
    };

    addWebhook(newWebhook);

    return NextResponse.json(createSuccessResponse(
      { webhook: newWebhook },
      'Webhook created successfully'
    ));

  } catch (error) {
    console.error('Webhook creation error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(createErrorResponse('Invalid JSON data', 400));
    }
    return NextResponse.json(createErrorResponse('An error occurred while creating the webhook', 500));
  }
});
