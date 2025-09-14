import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic placeholder
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
          {/* Login/Register Buttons */}
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
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  !isLogin
                    ? "bg-primary text-white shadow"
                    : "text-text-secondary hover:bg-primary/10"
                }`}
              >
                Register
              </button>
            </div>
          </div>

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
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="fullName">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  className="h-11"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
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
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium"
              >
                Create Account
              </Button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-text-secondary text-sm">
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Sign In
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-text-secondary">
            Protected by enterprise-grade security. Your data is safe with us.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;