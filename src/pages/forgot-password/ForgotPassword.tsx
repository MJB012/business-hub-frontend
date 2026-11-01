import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Mail, Lock, ShieldCheck, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import BaseInput from '../../components/base-input/BaseInput';
import { ForgotPasswordEntity } from '../../components/entities/forgot_password.entity';
import { authService } from '../../services/auth.service';
import { RouteNames } from '../../routes/RouteNames';

type ForgotPasswordStep = 'email' | 'code' | 'password' | 'success';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Auto-redirect to login after 3 seconds on success
  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        navigate(RouteNames.LOGIN);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, navigate]);

  // Step 1: Submit Email to get verification code
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    try {
      await ForgotPasswordEntity.emailSchema().validate({ email });
    } catch (err: any) {
      setError(err.errors?.[0] || 'Invalid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPassword(email.trim());
      setInfoMessage(res.message || 'Verification code sent to your registered email');
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'No account found with this email address');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit Verification Code
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    try {
      await ForgotPasswordEntity.codeSchema().validate({ code });
    } catch (err: any) {
      setError(err.errors?.[0] || 'Please enter a valid verification code');
      return;
    }

    setLoading(true);
    try {
      await authService.verifyResetCode(email.trim(), code.trim());
      setStep('password');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Submit New Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    try {
      await ForgotPasswordEntity.resetPasswordSchema().validate({
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
    } catch (err: any) {
      setError(err.errors?.[0] || 'Password validation failed');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email.trim(), code.trim(), newPassword);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.forgotPassword(email.trim());
      setInfoMessage(res.message || 'A new verification code has been sent');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#edf2fb] p-4 sm:p-6 py-10">
      <div className="max-w-[420px] w-full mx-auto space-y-6 bg-white p-7 sm:p-9 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100">
        {/* Store Logo Icon and Header */}
        <div className="text-center">
          <div className="mx-auto h-14 w-14 bg-[#0a0d14] rounded-full flex items-center justify-center text-white shadow-xs">
            <Store className="h-7 w-7 text-white" strokeWidth={2} />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-gray-900 tracking-tight">
            Business Management Hub
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {step === 'email' && 'Enter your registered email to reset password'}
            {step === 'code' && 'Enter the verification code sent to your email'}
            {step === 'password' && 'Create a new password for your account'}
            {step === 'success' && 'Your password has been reset successfully'}
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium text-center">
            {error}
          </div>
        )}

        {/* Global Info / Toast Banner */}
        {infoMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium text-center">
            {infoMessage}
          </div>
        )}

        {/* STEP 1: Email Form */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4 pt-1">
            <BaseInput
              name="email"
              label="Registered Email"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              icon={<Mail className="h-4 w-4" />}
              className="!bg-[#f0f3f8] !border-transparent focus:!border-black focus:!bg-white"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#0a0d14] hover:bg-gray-800 disabled:opacity-60 text-white font-medium text-sm rounded-xl transition cursor-pointer shadow-xs mt-2"
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>

            <button
              type="button"
              onClick={() => navigate(RouteNames.LOGIN)}
              className="w-full inline-flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition pt-2 cursor-pointer font-medium"
            >
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </button>
          </form>
        )}

        {/* STEP 2: Verification Code Form */}
        {step === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-4 pt-1">
            <div className="text-center text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              Code sent to: <span className="font-semibold text-gray-900">{email}</span>
            </div>

            <BaseInput
              name="code"
              label="Verification Code"
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
              icon={<ShieldCheck className="h-4 w-4" />}
              className="!bg-[#f0f3f8] !border-transparent focus:!border-black focus:!bg-white text-center font-mono tracking-widest text-lg"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#0a0d14] hover:bg-gray-800 disabled:opacity-60 text-white font-medium text-sm rounded-xl transition cursor-pointer shadow-xs mt-2"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 px-1">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="hover:text-gray-900 inline-flex items-center gap-1 cursor-pointer font-medium"
              >
                <RefreshCw size={12} />
                <span>Resend code</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep('email');
                }}
                className="hover:text-gray-900 cursor-pointer font-medium"
              >
                Change email
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: New Password Form */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-1">
            <BaseInput
              name="new_password"
              label="New Password"
              type="password"
              placeholder="Enter new password (min. 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoFocus
              icon={<Lock className="h-4 w-4" />}
              className="!bg-[#f0f3f8] !border-transparent focus:!border-black focus:!bg-white"
            />

            <BaseInput
              name="confirm_password"
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              icon={<Lock className="h-4 w-4" />}
              className="!bg-[#f0f3f8] !border-transparent focus:!border-black focus:!bg-white"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#0a0d14] hover:bg-gray-800 disabled:opacity-60 text-white font-medium text-sm rounded-xl transition cursor-pointer shadow-xs mt-2"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* STEP 4: Success Message */}
        {step === 'success' && (
          <div className="text-center space-y-5 py-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Password Reset Successfully!
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Your password has been updated. You will be redirected to the sign in page shortly.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(RouteNames.LOGIN)}
              className="w-full py-3.5 px-4 bg-[#0a0d14] hover:bg-gray-800 text-white font-medium text-sm rounded-xl transition cursor-pointer shadow-xs"
            >
              Go to Sign In Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
