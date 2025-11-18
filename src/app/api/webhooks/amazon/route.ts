import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Amazon webhook secret for signature verification
const AMAZON_WEBHOOK_SECRET = process.env.AMAZON_WEBHOOK_SECRET;

/**
 * Verify Amazon EventBridge notification signature
 * Amazon sends notifications via EventBridge/SNS
 */
async function verifyAmazonWebhook(
    signature: string | null,
    timestamp: string | null,
    body: string
): Promise<boolean> {
    if (!AMAZON_WEBHOOK_SECRET || !signature || !timestamp) {
        return false;
    }

    try {
        // Amazon uses HMAC-SHA256 for webhook signatures
        const expectedSignature = crypto
            .createHmac('sha256', AMAZON_WEBHOOK_SECRET)
            .update(`${timestamp}.${body}`)
            .digest('hex');

        return signature === expectedSignature;
    } catch (error) {
        console.error('Error verifying Amazon webhook:', error);
        return false;
    }
}

export async function POST(request: NextRequest) {
    console.log('Received Amazon webhook');

    const body = await request.text();
    const signature = request.headers.get('x-amz-sns-signature');
    const timestamp = request.headers.get('x-amz-sns-message-timestamp');

    // For Amazon SNS subscription confirmation
    const messageType = request.headers.get('x-amz-sns-message-type');

    if (messageType === 'SubscriptionConfirmation') {
        try {
            const payload = JSON.parse(body);
            console.log('Amazon SNS subscription confirmation:', payload.SubscribeURL);

            // In production, you would automatically confirm the subscription:
            // await fetch(payload.SubscribeURL);

            return NextResponse.json({
                status: 'subscription_confirmation_received',
                message: 'Visit the SubscribeURL to confirm the subscription',
                subscribeUrl: payload.SubscribeURL
            });
        } catch (error) {
            console.error('Error processing subscription confirmation:', error);
            return NextResponse.json({ error: 'Invalid subscription confirmation' }, { status: 400 });
        }
    }

    // Verify the webhook for regular notifications
    const isVerified = await verifyAmazonWebhook(signature, timestamp, body);

    if (!isVerified && process.env.NODE_ENV === 'production') {
        console.warn('Could not verify Amazon webhook request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Amazon webhook verified successfully');

    try {
        const payload = JSON.parse(body);
        console.log('Amazon webhook payload:', JSON.stringify(payload, null, 2));

        // Handle different Amazon notification types
        if (payload.Message) {
            const message = JSON.parse(payload.Message);

            // Handle different event types
            switch (message.NotificationType) {
                case 'INVENTORY_CHANGE':
                    console.log('Amazon inventory change notification:', message);
                    // TODO: Update local inventory based on Amazon changes
                    break;

                case 'ORDER_CHANGE':
                    console.log('Amazon order notification:', message);
                    // TODO: Process order and update inventory
                    break;

                case 'LISTING_CHANGE':
                    console.log('Amazon listing change notification:', message);
                    // TODO: Update product mappings if listing changed
                    break;

                default:
                    console.log('Unknown Amazon notification type:', message.NotificationType);
            }
        }

        return NextResponse.json({ status: 'success' }, { status: 200 });
    } catch (error) {
        console.error('Error processing Amazon webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    // Some webhook systems send a verification GET request
    const challenge = request.nextUrl.searchParams.get('challenge');

    if (challenge) {
        return NextResponse.json({ challenge });
    }

    return NextResponse.json({
        message: 'Amazon webhook endpoint is active',
        methods: ['POST']
    });
}



