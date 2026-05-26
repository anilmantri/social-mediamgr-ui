import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff, Instagram, CheckCircle } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import toast from "react-hot-toast";

const FREE_PERKS = [
  "10 AI-generated posts per month",
  "Caption + hashtag generation",
  "Approval workflow",
  "No credit card required",
];

export function SignupPage() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error("Fill in all fields");
    setLoading(true);
    try {
      const r = await authApi.signup({ name, email, password });
      setTokens(r.data);
      const userResp = await authApi.getMe();
      setUser(userResp.data);
      toast.success("Account created! Check your email to verify.");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Signup failed");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const r = await authApi.getGoogleUrl();
      window.location.href = r.data.auth_url;
    } catch {
      toast.error("Could not initiate Google login");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

        {/* Left: free plan callout */}
        <div className="hidden md:block space-y-6">
          <div className="w-14 h-14 rounded-2xl ig-gradient flex items-center justify-center shadow-lg">
            <Instagram className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              AI-powered Instagram<br />content, for free
            </h1>
            <p className="text-gray-500 mt-3">
              Create, approve, and schedule Instagram posts with AI — no experience needed.
            </p>
          </div>
          <div className="space-y-3">
            {FREE_PERKS.map(p => (
              <div key={p} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span className="text-gray-700 text-sm">{p}</span>
              </div>
            ))}
          </div>
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-card">
            <p className="text-xs text-gray-400 mb-1">Free forever includes</p>
            <p className="text-2xl font-bold text-gray-900">10 <span className="text-base font-normal text-gray-500">AI credits / month</span></p>
            <p className="text-xs text-gray-400 mt-1">Upgrade anytime from $19/month</p>
          </div>
        </div>

        {/* Right: signup form */}
        <div className="card p-8 space-y-5">
          <div className="md:hidden text-center">
            <div className="w-12 h-12 rounded-xl ig-gradient flex items-center justify-center mx-auto mb-3">
              <Instagram className="w-6 h-6 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Create your account</h2>

          {/* Google */}
          <button onClick={handleGoogle} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50">
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPass ? "text" : "password"} placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create free account
            </button>
          </form>

          <p className="text-center text-xs text-gray-400">
            By signing up you agree to our{" "}
            <a href="#" className="underline">Terms</a> and{" "}
            <a href="#" className="underline">Privacy Policy</a>
          </p>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-pink-600 hover:text-pink-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
