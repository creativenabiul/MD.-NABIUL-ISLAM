import { Link, Navigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, ArrowLeft, LogOut, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AdminLoginPage() {
  const { user, isAdmin, loading, authError, cooldownSeconds, signInWithGoogle, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070708] text-[#F5F2EB] flex items-center justify-center text-sm">
        Checking verified administrator session...
      </div>
    );
  }

  if (user && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#070708] text-[#F5F2EB] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#111114] border border-white/10 space-y-6">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475]">
            Protected Workspace
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-[#F5F2EB]">
            Administrator Sign In
          </h1>
          <p className="mt-2 text-sm text-[#8C8A84] leading-relaxed">
            Private access for Md. Nabiul Islam. Sign in with your verified administrator Google account (with Google 2FA protection enabled on your Google account).
          </p>
        </div>

        {user && !isAdmin ? (
          <div className="p-4 rounded-xl bg-rose-950/35 border border-rose-500/30 space-y-3">
            <div className="flex items-start gap-2.5 text-sm text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Access Denied</p>
                <p className="text-xs text-rose-200/80 mt-1">
                  The signed-in account ({user.email}) is not an authorized administrator. Public registration is disabled.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-[#F5F2EB]"
            >
              <LogOut className="w-4 h-4" />
              Sign Out &amp; Switch Account
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={cooldownSeconds > 0}
            onClick={signInWithGoogle}
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-lg bg-[#D4B475] hover:bg-[#E8D2A0] text-[#070708] text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {cooldownSeconds > 0 ? (
              <>
                <Clock className="w-4 h-4" />
                <span>Cooldown Active ({cooldownSeconds}s)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Continue with Google</span>
              </>
            )}
          </button>
        )}

        {authError && (
          <p role="alert" className="text-xs text-rose-400">
            {authError}
          </p>
        )}

        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-[#8C8A84] hover:text-[#D4B475] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Public Portfolio
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C8A84]">
            Rate-Limited
          </span>
        </div>
      </div>
    </div>
  );
}
