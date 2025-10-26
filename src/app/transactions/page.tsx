'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, History, TrendingDown, TrendingUp, ArrowRightLeft, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { InventoryTransaction, TransactionType } from '@/types';
import { format } from 'date-fns';

const transactionTypeColors: Record<TransactionType, string> = {
    sale: 'destructive',
    production: 'default',
    transfer: 'secondary',
    adjustment: 'outline',
};

const transactionTypeIcons: Record<TransactionType, any> = {
    sale: TrendingDown,
    production: TrendingUp,
    transfer: ArrowRightLeft,
    adjustment: Settings,
};

const transactionTypeLabels: Record<TransactionType, string> = {
    sale: 'Sale',
    production: 'Production',
    transfer: 'Transfer',
    adjustment: 'Adjustment',
};

export default function TransactionsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            loadTransactions();
            loadStats();
        }
    }, [user, typeFilter]);

    const loadTransactions = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            if (typeFilter !== 'all') {
                params.append('type', typeFilter);
            }
            params.append('limit', '200');

            const response = await fetch(`/api/transactions?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setTransactions(data.transactions);
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to load transactions',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            toast({
                title: 'Error',
                description: 'Failed to load transactions',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await fetch('/api/transactions/stats');
            const data = await response.json();

            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const formatDate = (date: Date) => {
        try {
            return format(new Date(date), 'MMM d, yyyy h:mm a');
        } catch {
            return 'N/A';
        }
    };

    const formatQuantity = (quantity: number, type: TransactionType) => {
        const sign = quantity >= 0 ? '+' : '';
        return `${sign}${quantity}`;
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Header />
            <div className="container mx-auto p-6 max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
                    <p className="text-muted-foreground">
                        Complete audit trail of all inventory movements
                    </p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid gap-4 md:grid-cols-4 mb-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalSales}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Production</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalProduction}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
                                <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalTransfers}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Adjustments</CardTitle>
                                <Settings className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalAdjustments}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    <div className="w-64">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="sale">Sales</SelectItem>
                                <SelectItem value="production">Production</SelectItem>
                                <SelectItem value="transfer">Transfers</SelectItem>
                                <SelectItem value="adjustment">Adjustments</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button variant="outline" onClick={loadTransactions}>
                        Refresh
                    </Button>
                </div>

                {/* Transactions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>
                            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {transactions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>From</TableHead>
                                            <TableHead>To</TableHead>
                                            <TableHead>Source</TableHead>
                                            <TableHead>Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((transaction) => {
                                            const Icon = transactionTypeIcons[transaction.type];
                                            return (
                                                <TableRow key={transaction.id}>
                                                    <TableCell className="whitespace-nowrap">
                                                        {formatDate(transaction.createdAt)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={transactionTypeColors[transaction.type] as any}
                                                            className="flex items-center gap-1 w-fit"
                                                        >
                                                            <Icon className="h-3 w-3" />
                                                            {transactionTypeLabels[transaction.type]}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{transaction.productName}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {transaction.productSku}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={
                                                                transaction.quantity >= 0
                                                                    ? 'text-green-600 font-medium'
                                                                    : 'text-red-600 font-medium'
                                                            }
                                                        >
                                                            {formatQuantity(transaction.quantity, transaction.type)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {transaction.fromLocationName || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {transaction.toLocationName || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{transaction.source}</Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-xs truncate">
                                                        {transaction.notes || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No transactions found</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}


