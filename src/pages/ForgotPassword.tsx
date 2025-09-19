import { sendPasswordResetEmail} from "firebase/auth";
import {auth} from "../firebase";
import {useNavigate} from "react-router";
import {useState} from "react";
import { Input } from "@/components/ui/input";
import {Button } from "@/components/ui/button";
import {useToast} from "@/hooks/use-toast";


const ForgotPassword = () => {
  const [resetEmail, setResetEmail] = useState("");
  const navigate = useNavigate();
  const {toast} = useToast();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: "Reset Email Sent",
        description: "Check your inbox for password reset instructions"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive"
      });
    }
  };


  return (
            <div className="fixed inset-0 bg-black/10 flex items-center justify-center p-4 z-50">
                <div className="bg-surface p-6 rounded-lg max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Reset Password</h2>
                <p className="text-text-secondary mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
                
                <form onSubmit={handlePasswordReset} className="space-y-4">
                    <Input
                    type="email"
                    placeholder="Email address"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    />
                    
                    <div className="flex gap-2">
                    <Button type="submit" className="flex-1">Send Reset Link</Button>
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                            navigate("/login");
                        }}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    </div>
                </form>
                </div>
            </div>
        )
  // ...rest of your component code (e.g., JSX)
};

export default ForgotPassword;