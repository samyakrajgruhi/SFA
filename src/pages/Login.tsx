import { useState, useEffect } from "react";
import { useLobbies } from '@/hooks/useLobbies';
import { Link, useNavigate } from "react-router-dom";
import { User, UserPlus, Eye, ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { auth, firestore } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserSessionPersistence
} from "firebase/auth";

import { setDoc, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateAndReserveSfaId } from '@/utils/generateSfaId';
import {
  validatePhoneNumber,
  validatePfNumber,
  validatePassword,
  getPasswordStrength
} from '@/utils/validators';

interface Nominee {
  name: string;
  relationship: string;
  phoneNumber: string;
  sharePercentage: number;
}

const Login = () => {
  const { toast } = useToast();
  const { lobbies, isLoading: isLoadingLobbies } = useLobbies();

  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [lobbyId, setLobbyId] = useState("");
  const [cmsId, setCmsId] = useState("");
  const [sfaId, setSfaId] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [emergencyNo, setEmergencyNo] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  // const [autoGenerateSfaId, setAutoGenerateSfaId] = useState(false);
  const [designation, setDesignation] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [presentStatus, setPresentStatus] = useState("");
  const [pfNumber, setPfNumber] = useState("");
  const [nominees, setNominees] = useState<Nominee[]>([
    {
      name: "",
      relationship: "",
      phoneNumber: "",
      sharePercentage: 0,
    }
  ]);

  // States for Registration Options : New Member, Old Member
  const [registrationStep, setRegistrationStep] = useState<'select' | 'form'>('select');
  const [memberType, setMemberType] = useState<'new' | 'old' | null>(null);


  // 3 Validation states
  const [phoneValid, setPhoneValid] = useState(false);
  const [pfValid, setPfValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password Reset functionality
  const [resetEmail, setResetEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);

  const [sfaIdValid, setSfaIdValid] = useState(false);
  const [cmsIdValid, setCmsIdValid] = useState(false);

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const configDoc = await getDoc(doc(firestore, 'config', 'registration'));
        if (configDoc.exists()) {
          setIsRegistrationOpen(configDoc.data().isOpen || false);
        }
      } catch (error) {
        console.error('Error checking registration status:', error);
      } finally {
        setIsCheckingRegistration(false);
      }
    };

    checkRegistrationStatus();
  }, []);

  const designations = [
    'Senior ALP',
    'ALP',
    'LPG',
    'LPP',
    'LPM',
    'LPS/ET',
    'CLI'
  ];

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const presentStatuses = ['Working', 'On Leave', 'Other'];

  const addNominee = () => {
    setNominees([...nominees, {
      name: "",
      relationship: "",
      phoneNumber: "",
      sharePercentage: 0
    }]);
  };

  const removeNominee = (index: number) => {
    if (nominees.length > 1) {
      setNominees(nominees.filter((_, i) => i !== index));
    }
  };

  const updateNominee = (index: number, field: keyof Nominee, value: string | number) => {
    const updated = [...nominees];
    updated[index] = { ...updated[index], [field]: value };
    setNominees(updated);
  };

  const getTotalSharePercentage = () => {
    return nominees.reduce((sum, nominee) => sum + (nominee.sharePercentage || 0), 0);
  };

  // ✅ 1. Phone Number Validation
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.slice(0, 10);
    setPhoneNo(limited);

    const validation = validatePhoneNumber(limited);
    setPhoneValid(validation.isValid);
  };

  // ✅ Emergency Number (same validation)
  const handleEmergencyPhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.slice(0, 10);
    setEmergencyNo(limited);
  };

  // ✅ 2. PF Number Validation
  const handlePfNumberChange = (value: string) => {
    // Remove spaces but keep original case, allow alphanumeric (both cases)
    const cleaned = value.replace(/\s/g, '');
    // Only allow alphanumeric characters (A-Z, a-z, 0-9)
    const alphanumeric = cleaned.replace(/[^A-Za-z0-9]/g, '');
    const limited = alphanumeric.slice(0, 11);
    setPfNumber(limited);

    const validation = validatePfNumber(limited);
    setPfValid(validation.isValid);
  };

  // ✅ 3. Password Validation
  const handlePasswordChange = (value: string) => {
    setRegPassword(value);

    const validation = validatePassword(value);
    setPasswordValid(validation.isValid);

    const strength = getPasswordStrength(value);
    setPasswordStrength(strength.strength);
  };

  const validateSfaIdFormat = (sfaId: string): { isValid: boolean; error?: string } => {
    // Check if empty
    if (!sfaId || sfaId.trim() === '') {
      return { isValid: false, error: 'SFA ID is required' };
    }

    // Remove spaces for validation
    const cleanedSfaId = sfaId.replace(/\s/g, '').toUpperCase();

    // Check if it starts with SFA (case-insensitive)
    if (!cleanedSfaId.startsWith('SFA')) {
      return { isValid: false, error: 'SFA ID must start with "SFA"' };
    }

    // Extract the number part after "SFA"
    const numberPart = cleanedSfaId.substring(3);

    // Check if there's a number part
    if (numberPart.length === 0) {
      return { isValid: false, error: 'SFA ID must include a number (e.g., SFA1001)' };
    }

    // Check if number part contains only digits
    if (!/^\d+$/.test(numberPart)) {
      return { isValid: false, error: 'SFA ID must be in format: SFA followed by numbers only (e.g., SFA1001)' };
    }

    // Check minimum length (SFA + at least 1 digit = minimum 4 characters)
    if (cleanedSfaId.length < 3) {
      return { isValid: false, error: 'SFA ID must be at least 4 characters (e.g., SFA1 or SFA1001)' };
    }

    return { isValid: true };
  };

  const validateCmsIdFormat = (cmsId: string, lobbyId: string): { isValid: boolean; error?: string } => {
    if (!lobbyId) {
      return { isValid: false, error: 'Please select a lobby first' };
    }

    // Check for spaces
    if (/\s/.test(cmsId)) {
      return { isValid: false, error: 'CMS ID cannot contain spaces' };
    }

    // Check if CMS ID starts with the lobby prefix
    if (!cmsId.startsWith(lobbyId)) {
      return { isValid: false, error: `CMS ID must start with "${lobbyId}"` };
    }

    // Check if there are digits after the lobby prefix
    const numberPart = cmsId.substring(lobbyId.length);
    if (numberPart.length === 0) {
      return { isValid: false, error: 'CMS ID must include a number after lobby code' };
    }

    if (!/^\d+$/.test(numberPart)) {
      return { isValid: false, error: 'CMS ID must end with numbers only' };
    }

    if (cmsId.length < lobbyId.length + 3) {
      return { isValid: false, error: `CMS ID must be at least ${lobbyId.length + 3} characters (e.g., ${lobbyId}1234)` };
    }

    return { isValid: true };
  };

  // ✅ Check if form is valid
  const isFormValid = () => {
    // Check required fields (SFA ID not required for new members)
    if (!fullName || !regEmail || !lobbyId || !cmsId || !designation ||
      !dateOfBirth || !bloodGroup || !presentStatus || !regConfirmPassword) {
      return false;
    }

    // ✅ Check CMS ID format with lobby
    if (!cmsIdValid || !validateCmsIdFormat(cmsId, lobbyId).isValid) {
      return false;
    }

    // Check SFA ID only for old members
    if (memberType === 'old') {
      if (!sfaId) {
        return false;
      }
      // ✅ Check SFA ID format for old members
      if (!sfaIdValid) {
        return false;
      }
    }

    // Check 3 validators
    if (!phoneValid || !pfValid || !passwordValid) {
      return false;
    }

    // Check emergency number
    const emergencyValidation = validatePhoneNumber(emergencyNo);
    if (!emergencyValidation.isValid) {
      return false;
    }

    // Password match check
    if (regPassword !== regConfirmPassword) {
      return false;
    }

    // Nominee validation
    const nomineeValid = nominees.every(nominee =>
      nominee.name.trim() !== '' &&
      nominee.relationship.trim() !== '' &&
      nominee.phoneNumber.trim() !== '' &&
      nominee.sharePercentage > 0
    );

    if (!nomineeValid) {
      return false;
    }

    return true;
  };

  const handleLobbyChange = (value: string) => {
    const oldLobby = lobbyId;
    setLobbyId(value);

    // If CMS ID was already entered, update it with new lobby prefix
    if (cmsId && oldLobby) {
      const numberPart = cmsId.substring(oldLobby.length);
      const newCmsId = value + numberPart;
      setCmsId(newCmsId);

      const validation = validateCmsIdFormat(newCmsId, value);
      setCmsIdValid(validation.isValid);
    }
  };

  // Update handleSfaIdChange function (around line 283)

  const handleSfaIdChange = (value: string) => {
    // Remove all spaces and convert to uppercase
    const cleanedValue = value.replace(/\s/g, '').toUpperCase();
    setSfaId(cleanedValue);

    // Always validate when user types
    const validation = validateSfaIdFormat(cleanedValue);
    setSfaIdValid(validation.isValid);

    // Show validation error in console for debugging
    if (!validation.isValid && cleanedValue.length > 0) {
      console.log('SFA ID Validation:', validation.error);
    }
  };

  const handleCmsIdChange = (value: string) => {
    // If lobby is not selected, show error
    if (!lobbyId) {
      toast({
        title: 'Select Lobby First',
        description: 'Please select your lobby before entering CMS ID',
        variant: 'destructive'
      });
      return;
    }

    // Remove all spaces and convert to uppercase
    let processedValue = value.replace(/\s/g, '').toUpperCase();

    // If user tries to type the lobby prefix, remove it (we'll add it automatically)
    if (processedValue.startsWith(lobbyId)) {
      processedValue = processedValue.substring(lobbyId.length);
    }

    // Only allow numbers
    const numbersOnly = processedValue.replace(/\D/g, '');

    // Construct full CMS ID with lobby prefix
    const fullCmsId = lobbyId + numbersOnly;
    setCmsId(fullCmsId);

    const validation = validateCmsIdFormat(fullCmsId, lobbyId);
    setCmsIdValid(validation.isValid);
  };

  function clearFields() {
    setFullName("");
    setRegEmail("");
    setLobbyId("");
    setCmsId("");
    setSfaId("");
    setPhoneNo("");
    setEmergencyNo("");
    setRegPassword("");
    setRegConfirmPassword("");
    setShowRegPassword(false);
    setShowRegConfirmPassword(false);
    setDesignation("");
    setDateOfBirth("");
    setBloodGroup("");
    setPresentStatus("");
    setPfNumber("");
    setNominees([{ name: "", relationship: "", phoneNumber: "", sharePercentage: 0 }]);
    setPhoneValid(false);
    setPfValid(false);
    setPasswordValid(false);
    setSfaIdValid(false);
    setCmsIdValid(false);
    // Reset registration flow
    setRegistrationStep('select');
    setMemberType(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }

    if (!isLogin) {
      // ✅ Final validation check
      if (!isFormValid()) {
        toast({
          title: "Form Incomplete",
          description: "Please fill all required fields correctly",
          variant: "destructive"
        });
        return;
      }

      // ✅ Additional format validation for SFA ID (only for old members)
      if (memberType === 'old') {
        const sfaValidation = validateSfaIdFormat(sfaId);
        if (!sfaValidation.isValid) {
          toast({
            title: "Invalid SFA ID",
            description: sfaValidation.error,
            variant: "destructive"
          });
          return;
        }
      }

      const cmsValidation = validateCmsIdFormat(cmsId, lobbyId);
      if (!cmsValidation.isValid) {
        toast({
          title: "Invalid CMS ID",
          description: cmsValidation.error,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(true);

      // Check if PF Number already exists
      try {
        const pfDoc = await getDoc(doc(firestore, 'users', pfNumber));
        if (pfDoc.exists()) {
          toast({
            title: "Error",
            description: "This PF Number is already registered!",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error('Error checking PF Number:', error);
      }

      try {
        const userCredentials = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
        const user = userCredentials.user;

        // Generate or use existing SFA ID based on member type
        let finalSfaId: string;
        
        if (memberType === 'new') {
          // Auto-generate SFA ID for new members
          try {
            finalSfaId = await generateAndReserveSfaId();
            toast({
              title: "SFA ID Generated",
              description: `Your SFA ID is: ${finalSfaId}`,
              duration: 5000
            });
          } catch (error) {
            await user.delete();
            toast({
              title: "Error",
              description: "Failed to generate SFA ID. Please try again.",
              variant: "destructive"
            });
            setIsSubmitting(false);
            return;
          }
        } else {
          // Use manually entered SFA ID for old members
          finalSfaId = sfaId;
          
          // Check if SFA ID already exists
          try {
            const existingDoc = await getDoc(doc(firestore, "users", finalSfaId));
            if (existingDoc.exists()) {
              await user.delete();
              toast({
                title: "Error",
                description: "This SFA ID already exists!",
                variant: "destructive"
              });
              setIsSubmitting(false);
              return;
            }
          } catch (error) {
            console.warn('Could not check SFA ID uniqueness:', error);
          }
        }


        const userData = {
          full_name: fullName,
          cms_id: cmsId,
          sfa_id: finalSfaId,
          lobby_id: lobbyId,
          email: regEmail,
          isAdmin: false,
          isCollectionMember: false,
          phone_number: phoneNo,
          emergency_number: emergencyNo,
          uid: user.uid,
          designation: designation,
          date_of_birth: dateOfBirth,
          blood_group: bloodGroup,
          present_status: presentStatus,
          pf_number: pfNumber,
          nominees: nominees,
          registration_date: new Date()
        };

        await setDoc(doc(firestore, "users", finalSfaId), userData);

        await setDoc(doc(firestore, "users_by_uid", user.uid), {
          uid: user.uid,
          sfa_id: finalSfaId,
          email: regEmail,
          full_name: fullName,
          isAdmin: false,
          isFounder: false,
          isCollectionMember: false,
          createdAt: new Date()
        });

        clearFields();
        toast({
          title: "Success",
          description: "User registered successfully!"
        });

        console.log("User registered Successfully!!");
        setIsLogin(true);
      }
      catch (e) {
        toast({
          title: "Registration Failed",
          description: e.message || "Please try again with different information.",
          variant: "destructive",
        });
        setIsLogin(true);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Login flow
      setIsSubmitting(true);
      try {
        if (!email) {
          alert("Please Enter email.");
          setIsSubmitting(false);
          return;
        }

        await setPersistence(auth, browserSessionPersistence);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // ✅ Check if user is disabled
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('uid', '==', userCredential.user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();

          if (userData.isDisabled) {
            // Sign out immediately
            await auth.signOut();
            toast({
              title: "Account Disabled",
              description: "Your account has been disabled. Please contact an administrator.",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
        }

        console.log("Successfully logged in.");
        navigate("/");
      } catch (e) {
        toast({
          title: "Login Failed",
          description: e.message || "Invalid Email or Password!",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back to Home Link */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Auth Card */}
        <div className="bg-surface border border-border rounded-xl p-8 shadow-lg">
          {/* Login/Register Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2 p-1 bg-surface-hover rounded-lg">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isLogin
                  ? "bg-primary text-white shadow"
                  : "text-text-secondary hover:bg-primary/10"
                  }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                disabled={!isRegistrationOpen}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${!isLogin
                  ? "bg-primary text-white shadow"
                  : "text-text-secondary hover:bg-primary/10"
                  } ${!isRegistrationOpen ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Register
              </button>
            </div>
          </div>

          {/* Registration Closed Message */}
          {!isLogin && !isRegistrationOpen && (
            <div className="mb-6 p-4 bg-warning-light border border-warning rounded-lg">
              <p className="text-warning font-semibold text-center">
                Registration is currently closed. Please try again later.
              </p>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <img
                src="/SFA-updateLogo.png"
                alt="SFA Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-text-secondary">
              {isLogin ? "Sign in to your SFA account" : "Join the SFA community"}
            </p>
          </div>

          {/* Member Type Selection - Show when not login and registration is open */}
          {!isLogin && isRegistrationOpen && registrationStep === 'select' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  Choose Registration Type
                </h3>
                <p className="text-sm text-text-secondary">
                  Select the option that applies to you
                </p>
              </div>

              <div className="grid gap-4">
                {/* Old Member Card */}
                <button
                  type="button"
                  onClick={() => {
                    setMemberType('old');
                    setRegistrationStep('form');
                  }}
                  className="group p-6 bg-surface border-2 border-border hover:border-primary rounded-lg transition-all hover:shadow-lg text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-light rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-text-primary mb-1">
                        Old Member Registration
                      </h4>
                      <p className="text-sm text-text-secondary">
                        I already have an SFA ID from previous registration
                      </p>
                      <p className="text-xs text-text-muted mt-2">
                        You will need to enter your existing SFA ID
                      </p>
                    </div>
                  </div>
                </button>

                {/* New Member Card */}
                <button
                  type="button"
                  onClick={() => {
                    setMemberType('new');
                    setRegistrationStep('form');
                  }}
                  className="group p-6 bg-surface border-2 border-border hover:border-success rounded-lg transition-all hover:shadow-lg text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-success-light rounded-lg group-hover:bg-success group-hover:text-white transition-colors">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-text-primary mb-1">
                        New Member Registration
                      </h4>
                      <p className="text-sm text-text-secondary">
                        I'm registering for the first time
                      </p>
                      <p className="text-xs text-text-muted mt-2">
                        An SFA ID will be automatically generated for you
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* LOGIN FORM */}
          {isLogin ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="email">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="h-11"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-11 pr-10"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                    tabIndex={-1}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={rememberMe}
                    onCheckedChange={checked => setRememberMe(checked === true)}
                    id="rememberMe"
                  />
                  <label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent inline-block"></span>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          ) : isRegistrationOpen && registrationStep === 'form' ? (
            <>
              {/* Back Button */}
              {memberType && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setRegistrationStep('select');
                    setMemberType(null);
                    setSfaId('');
                  }}
                  className="mb-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Registration Type
                </Button>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Form Header */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    {memberType === 'old' ? 'Old Member Registration' : 'New Member Registration'}
                  </h2>
                  <p className="text-text-secondary text-sm">
                    {memberType === 'old'
                      ? 'Complete your registration with your existing SFA ID'
                      : 'We\'ll create a new SFA ID for you'
                    }
                  </p>
                </div>
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="fullName">
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <Input
                      id="fullName"
                      type="text"
                      required
                      placeholder="Enter your full name"
                      className="h-11"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                    />
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="designation">
                      Designation <span className="text-red-600">*</span>
                    </label>
                    <Select value={designation} onValueChange={setDesignation} required>
                      <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder="Select your designation" />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border border-border z-50">
                        {designations.map((des) => (
                          <SelectItem key={des} value={des} className="hover:bg-surface-hover">
                            {des}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="dateOfBirth">
                      Date of Birth <span className="text-red-600">*</span>
                    </label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      required
                      className="h-11"
                      value={dateOfBirth}
                      onChange={e => setDateOfBirth(e.target.value)}
                    />
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="bloodGroup">
                      Blood Group <span className="text-red-600">*</span>
                    </label>
                    <Select value={bloodGroup} onValueChange={setBloodGroup} required>
                      <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder="Select your blood group" />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border border-border z-50">
                        {bloodGroups.map((bg) => (
                          <SelectItem key={bg} value={bg} className="hover:bg-surface-hover">
                            {bg}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/*1. PF Number - 11 digits */}
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="pfNumber">
                      PF Number (11 characters) <span className="text-red-600">*</span>
                    </label>
                    <Input
                      id="pfNumber"
                      type="text"
                      required
                      placeholder="Enter 11-character PF number (e.g., PF12345A6789)"
                      className={`h-11 ${pfNumber && (pfValid ? 'border-success' : 'border-destructive')}`}
                      value={pfNumber}
                      onChange={e => handlePfNumberChange(e.target.value)}
                      maxLength={11}
                      style={{ textTransform: 'uppercase' }}
                    />
                    <p className="text-xs text-text-muted mt-1 flex items-center justify-between">
                      <span>{pfNumber.length}/11 characters</span>
                      {pfNumber.length === 11 && (
                        pfValid ? (
                          <span className="text-success flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Valid
                          </span>
                        ) : (
                          <span className="text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Invalid
                          </span>
                        )
                      )}
                    </p>
                    {pfNumber && pfNumber.length === 11 && !pfValid && (
                      <p className="text-xs text-destructive mt-1">
                        PF number must be exactly 11 alphanumeric characters
                      </p>
                    )}
                  </div>

                  {/* Present Status */}
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="presentStatus">
                      Present Status <span className="text-red-600">*</span>
                    </label>
                    <Select value={presentStatus} onValueChange={setPresentStatus} required>
                      <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder="Select your present status" />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border border-border z-50">
                        {presentStatuses.map((status) => (
                          <SelectItem key={status} value={status} className="hover:bg-surface-hover">
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="regEmail">
                      Email Address <span className="text-red-600">*</span>
                    </label>
                    <Input
                      id="regEmail"
                      type="email"
                      required
                      placeholder="Enter your email"
                      className="h-11"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                    />
                  </div>

                  {/* Lobby */}
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="lobbyId">
                      Lobby <span className="text-red-600">*</span>
                    </label>
                    <Select
                      value={lobbyId}
                      onValueChange={handleLobbyChange}
                      disabled={isLoadingLobbies}
                      required
                    >
                      <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder={isLoadingLobbies ? "Loading lobbies..." : "Select your lobby first"} />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border border-border z-50">
                        {lobbies.map((lobby) => (
                          <SelectItem key={lobby} value={lobby} className="hover:bg-surface-hover">
                            {lobby}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="cmsId">
                      CMS ID <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-medium">
                        {lobbyId || 'LOBBY'}
                      </div>
                      <Input
                        id="cmsId"
                        type="text"
                        required
                        placeholder={lobbyId ? "Enter number (e.g., 1234)" : "Select lobby first"}
                        className={`h-11 pl-20 ${cmsId && (cmsIdValid ? 'border-success' : 'border-destructive')}`}
                        value={cmsId.substring(lobbyId.length)}
                        onChange={e => handleCmsIdChange(e.target.value)}
                        disabled={!lobbyId}
                        maxLength={6}
                      />
                    </div>
                    {lobbyId && (
                      <p className="text-xs text-text-muted mt-1">
                        Your CMS ID will be: <span className="font-semibold text-primary">{cmsId || `${lobbyId}____`}</span>
                      </p>
                    )}
                    {!lobbyId && (
                      <p className="text-xs text-warning mt-1">
                        ⚠️ Please select your lobby first
                      </p>
                    )}
                    {cmsId && lobbyId && !cmsIdValid && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="w-3 h-3" />
                        <span>Enter at least 3 digits after {lobbyId}</span>
                      </div>
                    )}
                    {cmsId && cmsIdValid && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-success">
                        <CheckCircle className="w-3 h-3" />
                        <span>Valid CMS ID format</span>
                      </div>
                    )}
                  </div>

                  {/* SFA ID - Conditional based on member type */}
                  {memberType === 'old' ? (
                    // Old Member - Manual Entry
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="sfaId">
                        SFA ID <span className="text-red-600">*</span>
                      </label>
                      <Input
                        id="sfaId"
                        type="text"
                        required
                        placeholder="Enter your existing SFA ID (e.g., SFA1001)"
                        className={`h-11 ${sfaId && (sfaIdValid ? 'border-success' : 'border-destructive')}`}
                        value={sfaId}
                        onChange={e => handleSfaIdChange(e.target.value)}
                      />
                      <p className="text-xs text-text-muted mt-1">
                        Enter the SFA ID you received during your previous registration
                      </p>
                      {sfaId && (
                        <p className="text-xs mt-1">
                          {validateSfaIdFormat(sfaId).isValid ? (
                            <span className="text-success flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Valid format
                            </span>
                          ) : (
                            <span className="text-destructive flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Invalid format
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  ) : memberType === 'new' ? (
                    // New Member - Auto-generate message
                    <div className="p-4 bg-success-light border border-success rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-success rounded-lg">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-success mb-1">
                            SFA ID Will Be Auto-Generated
                          </h4>
                          <p className="text-sm text-text-secondary">
                            Your unique SFA ID will be automatically created after successful registration.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* 2. Phone Number - 10 digits */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="phoneNo">
                  Contact Number (10 digits) <span className="text-red-600">*</span>
                </label>
                <Input
                  id="phoneNo"
                  type="tel"
                  required
                  placeholder="Enter 10-digit phone number"
                  className={`h-11 ${phoneNo && (phoneValid ? 'border-success' : 'border-destructive')}`}
                  value={phoneNo}
                  onChange={e => handlePhoneChange(e.target.value)}
                  maxLength={10}
                />
                <p className="text-xs text-text-muted mt-1 flex items-center justify-between">
                  <span>{phoneNo.length}/10 digits</span>
                  {phoneNo.length === 10 && (
                    phoneValid ? (
                      <span className="text-success flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Valid
                      </span>
                    ) : (
                      <span className="text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Invalid
                      </span>
                    )
                  )}
                </p>
              </div>

              {/* Emergency Number */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="emergencyNo">
                  Emergency Contact (10 digits) <span className="text-red-600">*</span>
                </label>
                <Input
                  id="emergencyNo"
                  type="tel"
                  required
                  placeholder="Enter 10-digit emergency number"
                  className="h-11"
                  value={emergencyNo}
                  onChange={e => handleEmergencyPhoneChange(e.target.value)}
                  maxLength={10}
                />
                <p className="text-xs text-text-muted mt-1">
                  {emergencyNo.length}/10 digits
                </p>
              </div>

              {/* Nominees */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium">
                    Nominee Details <span className="text-red-600">*</span>
                  </label>
                  <Button type="button" variant="outline" size="sm" onClick={addNominee}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Nominee
                  </Button>
                </div>

                {nominees.map((nominee, index) => (
                  <div key={index} className="border border-border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Nominee {index + 1}</span>
                      {nominees.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeNominee(index)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>

                    <Input
                      placeholder="Name"
                      required
                      value={nominee.name}
                      onChange={(e) => updateNominee(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="Relationship"
                      required
                      value={nominee.relationship}
                      onChange={(e) => updateNominee(index, 'relationship', e.target.value)}
                    />
                    <Input
                      placeholder="Phone Number (10 digits)"
                      required
                      type="tel"
                      maxLength={10}
                      value={nominee.phoneNumber}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                        updateNominee(index, 'phoneNumber', cleaned);
                      }}
                    />
                    <Input
                      placeholder="Share Percentage (%)"
                      required
                      type="number"
                      min="0"
                      max="100"
                      value={nominee.sharePercentage || ''}
                      onChange={(e) => updateNominee(index, 'sharePercentage', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                ))}

                <div className="text-sm text-text-secondary">
                  Total Share: <span className={getTotalSharePercentage() === 100 ? 'text-success' : 'text-warning'}>
                    {getTotalSharePercentage()}%
                  </span> / 100%
                </div>
              </div>

              {/* ✅ 3. Password - 8 chars, 1 uppercase, 1 symbol */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="regPassword">
                  Password <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="regPassword"
                    type={showRegPassword ? "text" : "password"}
                    required
                    placeholder="Create a password"
                    className={`h-11 pr-10 ${regPassword && (passwordValid ? 'border-success' : 'border-destructive')}`}
                    value={regPassword}
                    onChange={e => handlePasswordChange(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                    tabIndex={-1}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {regPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      <div className={`h-1 flex-1 rounded ${passwordStrength === 'weak' ? 'bg-red-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                      <div className={`h-1 flex-1 rounded ${passwordStrength === 'medium' || passwordStrength === 'strong' ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                      <div className={`h-1 flex-1 rounded ${passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                    <p className={`text-xs ${passwordStrength === 'weak' ? 'text-red-500' : passwordStrength === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                      Strength: {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                    </p>
                  </div>
                )}

                <div className="mt-2 space-y-1">
                  <p className="text-xs text-text-muted">Requirements:</p>
                  <ul className="text-xs space-y-1">
                    <li className={regPassword.length >= 8 ? 'text-success' : 'text-text-muted'}>
                      {regPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(regPassword) ? 'text-success' : 'text-text-muted'}>
                      {/[A-Z]/.test(regPassword) ? '✓' : '○'} One uppercase letter
                    </li>
                    <li className={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(regPassword) ? 'text-success' : 'text-text-muted'}>
                      {/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(regPassword) ? '✓' : '○'} One special character
                    </li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="regConfirmPassword">
                  Confirm Password <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="regConfirmPassword"
                    type={showRegConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Confirm your password"
                    className="h-11 pr-10"
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                    tabIndex={-1}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ✅ Submit Button - DISABLED until form is valid */}
              <Button
                type="submit"
                className="w-full h-11 text-base font-medium"
                disabled={!isFormValid() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent inline-block"></span>
                    Creating Account...
                  </>
                ) : (
                  isFormValid() ? 'Create Account' : 'Complete All Fields to Register'
                )}
              </Button>

              {/* Validation Summary */}
              {!isFormValid() && (phoneNo || pfNumber || regPassword) && (
                <div className="p-3 bg-warning-light rounded-lg border border-warning">
                  <p className="text-xs font-semibold text-warning mb-1">Required validations:</p>
                  <ul className="text-xs space-y-1">
                    {!phoneValid && phoneNo && (
                      <li className="text-warning">• Phone: Must be exactly 10 digits</li>
                    )}
                    {!pfValid && pfNumber && (
                      <li className="text-warning">• PF Number: Must be exactly 11 digits</li>
                    )}
                    {!passwordValid && regPassword && (
                      <li className="text-warning">• Password: Must meet all requirements</li>
                    )}
                  </ul>
                </div>
              )}
            </form>
          </>
        ) : null}
        </div>
      </div>
    </div>
  );
};

export default Login;