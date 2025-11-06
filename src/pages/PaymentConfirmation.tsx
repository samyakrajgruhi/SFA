import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { firestore, storage } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const PaymentConfirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isDataLoaded } = useAuth();
    const { toast } = useToast();

    const paymentData = location.state;

    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [isLoadingQr, setIsLoadingQr] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ Validate user data
    const isUserDataValid = () => {
        return (
            isDataLoaded &&
            user?.sfaId &&
            user.sfaId !== 'SFA000' &&
            user?.name &&
            user.name !== 'User Name'
        );
    };

    // ✅ Redirect if no payment data or invalid user data
    useEffect(() => {
        if (!paymentData) {
            toast({
                title: 'Error',
                description: 'No payment data found',
                variant: 'destructive'
            });
            navigate('/payment');
            return;
        }

        if (!isUserDataValid()) {
            console.error('⚠️ Invalid user data on payment confirmation');
            toast({
                title: 'Error',
                description: 'User data not loaded properly',
                variant: 'destructive'
            });
            navigate('/payment');
        }
    }, [paymentData, user, isDataLoaded, navigate, toast]);

    useEffect(() => {
        const fetchQrCode = async () => {
            if (!paymentData) {
                navigate('/payment');
                return;
            }
            
            try {
                setIsLoadingQr(true);
                const userRef = collection(firestore, 'users');
                const q = query(userRef, where('sfa_id', '==', paymentData.collectorSfaId));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const userData = querySnapshot.docs[0].data();
                    setQrCodeUrl(userData.qrCodeUrl || null);
                }
            } catch (error) {
                console.error("Error Fetching QR Code", error);
                toast({
                    title: "Error",
                    description: "Couldn't Fetch QR Code",
                    variant: 'destructive'
                });
            } finally {
                setIsLoadingQr(false);
            }
        };

        fetchQrCode();
    }, [paymentData, navigate, toast]);

    const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setScreenshotFile(null);
            setScreenshotPreview(null);
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Invalid File',
                description: 'Please upload an image file',
                variant: 'destructive'
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'File too large',
                description: 'Please upload an image smaller than 5MB',
                variant: 'destructive'
            });
            return;
        }

        setScreenshotFile(file);

        const reader = new FileReader();
        reader.onloadend = () => setScreenshotPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleRemoveScreenshot = () => {
        setScreenshotFile(null);
        setScreenshotPreview(null);
    };

    const handleSubmitPayment = async () => {
        // ✅ CRITICAL: Final validation before submission
        if (!isUserDataValid()) {
            toast({
                title: "Error",
                description: "User data validation failed. Please go back and try again.",
                variant: 'destructive'
            });
            return;
        }

        if (!screenshotFile) {
            toast({
                title: "Error",
                description: "Please upload payment screenshot",
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            
            // ✅ Generate timestamp for uniqueness (HHmmss format)
            const hours = String(currentDate.getHours()).padStart(2, '0');
            const minutes = String(currentDate.getMinutes()).padStart(2, '0');
            const seconds = String(currentDate.getSeconds()).padStart(2, '0');
            const timestamp = `${hours}${minutes}${seconds}`;
            
            // ✅ NEW FORMAT: SFAXXXX_DDMMYYYY_HHmmss
            const docId = `${user.sfaId}_${day}${month}${year}_${timestamp}`;
            
            console.log('📝 Creating transaction with ID:', docId);
            
            const fileExtension = screenshotFile.name.split('.').pop();

            // Upload screenshot to Firebase Storage
            const storageRef = ref(
                storage,
                `payment_screenshots/${year}/${month}/${docId}.${fileExtension}`
            );
            await uploadBytes(storageRef, screenshotFile);
            const screenshotUrl = await getDownloadURL(storageRef);

            // Format date
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = monthNames[currentDate.getMonth()];
            const formattedDateString = `${day}-${monthName}-${year}`;
            const monthNum = currentDate.getMonth();

            const transactionsRef = doc(collection(firestore, 'transactions'), docId);

            // ✅ Store transaction with validated user data
            await setDoc(transactionsRef, {
                transaction_id: docId,
                // User info (payer)
                sfaId: user.sfaId,
                userId: user.uid,
                userName: user.name,
                cmsId: user.cmsId || paymentData.payerCmsId,
                lobby: user.lobby || paymentData.payerLobby,

                // Payment info
                amount: paymentData.amount.toString(),
                receiver: paymentData.collectorName,
                receiverId: paymentData.collectorId,
                receiverSfaId: paymentData.collectorSfaId,
                receiverCmsId: paymentData.collectorCmsId,

                // Screenshot
                screenshotUrl: screenshotUrl,

                // Metadata
                mode: 'UPI',
                date: currentDate,
                dateString: formattedDateString,
                month: monthNum,
                year: year,
                createdAt: new Date(),
                timestamp: timestamp, // ✅ Store timestamp separately for reference
                remarks: 'Payment via app',

                // Verification status
                verified: false
            });

            console.log('✅ Payment recorded successfully:', {
                docId,
                payer: user.sfaId,
                receiver: paymentData.collectorSfaId,
                amount: paymentData.amount,
                timestamp
            });

            toast({
                title: "Success",
                description: "Payment submitted successfully!"
            });

            navigate('/payment', { replace: true });

        } catch (error) {
            console.error('❌ Error submitting payment:', error);
            toast({
                title: "Error",
                description: "Failed to submit payment",
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ✅ Show warning if user data becomes invalid
    if (!isUserDataValid()) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="pt-20">
                    <div className="max-w-2xl mx-auto px-6 py-12">
                        <Alert variant="destructive">
                            <AlertCircle className="h-5 w-5" />
                            <AlertTitle>Session Data Lost</AlertTitle>
                            <AlertDescription>
                                Your user data is no longer valid. Please return to the payment page and try again.
                            </AlertDescription>
                        </Alert>
                        <Button 
                            onClick={() => navigate('/payment')}
                            className="w-full mt-4"
                        >
                            Return to Payment Page
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            
            <main className="pt-20">
                <div className="max-w-3xl mx-auto px-6 py-12">

                    {/* Header with validation indicator */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-text-primary mb-4">
                            Complete Payment
                        </h1>
                        <p className="text-lg text-text-secondary">
                            Review details and upload payment proof
                        </p>
                        
                        {/* ✅ Data validation indicator */}
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-success-light text-success rounded-full text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Payment Data Verified
                        </div>
                    </div>

                    {/* Payment Bill Card */}
                    <Card className="p-8 mb-8">
                        <CardHeader>
                            <CardTitle>Payment Details</CardTitle>
                            <CardDescription>Review your payment information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Amount */}
                                <div className="flex justify-between items-center p-4 bg-surface rounded-lg">
                                    <span className="text-text-secondary">Amount</span>
                                    <span className="text-3xl font-bold text-primary">
                                        ₹{paymentData?.amount}
                                    </span>
                                </div>

                                {/* Collection Member Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-surface rounded-lg">
                                        <p className="text-sm text-text-secondary mb-1">
                                            Collection Member
                                        </p>
                                        <p className="font-semibold text-text-primary">
                                            {paymentData?.collectorName}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-surface rounded-lg">
                                        <p className="text-sm text-text-secondary mb-1">SFA ID</p>
                                        <p className="font-semibold text-primary">
                                            {paymentData?.collectorSfaId}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-surface rounded-lg">
                                        <p className="text-sm text-text-secondary mb-1">CMS ID</p>
                                        <p className="font-semibold text-text-primary">
                                            {paymentData?.collectorCmsId}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-surface rounded-lg">
                                        <p className="text-sm text-text-secondary mb-1">Lobby</p>
                                        <p className="font-semibold text-text-primary">
                                            {paymentData?.collectorLobby}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* QR Code Display */}
                    <Card className="p-8 mb-8">
                        <CardHeader>
                            <CardTitle>Scan QR Code to Pay</CardTitle>
                            <CardDescription>
                                Use any UPI app to scan and complete the payment
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingQr ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
                                </div>
                            ) : qrCodeUrl ? (
                                <div className="flex justify-center p-4 bg-surface rounded-lg border border-border">
                                    <img
                                        src={qrCodeUrl}
                                        alt="Payment QR Code"
                                        className="w-64 h-64 object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-12 text-text-secondary">
                                    <p>QR Code not available</p>
                                    <p className="text-sm mt-2">Please contact the collection member</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Screenshot Upload */}
                    <Card className="p-8 mb-8">
                        <CardHeader>
                            <CardTitle>Upload Payment Screenshot</CardTitle>
                            <CardDescription>
                                Upload proof of payment from your UPI app
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {!screenshotPreview ? (
                                    <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                                        <input
                                            id="screenshot-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleScreenshotChange}
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="screenshot-upload"
                                            className="cursor-pointer flex flex-col items-center"
                                        >
                                            <Upload className="h-12 w-12 text-text-muted mb-3" />
                                            <p className="text-text-primary font-medium mb-1">
                                                Click to upload screenshot
                                            </p>
                                            <p className="text-xs text-text-muted">
                                                PNG, JPG (Max 5MB)
                                            </p>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="relative border border-border rounded-lg p-4">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 bg-background hover:bg-destructive hover:text-white"
                                            onClick={handleRemoveScreenshot}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                        <div className="flex flex-col items-center">
                                            <img
                                                src={screenshotPreview}
                                                alt="Screenshot Preview"
                                                className="w-full max-w-md h-auto object-contain border border-border rounded-lg"
                                            />
                                            <p className="text-sm text-text-secondary mt-3">
                                                {screenshotFile?.name}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/payment')}
                            className="flex-1"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>

                        <Button
                            onClick={handleSubmitPayment}
                            disabled={!screenshotFile || isSubmitting}
                            className="flex-1"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent"></span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Confirm Payment
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PaymentConfirmation;