import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  paymentMode: "UPI" | "Bank Transfer" | "Cash" | "Net Banking" | string;
  status: 'Completed' | 'Pending' | 'Failed';
  receiver: string;
  remarks?: string;
}

interface PaymentHistoryProps {
  userId?: string; // Optional: if not provided, use currently logged-in user
  payments: PaymentRecord[];
  title?: string;
}

const PaymentHistory = ({ payments, title = "Payment History" }: PaymentHistoryProps) => {
  const getPaymentModeStyle = (mode: string) => {
    switch (mode) {
      case 'UPI':
        return 'bg-accent-light text-accent';
      case 'Bank Transfer':
        return 'bg-primary-light text-primary';
      case 'Cash':
        return 'bg-warning-light text-warning';
      default:
        return 'bg-surface text-text-secondary';
    }
  };
  
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-accent-light text-accent';
      case 'Pending':
        return 'bg-warning-light text-warning';
      case 'Failed':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-surface text-text-secondary';
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          View all your financial contributions and payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            No payment history available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receiver</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-surface-hover">
                    <TableCell>{payment.date}</TableCell>
                    <TableCell className="font-medium">₹{payment.amount}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getPaymentModeStyle(payment.paymentMode)}`}>
                        {payment.paymentMode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getStatusStyle(payment.status)}`}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{payment.receiver}</TableCell>
                    <TableCell className="text-text-muted">{payment.remarks || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentHistory;