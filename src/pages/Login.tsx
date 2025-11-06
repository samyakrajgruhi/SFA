import { useState, useEffect } from "react";
import {useLobbies} from '@/hooks/useLobbies';
import { Link, useNavigate } from "react-router-dom";
import { Eye, ArrowLeft, Plus, Trash2 } from "lucide-react";
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!isLogin){
      if(!designation || !dateOfBirth || !bloodGroup || !presentStatus || !pfNumber) {
        toast({
          title: "Error",
          description: "Please fill in all nominee details",
          variant: "destructive"
        })
      }

      // Validate nominees
      const hasEmptyNominee = nominees.some(n => !n.name || !n.relationship || !n.phoneNumber || !n.sharePercentage);
      if (hasEmptyNominee) {
        toast({
          title: "Error",
          description: "Please fill in all nominee details",
          variant: "destructive",
        });
        return;
      }

      const totalShare = getTotalSharePercentage();
      if (totalShare !== 100) {
        toast({
          title: "Error",
          description: `Nominee share percentages must total 100% (currently ${totalShare}%)`,
          variant: "destructive",
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

      if (!cmsId) {
        toast({
          title: "Error",
          description: "CMS ID cannot be empty!",
          variant: "destructive",
        });
        return;
      }

      if(regPassword !== regConfirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match!",
          variant: "destructive"
        });
        return;
      }

      if(!autoGenerateSfaId && !sfaId){
        toast({
          title:"Error",
          description: "SFA ID cannot be empty",
          variant: "destructive"
        });
        return;
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
          // Manual SFA ID - check if it exists
          try {
            const existingDoc = await getDoc(doc(firestore, "users", finalSfaId));
            if (existingDoc.exists()) {
              // Delete auth account since SFA ID is taken
              await user.delete();
              toast({
                title:"Error",
                description: "This SFA ID already exists!",
                variant: "destructive"
              });
              return;
            }
          } catch (error) {
            // If check fails due to permissions, still allow creation
            // Firestore will prevent duplicates at document creation
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
          title: "Registration Failed",
          description: e.message || "Please try again with different information.",
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

          {/* Conditional Forms */}
          {isLogin ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
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

              {/* Password Field */}
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

              {/* Remember Me & Forgot Password */}
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

              {/* Submit Button */}
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
                  Full Name
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

              {/* PF Number */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="pfNumber">
                  PF Number <span className="text-red-600">*</span>
                </label>
                <Input
                  id="pfNumber"
                  type="text"
                  required
                  placeholder="Enter your PF Number"
                  className="h-11"
                  value={pfNumber}
                  onChange={e => setPfNumber(e.target.value.toUpperCase())}
                />
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

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="regEmail">
                  Email Address
                </label>
                <Input
                  id="regEmail"
                  type="email"
                  placeholder="Enter your email"
                  className="h-11"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                />
              </div>

              {/* Lobby ID Field */}
               <div>
                <label className="block text-sm font-medium mb-1" htmlFor="lobbyId">
                  Lobby ID <span className="text-red-600">*</span>
                </label>
                <Select value={lobbyId} onValueChange={setLobbyId} disabled={isLoadingLobbies}>
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

              {/* CMS ID Field */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="cmsId">
                  CMS ID
                </label>
                <Input
                  id="cmsId"
                  type="text"
                  placeholder="Enter your CMS ID"
                  className="h-11"
                  value={cmsId}
                  onChange={e => setCmsId(e.target.value.toUpperCase())}
                />
              </div>

              {/* SFA ID Field */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="cmsId">
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
                  <label
                    htmlFor="autoGenerate"
                    className="text-sm text-text-secondary cursor-pointer"
                  >
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

                {!autoGenerateSfaId && (
                  <p className="text-xs text-text-muted mt-1">
                    Enter the SFA ID that was pre-assigned to you
                  </p>
                )}

                
              </div>
              {/* Phone Number Field */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="cmsId">
                  Contact Number
                </label>
                <Input
                  id="phoneNo"
                  type="number"
                  placeholder="Enter your phone number"
                  className="h-11"
                  value={phoneNo}
                  onChange={e => setPhoneNo(e.target.value)}
                />
              </div>
              {/* SFA ID Field */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="cmsId">
                  Emergency Contact
                </label>
                <Input
                  id="emergencyNo"
                  type="number"
                  placeholder="Enter emergency phone number"
                  className="h-11"
                  value={emergencyNo}
                  onChange={e => setEmergencyNo(e.target.value)}
                />
              </div>

              {/* Nominees Section */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium">
                    Nominee Details <span className="text-red-600">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addNominee}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Nominee
                  </Button>
                </div>

                {nominees.map((nominee, index) => (
                  <div key={index} className="border border-border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Nominee {index + 1}</span>
                      {nominees.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNominee(index)}
                        >
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
                      placeholder="Phone Number"
                      required
                      type="tel"
                      value={nominee.phoneNumber}
                      onChange={(e) => updateNominee(index, 'phoneNumber', e.target.value)}
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

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="regPassword">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="regPassword"
                    type={showRegPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className="h-11 pr-10"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
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
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="regConfirmPassword"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="regConfirmPassword"
                    type={showRegConfirmPassword ? "text" : "password"}
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

              {/* Submit Button */}
              <Button type="submit" className="w-full h-11 text-base font-medium">
                Create Account
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Login;