import {useState, useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useAuth} from '@/contexts/AuthContext';
import {firestore,storage} from '@/firebase';
import {collection, addDoc, query, where, getDocs, getDoc, doc, setDoc} from 'firebase/firestore';
import {ref, uploadBytes, getDownloadURL} from 'firebase/storage';
import {useToast} from '@/hooks/use-toast';
import { Upload, X, CheckCircle, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';


const PaymentConfirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const paymentData = location.state;

    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [isLoadingQr, setIsLoadingQr] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);


    useEffect(() => {
        const fetchQrCode = async () => {
            if (!paymentData) {
                navigate('/payment');
                return;
            }
            try {
                setIsLoadingQr(true);
                const userRef = collection(firestore, 'users');
                const q = query(userRef, where('sfa_id','==',paymentData.collectorSfaId));
                const querySnapshot = await getDocs(q);

                if(!querySnapshot.empty){
                    const userData = querySnapshot.docs[0].data();
                    setQrCodeUrl(userData.qrCodeUrl || null);
                }
            } catch(error) {
                console.error("Error Fetching QR Code",error);
                toast({
                    title: "Error",
                    description: "Couldn't Fetch QR Code",
                    variant: 'destructive'
                })
            } finally {
                setIsLoadingQr(false);
            };
        }

        fetchQrCode();
    }, [paymentData, navigate, toast]);

    const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) {
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

        if(file.size > 5 * 1024 * 1024){
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
    }

    const handleSubmitPayment = async () => {
        if(!screenshotFile){
            toast({
                title:"Error",
                description: "Please upload payment screenshot", 
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);

        try{
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const timestamp = Date.now();
            
            const fileExtension = screenshotFile.name.split('.').pop();

            // Upload screenshot to Firebase Storage
            const storageRef = ref(
                storage,
                `payment_screenshots/${year}/${month}/${user?.sfaId}_${timestamp}.${fileExtension}`
            );
            await uploadBytes(storageRef, screenshotFile);
            const screenshotUrl = await getDownloadURL(storageRef);

            // ✅ Format date to match old format
            const day = String(currentDate.getDate()).padStart(2, '0');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = monthNames[currentDate.getMonth()];
            const formattedDateString = `${day}-${monthName}-${year}`;
            const monthNum = currentDate.getMonth(); // ✅ 0-indexed (Jan=0, Dec=11)

            // Getting variables for document Id for transaction collection
            const monthForId = String(currentDate.getMonth() + 1).padStart(2,'0');
            const yearForId = String(currentDate.getFullYear());
            const docId = `${user?.sfaId}_${day}${monthForId}${yearForId}`;

            const transactionsRef = doc(collection(firestore,'transactions'),docId);


            // Create transaction document
            await setDoc(transactionsRef, {
                // User info
                sfaId: user?.sfaId,
                userId: user?.uid,
                userName: user?.name,

                // Payment info
                amount: paymentData.amount.toString(),
                receiver: paymentData.collectorName,
                receiverId: paymentData.collectorId,
                receiverSfaId: paymentData.collectorSfaId,
                receiverCmsId: paymentData.collectorCmsId,
                lobby: paymentData.collectorLobby,

                // Screenshot
                screenshotUrl: screenshotUrl,

                // Metadata
                mode: 'UPI',
                date: currentDate,
                dateString: formattedDateString,
                month: monthNum, // ✅ Use monthNum (number) instead of month (string)
                year: year,
                status: 'pending',
                createdAt: new Date(),
                remarks: 'Payment via app'
            });

            toast({
                title: "Success",
                description: "Payment submitted successfully!"
            });

            navigate('/payment', {replace: true});
            
        } catch(error){
            console.error('Error submitting payment:', error);
            toast({
                title:"Error",
                description: "Failed to submit payment",
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    }


    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            
            <main className="pt-20">
            <div className="max-w-3xl mx-auto px-6 py-12">
                
                {/* Header */}
                <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-text-primary mb-4">
                    Complete Payment
                </h1>
                <p className="text-lg text-text-secondary">
                    Review details and upload payment proof
                </p>
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
                    Use any UPI app to scan and complete payment
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingQr ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                    ) : qrCodeUrl ? (
                    <div className="flex justify-center p-6 bg-surface rounded-lg">
                        <img 
                        src={qrCodeUrl} 
                        alt="Payment QR Code" 
                        className="w-80 h-80 object-contain border border-border rounded-lg"
                        />
                    </div>
                    ) : (
                    <div className="text-center py-12 text-text-secondary">
                        QR Code not available
                    </div>
                    )}
                </CardContent>
                </Card>

                {/* Upload Screenshot Section */}
                <Card className="p-8 mb-8">
                <CardHeader>
                    <CardTitle>Upload Payment Screenshot</CardTitle>
                    <CardDescription>
                    Upload proof of payment for verification
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                    {!screenshotPreview ? (
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-surface transition-colors">
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
                        Payment Completed
                    </>
                    )}
                </Button>
                </div>
            </div>
            </main>
        </div>
    );
}

export default PaymentConfirmation;