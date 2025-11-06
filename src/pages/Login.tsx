import { useState, useEffect } from "react";
import {useLobbies} from '@/hooks/useLobbies';
import { Link, useNavigate } from "react-router-dom";
import { Eye, ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { auth,firestore } from "@/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  setPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { setDoc,doc,getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateAndReserveSfaId} from '@/utils/generateSfaId';
import { 
  validatePhoneNumber, 
  validatePfNumber, 
  validatePassword,
  getPasswordStrength 
} from '@/utils/validators';

interface Nominee{
  name: string;
  relationship: string;
  phoneNumber: string;
  sharePercentage: number;
}

const Login = () => {
  const {toast} = useToast();
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
  const [autoGenerateSfaId, setAutoGenerateSfaId] = useState(false);
  const [designation,setDesignation] = useState("");
  const [dateOfBirth,setDateOfBirth] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [presentStatus, setPresentStatus] = useState("");
  const [pfNumber, setPfNumber] = useState("");
  const [nominees, setNominees] = useState<Nominee[]>([
    { name: "",
      relationship: "",
      phoneNumber: "",
      sharePercentage: 0,
    }
  ]);

  // ✅ ONLY 3 Validation states
  const [phoneValid, setPhoneValid] = useState(false);
  const [pfValid, setPfValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true); 
  
  // Password Reset functionality
  const [resetEmail, setResetEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try{
        const configDoc = await getDoc(doc(firestore, 'config','registration'));
        if(configDoc.exists()) {
          setIsRegistrationOpen(configDoc.data().isOpen || false);
        }
      } catch(error) {
        console.error('Error checking registration status:',error);
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

  const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
  const presentStatuses = ['Working','On Leave','Other'];

  const addNominee = () => {
    setNominees([...nominees,{
      name: "",
      relationship: "",
      phoneNumber: "",
      sharePercentage: 0
    }]);
  };

  const removeNominee = (index: number) => {
    if(nominees.length > 1) {
      setNominees(nominees.filter((_,i) => i !== index));
    }
  };

  const updateNominee = (index: number, field: keyof Nominee, value: string | number ) => {
    const updated = [...nominees];
    updated[index] = {...updated[index], [field]: value };
    setNominees(updated);
  };

  const getTotalSharePercentage = () => {
    return nominees.reduce((sum,nominee) => sum + (nominee.sharePercentage || 0), 0);
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
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.slice(0, 11);
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

  // ✅ Check if form is valid
  const isFormValid = () => {
    // Check required fields
    if (!fullName || !regEmail || !lobbyId || !cmsId || !designation || 
        !dateOfBirth || !bloodGroup || !presentStatus || !regConfirmPassword) {
      return false;
    }

    // Check SFA ID
    if (!autoGenerateSfaId && !sfaId) {
      return false;
    }

    // ✅ Check 3 validators
    if (!phoneValid || !pfValid || !passwordValid) {
      return false;
    }

    // Check emergency number
    const emergencyValidation = validatePhoneNumber(emergencyNo);
    if (!emergencyValidation.isValid) {
      return false;
    }

    // Check password match
    if (regPassword !== regConfirmPassword) {
      return false;
    }

    // Check nominees
    const hasEmptyNominee = nominees.some(n => !n.name || !n.relationship || !n.phoneNumber || !n.sharePercentage);
    if (hasEmptyNominee) {
      return false;
    }

    // Check nominee phone numbers
    for (const nominee of nominees) {
      if (!validatePhoneNumber(nominee.phoneNumber).isValid) {
        return false;
      }
    }

    // Check total share
    if (getTotalSharePercentage() !== 100) {
      return false;
    }

    return true;
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if(!isLogin){
      // ✅ Final validation check
      if (!isFormValid()) {
        toast({
          title: "Form Incomplete",
          description: "Please fill all required fields correctly",
          variant: "destructive"
        });
        return;
      }

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

        let finalSfaId = sfaId;

        if(autoGenerateSfaId) {
          try {
            console.log('Current user:',auth.currentUser);
            finalSfaId = await generateAndReserveSfaId();
            setSfaId(finalSfaId);
          } catch (error){
            await user.delete();
            toast({
              title: "Error",
              description: error.message || "Failed to generate SFA ID",
              variant: "destructive",
            });
            return;
          }
        }else {
          try {
            const existingDoc = await getDoc(doc(firestore, "users", finalSfaId));
            if (existingDoc.exists()) {
              await user.delete();
              toast({
                title:"Error",
                description: "This SFA ID already exists!",
                variant: "destructive"
              });
              return;
            }
          } catch (error) {
            console.warn('Could not check SFA ID uniqueness:', error);
          }
        }
        
        const userData = {
          full_name: fullName,
          cms_id:cmsId,
          sfa_id:finalSfaId,
          lobby_id:lobbyId,
          email:regEmail,
          isAdmin: false,
          isCollectionMember: false,
          phone_number: phoneNo,
          emergency_number: emergencyNo,
          uid:user.uid,
          designation: designation,
          date_of_birth: dateOfBirth,
          blood_group: bloodGroup,
          present_status: presentStatus,
          pf_number: pfNumber,
          nominees: nominees,
          registration_date: new Date()          
        };

        await setDoc(doc(firestore,"users",finalSfaId),userData);

        clearFields();
        toast({
          title: "Success",
          description: "User registered successfully!"
        });

        console.log("User registered Successfully!!");
        setIsLogin(true);
      }
      catch(e){
        toast({
          title: "Registration Failed",
          description: e.message || "Please try again with different information.",
          variant: "destructive",
        });
        setIsLogin(true);
      }
    }else{
      try{
        if(!email){
          alert("Please Enter email.");
          return;
        }
        await setPersistence(auth, browserSessionPersistence);
        await signInWithEmailAndPassword(auth,email,password);
        console.log("Successfully logged in.");
        navigate("/");

      }catch(e){
        toast({
          title: "Login Failed",
          description: e.message || "Invalid Email or Password!",
          variant: "destructive",
        });
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
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isLogin
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
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  !isLogin
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
              >
                Sign In
              </Button>
            </form>
          ) : isRegistrationOpen ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
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

              {/* ✅ 1. PF Number - 11 digits */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="pfNumber">
                  PF Number (11 digits) <span className="text-red-600">*</span>
                </label>
                <Input
                  id="pfNumber"
                  type="tel"
                  required
                  placeholder="Enter 11-digit PF number"
                  className={`h-11 ${pfNumber && (pfValid ? 'border-success' : 'border-destructive')}`}
                  value={pfNumber}
                  onChange={e => handlePfNumberChange(e.target.value)}
                  maxLength={11}
                />
                <p className="text-xs text-text-muted mt-1 flex items-center justify-between">
                  <span>{pfNumber.length}/11 digits</span>
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
                  Lobby ID <span className="text-red-600">*</span>
                </label>
                <Select value={lobbyId} onValueChange={setLobbyId} disabled={isLoadingLobbies} required>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder={isLoadingLobbies ? "Loading lobbies..." : "Select your lobby"} />
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

              {/* CMS ID */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="cmsId">
                  CMS ID <span className="text-red-600">*</span>
                </label>
                <Input
                  id="cmsId"
                  type="text"
                  required
                  placeholder="Enter your CMS ID"
                  className="h-11"
                  value={cmsId}
                  onChange={e => setCmsId(e.target.value.toUpperCase())}
                />
              </div>

              {/* SFA ID */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="sfaId">
                  SFA ID {!autoGenerateSfaId && <span className="text-red-600">*</span>}
                </label>

                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    id="autoGenerate"
                    checked={autoGenerateSfaId}
                    onCheckedChange={(checked)=>{
                      setAutoGenerateSfaId(checked as boolean);
                      if (checked) setSfaId('');
                    }}
                  />
                  <label htmlFor="autoGenerate" className="text-sm text-text-secondary cursor-pointer">
                    Auto-generate SFA ID (for new members)
                  </label>
                </div>

                {!autoGenerateSfaId ? (
                  <Input
                    id="sfaId"
                    type="text"
                    placeholder="Enter your SFA ID"
                    className="h-11"
                    value={sfaId}
                    onChange={e => setSfaId(e.target.value.toUpperCase())}
                  />
                ) : (
                  <div className="h-11 px-3 py-2 bg-surface border border-border rounded-md flex items-center">
                    <span className="text-text-muted text-sm">
                      SFA ID will be auto-generated upon registration
                    </span>
                  </div>
                )}
              </div>

              {/* ✅ 2. Phone Number - 10 digits */}
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
                    <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(regPassword) ? 'text-success' : 'text-text-muted'}>
                      {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(regPassword) ? '✓' : '○'} One special character
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
                disabled={!isFormValid()}
              >
                {isFormValid() ? 'Create Account' : 'Complete All Fields to Register'}
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
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Login;