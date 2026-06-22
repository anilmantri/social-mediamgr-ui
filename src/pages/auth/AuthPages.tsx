import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Loader2, CheckCircle, Instagram } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import toast from "react-hot-toast";

// ── OAuth Callback ─────────────────────────────────────────────────────────────
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setTokens, setUser } = useAuthStore();

  useEffect(() => {
    const accessToken  = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const redirect     = params.get("redirect") || "/";
    const error        = params.get("error");

    if (error) { toast.error("Google login failed"); navigate("/login"); return; }
    if (!accessToken || !refreshToken) { navigate("/login"); return; }

    setTokens({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
      expires_in: 3600,
    });

    authApi.getMe().then(r => {
      setUser(r.data);
      toast.success(`Welcome, ${r.data.name}!`);
      navigate(redirect);
    }).catch(() => { toast.error("Failed to load profile"); navigate("/login"); });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto" />
        <p className="text-gray-600">Signing you in…</p>
      </div>
    </div>
  );
}

// ── Forgot Password ────────────────────────────────────────────────────────────
export function ForgotPasswordPage() {
  const [email, setEmail]   = useState("");
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch { toast.error("Something went wrong"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-sm space-y-5">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl ig-gradient flex items-center justify-center mx-auto mb-4">
            <Instagram className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Reset your password</h1>
          <p className="text-sm text-gray-500 mt-1">We'll send you a reset link</p>
        </div>

        {sent ? (
          <div className="text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-gray-700 font-medium">Check your inbox</p>
            <p className="text-sm text-gray-500">If that email exists, a reset link is on its way.</p>
            <Link to="/login" className="btn-secondary w-full block text-center">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Send reset link
            </button>
            <Link to="/login" className="block text-center text-sm text-gray-500 hover:text-gray-700">← Back to login</Link>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Reset Password ─────────────────────────────────────────────────────────────
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token    = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords don't match");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) { toast.error(err?.response?.data?.detail || "Reset failed"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-sm space-y-5">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Set new password</h1>
          <p className="text-sm text-gray-500 mt-1">Choose a strong password</p>
        </div>
        {done ? (
          <div className="text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-gray-700 font-medium">Password updated!</p>
            <p className="text-sm text-gray-500">Redirecting to login…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">New password</label>
              <input className="input" type="password" placeholder="Min 8 chars" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input className="input" type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Update password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Verify Email ──────────────────────────────────────────────────────────────
export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<"loading"|"success"|"error">("loading");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    import("@/lib/api").then(({ authApi }) =>
      authApi.verifyEmail(token)
        .then(() => { setStatus("success"); setTimeout(() => navigate("/"), 3000); })
        .catch(() => setStatus("error"))
    );
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-sm text-center space-y-4">
        {status === "loading" && <><Loader2 className="w-10 h-10 animate-spin text-violet-500 mx-auto" /><p className="text-gray-600">Verifying your email…</p></>}
        {status === "success" && <><CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" /><h2 className="text-lg font-semibold text-gray-900">Email verified!</h2><p className="text-sm text-gray-500">Redirecting to dashboard…</p></>}
        {status === "error"   && <><div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto"><span className="text-rose-500 text-xl">✕</span></div><h2 className="text-lg font-semibold text-gray-900">Verification failed</h2><p className="text-sm text-gray-500">Link is invalid or expired.</p><button onClick={() => navigate("/")} className="btn-primary w-full">Go to dashboard</button></>}
      </div>
    </div>
  );
}

// ── Billing Success ───────────────────────────────────────────────────────────
export function BillingSuccessPage() {
  const navigate = useNavigate();
  useEffect(() => { setTimeout(() => navigate("/billing"), 4000); }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-sm text-center space-y-4">
        <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Payment successful! 🎉</h2>
        <p className="text-sm text-gray-500">Your plan has been upgraded. Credits are on their way.</p>
        <p className="text-xs text-gray-400">Redirecting to billing page…</p>
      </div>
    </div>
  );
}
