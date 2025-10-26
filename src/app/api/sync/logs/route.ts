import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { SyncLog } from '@/types';

/**
 * API route to get sync logs
 * GET /api/sync/logs?limit=20
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const limitNum = parseInt(searchParams.get('limit') || '20');

        // Get sync logs using Admin SDK
        const logsSnapshot = await adminDb
            .collection('sync_logs')
            .orderBy('createdAt', 'desc')
            .limit(limitNum)
            .get();

        const logs = logsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date()
            };
        }) as SyncLog[];

        return NextResponse.json({
            success: true,
            logs,
            count: logs.length
        });
    } catch (error) {
        console.error('Error fetching sync logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sync logs', details: (error as Error).message },
            { status: 500 }
        );
    }
}

