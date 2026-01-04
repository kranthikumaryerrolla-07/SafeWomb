import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        setError('Account created! Please sign in.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div style={{
        padding: "40px",
        fontFamily: "Arial",
        color: "white",
        background: "#0f172a",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        padding: "40px",
        fontFamily: "Arial",
        color: "white",
        background: "#0f172a",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          background: "#1e293b",
          padding: "40px",
          borderRadius: "8px",
          border: "1px solid #334155",
          maxWidth: "400px",
          width: "100%"
        }}>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "32px" }}>Maternal Risk AI</h1>
          <p style={{ margin: "0 0 32px 0", color: "#94a3b8", fontSize: "16px" }}>
            {isLogin ? 'Sign in to continue' : 'Create your account'}
          </p>

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#94a3b8" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "6px",
                  color: "white",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#94a3b8" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "6px",
                  color: "white",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {error && (
              <p style={{ color: error.includes('created') ? "#10b981" : "#ef4444", fontSize: "14px", marginBottom: "16px" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px 24px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                marginBottom: "16px"
              }}
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              style={{
                width: "100%",
                padding: "12px 24px",
                background: "transparent",
                color: "#94a3b8",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "40px",
      fontFamily: "Arial",
      color: "white",
      background: "#0f172a",
      minHeight: "100vh"
    }}>
      <header style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "32px" }}>Maternal Risk AI</h1>
          <p style={{ margin: "0", color: "#94a3b8", fontSize: "16px" }}>
            Monitor maternal health metrics and risk assessments
          </p>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            padding: "12px 24px",
            background: "#1e293b",
            color: "white",
            border: "1px solid #334155",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Sign Out
        </button>
      </header>

      <div style={{
        background: "#1e293b",
        padding: "16px 24px",
        borderRadius: "8px",
        border: "1px solid #334155",
        marginBottom: "40px"
      }}>
        <p style={{ margin: "0", fontSize: "14px", color: "#94a3b8" }}>
          Logged in as: <span style={{ color: "white" }}>{user.email}</span>
        </p>
      </div>

      <main style={{ marginBottom: "40px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px"
        }}>
          <div style={{
            background: "#1e293b",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #334155"
          }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#94a3b8" }}>
              BLOOD PRESSURE
            </h3>
            <p style={{ margin: "0", fontSize: "28px", fontWeight: "bold" }}>120/80</p>
            <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#10b981" }}>Normal</p>
          </div>

          <div style={{
            background: "#1e293b",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #334155"
          }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#94a3b8" }}>
              GLUCOSE LEVEL
            </h3>
            <p style={{ margin: "0", fontSize: "28px", fontWeight: "bold" }}>95 mg/dL</p>
            <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#10b981" }}>Normal</p>
          </div>

          <div style={{
            background: "#1e293b",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #334155"
          }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#94a3b8" }}>
              RISK LEVEL
            </h3>
            <p style={{ margin: "0", fontSize: "28px", fontWeight: "bold" }}>Low</p>
            <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#10b981" }}>All metrics normal</p>
          </div>
        </div>
      </main>

      <section>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <button style={{
            padding: "12px 24px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer"
          }}>
            Add Health Record
          </button>
          <button style={{
            padding: "12px 24px",
            background: "#1e293b",
            color: "white",
            border: "1px solid #334155",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer"
          }}>
            View History
          </button>
          <button style={{
            padding: "12px 24px",
            background: "#1e293b",
            color: "white",
            border: "1px solid #334155",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer"
          }}>
            Schedule Appointment
          </button>
        </div>
      </section>
    </div>
  );
}
