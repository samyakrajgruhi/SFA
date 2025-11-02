import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { firestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface PaymentRecord {
  id: string;
  srNo: number;
  lobby: string;
  sfaId: string;
  name: string;
  cmsId: string;
  amount: string;
  dateString: string;
  screenshotUrl: string;
  date: any; // Firestore Timestamp
}

const MyPayments = () => {
    const { user, isLoading } = useAuth();
    const { toast } = useToast();
    

    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [isLoadingPayments, setIsLoadingPayments] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
    const [showScreenshotDialog, setShowScreenshotDialog] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentDate = new Date();
    const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

    useEffect(() => {
        const fetchMyPayments = async () => {
            if (!user?.isCollectionMember || !user?.sfaId) {
            setIsLoadingPayments(false);
            return;
            }

            try {
            setIsLoadingPayments(true);

            // 1. Fetch all transactions where of the receiver
            const transactionsRef = collection(firestore, 'transactions');
            const constraints = [where('receiverSfaId','==',user.sfaId)];

            constraints.push(where('month','==',selectedMonth));
            constraints.push(where('year','==',selectedYear));
            const q = query(
                transactionsRef,
                ...constraints
            );
            const querySnapshot = await getDocs(q);

            // 2. Get unique SFA IDs to batch fetch user data
            const uniqueSfaIds = new Set<string>();
            querySnapshot.docs.forEach(doc => {
                const sfaId = doc.data().sfaId;
                if (sfaId) uniqueSfaIds.add(sfaId);
            });

            // 3. Batch fetch all user data at once
            const userDataMap = new Map<string, { name: string; cmsId: string }>();
            
            if (uniqueSfaIds.size > 0) {
                const usersRef = collection(firestore, 'users');
                // Firestore 'in' query supports up to 10 items, so batch if needed
                const sfaIdArray = Array.from(uniqueSfaIds);
                
                for (let i = 0; i < sfaIdArray.length; i += 10) {
                const batch = sfaIdArray.slice(i, i + 10);
                const userQuery = query(usersRef, where('sfa_id', 'in', batch));
                const userSnapshot = await getDocs(userQuery);
                
                userSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    userDataMap.set(data.sfa_id, {
                    name: data.full_name || 'Unknown',
                    cmsId: data.cms_id || '-'
                    });
                });
                }
            }

            // 4. Build payment records
            const paymentsData: PaymentRecord[] = [];
            let srNo = 0;

            querySnapshot.docs.forEach(docSnapshot => {
                srNo++;
                const data = docSnapshot.data();
                
                // Get user data from map (already fetched)
                const userData = userDataMap.get(data.sfaId) || {
                name: 'Unknown',
                cmsId: '-'
                };

                paymentsData.push({
                id: docSnapshot.id,
                srNo,
                lobby: data.lobby || '-',
                sfaId: data.sfaId || '-',
                name: userData.name,
                cmsId: userData.cmsId,
                amount: data.amount || '0',
                dateString: data.dateString || '-',
                screenshotUrl: data.screenshotUrl || '',
                date: data.date
                });
            });

            // 5. Sort by date (newest first)
            paymentsData.sort((a, b) => {
                const dateA = a.date?.toDate ? a.date.toDate() : new Date(0);
                const dateB = b.date?.toDate ? b.date.toDate() : new Date(0);
                return dateB.getTime() - dateA.getTime();
            });

            setPayments(paymentsData);

            } catch (error) {
            console.error('Error fetching payments:', error);
            toast({
                title: 'Error',
                description: 'Failed to load payments',
                variant: 'destructive'
            });
            } finally {
            setIsLoadingPayments(false);
            }
        };

  fetchMyPayments();
}, [user, toast,selectedMonth, selectedYear]);

    const handleViewScreenshot = (payment: PaymentRecord) => {
    // 1. Set the selected payment
    setSelectedPayment(payment);
    
    // 2. Open the dialog
    setShowScreenshotDialog(true);
    };
  

        // Filter payments based on search term
    const filteredPayments = payments.filter((payment) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
        return (
            payment.name?.toLowerCase().includes(searchLower) ||
            payment.sfaId?.toLowerCase().includes(searchLower) ||
            payment.cmsId?.toLowerCase().includes(searchLower)
        );
    });


   // Protection check
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!user?.isCollectionMember) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            
            <main className="pt-20">
            <div className="max-w-7xl mx-auto px-6 py-12">
                
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-text-primary mb-4">
                        My Payments
                    </h1>
                    <p className="text-lg text-text-secondary">
                        Payments received in {months[selectedMonth]} {selectedYear}
                    </p>
                </div>

                {/* Stats Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                        <p className="text-sm text-text-secondary">Total Payments</p>
                        <p className="text-3xl font-bold text-text-primary">
                            {payments.length}
                        </p>
                        </div>
                    </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                        <p className="text-sm text-text-secondary">Total Amount</p>
                        <p className="text-3xl font-bold text-primary">
                            ₹{payments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0).toFixed(2)}
                        </p>
                        </div>
                    </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-secondary">Selected Period</p>
                            <p className="text-3xl font-bold text-accent">
                            {filteredPayments.length}
                            </p>
                        </div>
                        </div>
                    </CardContent>
                </Card>
                </div>

                {/* Filters: Month, Year, and Search */}
                <Card className="p-6 mb-8">
                    <div className="flex flex-col gap-4">
                        {/* Month and Year Selectors */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
                            <label className="text-lg font-semibold text-text-primary whitespace-nowrap">
                            Month:
                            </label>
                            <Select 
                            value={selectedMonth.toString()} 
                            onValueChange={(val) => setSelectedMonth(parseInt(val))}
                            >
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-surface border border-border z-50">
                                {months.map((month, index) => (
                                <SelectItem 
                                    key={index} 
                                    value={index.toString()} 
                                    className="hover:bg-surface-hover"
                                >
                                    {month}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
                            <label className="text-lg font-semibold text-text-primary whitespace-nowrap">
                            Year:
                            </label>
                            <Select 
                            value={selectedYear.toString()} 
                            onValueChange={(val) => setSelectedYear(parseInt(val))}
                            >
                            <SelectTrigger className="w-full sm:w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-surface border border-border z-50">
                                {years.map((year) => (
                                <SelectItem 
                                    key={year} 
                                    value={year.toString()} 
                                    className="hover:bg-surface-hover"
                                >
                                    {year}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <Input
                            className="pl-10 bg-surface"
                            placeholder="Search by name, SFA ID, or CMS ID"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                </Card>

                {/* Payments Table */}
                <Card className="p-0 overflow-hidden">
                <CardHeader className="p-6 bg-surface border-b border-border">
                    <CardTitle>Payment Records</CardTitle>
                    <CardDescription>
                    {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoadingPayments ? (
                    <div className="flex justify-center items-center p-12">
                        <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                    ) : filteredPayments.length === 0 ? (
                    <div className="text-center p-12 text-text-secondary">
                        {searchTerm ? 'No payments found matching your search' : 'No payments received yet'}
                    </div>
                    ) : (
                    <div className="overflow-x-auto">
                        <Table>
                        <TableHeader>
                            <TableRow className="bg-surface">
                            <TableHead className="font-semibold">Sr. No</TableHead>
                            <TableHead className="font-semibold">Lobby</TableHead>
                            <TableHead className="font-semibold">SFA ID</TableHead>
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">CMS ID</TableHead>
                            <TableHead className="font-semibold">Amount</TableHead>
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold text-right">Screenshot</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayments.map((payment) => (
                            <TableRow key={payment.id} className="hover:bg-surface-hover">
                                <TableCell className="font-medium">{payment.srNo}</TableCell>
                                <TableCell>
                                <span className="px-2 py-1 bg-primary-light text-primary rounded-dashboard-sm font-medium">
                                    {payment.lobby}
                                </span>
                                </TableCell>
                                <TableCell className="font-medium text-primary">
                                {payment.sfaId}
                                </TableCell>
                                <TableCell>{payment.name}</TableCell>
                                <TableCell className="font-mono text-sm">{payment.cmsId}</TableCell>
                                <TableCell>
                                <span className="font-semibold text-accent">₹{payment.amount}</span>
                                </TableCell>
                                <TableCell>{payment.dateString}</TableCell>
                                <TableCell className="text-right">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewScreenshot(payment)}
                                    disabled={!payment.screenshotUrl}
                                >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                    )}
                </CardContent>
                </Card>

                {/* Total Summary */}
                {filteredPayments.length > 0 && (
                <div className="mt-6 p-6 bg-surface rounded-lg border border-border">
                    <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-text-primary">
                        Total Amount Received:
                    </span>
                    <span className="text-2xl font-bold text-primary">
                        ₹{filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0).toFixed(2)}
                    </span>
                    </div>
                </div>
                )}

            </div>
            </main>

            {/* Screenshot Dialog */}
            <Dialog open={showScreenshotDialog} onOpenChange={setShowScreenshotDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                    <DialogTitle>Payment Screenshot</DialogTitle>
                    <DialogDescription>
                        Payment proof from {selectedPayment?.name} - ₹{selectedPayment?.amount}
                    </DialogDescription>
                    </DialogHeader>
                    {selectedPayment && selectedPayment.screenshotUrl ? (
                    <div className="flex justify-center p-4 bg-surface rounded-lg border border-border">
                        <img 
                        src={selectedPayment.screenshotUrl} 
                        alt="Payment Screenshot" 
                        className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                        />
                    </div>
                    ) : (
                    <div className="text-center py-12 text-text-secondary">
                        No screenshot available
                    </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MyPayments;