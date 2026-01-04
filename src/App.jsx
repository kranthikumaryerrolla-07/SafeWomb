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
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#2d3748",
        background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 25%, #f9a8d4 50%, #f0abfc 75%, #e9d5ff 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          background: "rgba(255, 255, 255, 0.9)",
          padding: "24px 32px",
          borderRadius: "20px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)"
        }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        padding: "40px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#2d3748",
        background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 25%, #f9a8d4 50%, #f0abfc 75%, #e9d5ff 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          padding: "48px",
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          maxWidth: "440px",
          width: "100%",
          backdropFilter: "blur(10px)"
        }}>
          <h1 style={{
            margin: "0 0 8px 0",
            fontSize: "32px",
            fontWeight: "700",
            background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            Maternal Care
          </h1>
          <p style={{ margin: "0 0 32px 0", color: "#6b7280", fontSize: "15px" }}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "#ffffff",
                  border: "2px solid #f3e8ff",
                  borderRadius: "12px",
                  color: "#1f2937",
                  fontSize: "15px",
                  boxSizing: "border-box",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#d8b4fe"}
                onBlur={(e) => e.target.style.borderColor = "#f3e8ff"}
              />
            </div>

            <div style={{ marginBottom: "28px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "#ffffff",
                  border: "2px solid #f3e8ff",
                  borderRadius: "12px",
                  color: "#1f2937",
                  fontSize: "15px",
                  boxSizing: "border-box",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#d8b4fe"}
                onBlur={(e) => e.target.style.borderColor = "#f3e8ff"}
              />
            </div>

            {error && (
              <p style={{
                color: error.includes('created') ? "#10b981" : "#ef4444",
                fontSize: "14px",
                marginBottom: "16px",
                padding: "12px",
                background: error.includes('created') ? "#d1fae5" : "#fee2e2",
                borderRadius: "8px"
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "14px 24px",
                background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                marginBottom: "12px",
                boxShadow: "0 4px 15px rgba(236, 72, 153, 0.3)",
                transition: "transform 0.2s, box-shadow 0.2s"
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(236, 72, 153, 0.4)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 15px rgba(236, 72, 153, 0.3)";
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
                color: "#9333ea",
                border: "none",
                borderRadius: "12px",
                fontSize: "14px",
                cursor: "pointer",
                fontWeight: "500"
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
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 25%, #f9a8d4 50%, #f0abfc 75%, #e9d5ff 100%)",
      minHeight: "100vh",
      padding: "40px 20px"
    }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <header style={{
          marginBottom: "40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px"
        }}>
          <div>
            <h1 style={{
              margin: "0 0 8px 0",
              fontSize: "36px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              Overview
            </h1>
            <p style={{ margin: "0", color: "#6b7280", fontSize: "16px", fontWeight: "500" }}>
              Patient Health Dashboard
            </p>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              padding: "12px 28px",
              background: "rgba(255, 255, 255, 0.9)",
              color: "#ec4899",
              border: "none",
              borderRadius: "14px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.15)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.1)";
            }}
          >
            Sign Out
          </button>
        </header>

        <div style={{
          background: "rgba(255, 255, 255, 0.85)",
          padding: "20px 28px",
          borderRadius: "20px",
          marginBottom: "32px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          backdropFilter: "blur(10px)"
        }}>
          <p style={{ margin: "0", fontSize: "14px", color: "#6b7280", fontWeight: "500" }}>
            Patient: <span style={{ color: "#1f2937", fontWeight: "600" }}>{user.email}</span>
          </p>
        </div>

        <div style={{
          display: "flex",
          gap: "32px",
          marginBottom: "40px",
          flexWrap: "wrap"
        }}>
          <div style={{
            flex: "1",
            minWidth: "280px",
            maxWidth: "400px",
            background: "rgba(255, 255, 255, 0.9)",
            padding: "32px",
            borderRadius: "24px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.12)",
            backdropFilter: "blur(10px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <img
              src="/gemini_generated_image_25iolg25iolg25io.png"
              alt="Baby Development"
              style={{
                width: "100%",
                maxWidth: "280px",
                height: "auto",
                borderRadius: "20px",
                marginBottom: "16px"
              }}
            />
            <h3 style={{
              margin: "0 0 8px 0",
              fontSize: "18px",
              color: "#1f2937",
              fontWeight: "700",
              textAlign: "center"
            }}>
              Baby Development
            </h3>
            <p style={{
              margin: "0",
              fontSize: "14px",
              color: "#6b7280",
              textAlign: "center"
            }}>
              Monitoring maternal and fetal health
            </p>
          </div>

          <div style={{ flex: "2", minWidth: "300px" }}>
            <h2 style={{
              margin: "0 0 24px 0",
              fontSize: "20px",
              color: "#1f2937",
              fontWeight: "700"
            }}>
              Health Metrics
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px"
            }}>
              <div style={{
                background: "linear-gradient(135deg, #fca5a5 0%, #fb7185 100%)",
                padding: "28px",
                borderRadius: "20px",
                boxShadow: "0 8px 30px rgba(251, 113, 133, 0.3)",
                color: "white"
              }}>
                <h3 style={{
                  margin: "0 0 12px 0",
                  fontSize: "13px",
                  fontWeight: "600",
                  opacity: "0.9",
                  letterSpacing: "0.5px"
                }}>
                  BLOOD PRESSURE
                </h3>
                <p style={{ margin: "0 0 8px 0", fontSize: "32px", fontWeight: "700" }}>120/80</p>
                <p style={{ margin: "0", fontSize: "14px", opacity: "0.95", fontWeight: "500" }}>mmHg - Normal</p>
              </div>

              <div style={{
                background: "linear-gradient(135deg, #c084fc 0%, #a855f7 100%)",
                padding: "28px",
                borderRadius: "20px",
                boxShadow: "0 8px 30px rgba(168, 85, 247, 0.3)",
                color: "white"
              }}>
                <h3 style={{
                  margin: "0 0 12px 0",
                  fontSize: "13px",
                  fontWeight: "600",
                  opacity: "0.9",
                  letterSpacing: "0.5px"
                }}>
                  GLUCOSE LEVEL
                </h3>
                <p style={{ margin: "0 0 8px 0", fontSize: "32px", fontWeight: "700" }}>95</p>
                <p style={{ margin: "0", fontSize: "14px", opacity: "0.95", fontWeight: "500" }}>mg/dL - Normal</p>
              </div>

              <div style={{
                background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                padding: "28px",
                borderRadius: "20px",
                boxShadow: "0 8px 30px rgba(59, 130, 246, 0.3)",
                color: "white"
              }}>
                <h3 style={{
                  margin: "0 0 12px 0",
                  fontSize: "13px",
                  fontWeight: "600",
                  opacity: "0.9",
                  letterSpacing: "0.5px"
                }}>
                  HEART RATE
                </h3>
                <p style={{ margin: "0 0 8px 0", fontSize: "32px", fontWeight: "700" }}>72</p>
                <p style={{ margin: "0", fontSize: "14px", opacity: "0.95", fontWeight: "500" }}>bpm - Normal</p>
              </div>

              <div style={{
                background: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
                padding: "28px",
                borderRadius: "20px",
                boxShadow: "0 8px 30px rgba(16, 185, 129, 0.3)",
                color: "white"
              }}>
                <h3 style={{
                  margin: "0 0 12px 0",
                  fontSize: "13px",
                  fontWeight: "600",
                  opacity: "0.9",
                  letterSpacing: "0.5px"
                }}>
                  RISK LEVEL
                </h3>
                <p style={{ margin: "0 0 8px 0", fontSize: "32px", fontWeight: "700" }}>Low</p>
                <p style={{ margin: "0", fontSize: "14px", opacity: "0.95", fontWeight: "500" }}>All metrics normal</p>
              </div>
            </div>
          </div>
        </div>

        <section style={{
          background: "rgba(255, 255, 255, 0.85)",
          padding: "32px",
          borderRadius: "24px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
          backdropFilter: "blur(10px)"
        }}>
          <h2 style={{
            margin: "0 0 24px 0",
            fontSize: "20px",
            color: "#1f2937",
            fontWeight: "700"
          }}>
            Quick Actions
          </h2>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <button style={{
              padding: "14px 32px",
              background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
              color: "white",
              border: "none",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(236, 72, 153, 0.3)",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(236, 72, 153, 0.4)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(236, 72, 153, 0.3)";
            }}
            >
              Add Health Record
            </button>
            <button style={{
              padding: "14px 32px",
              background: "rgba(255, 255, 255, 0.9)",
              color: "#ec4899",
              border: "2px solid #fce7f3",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.borderColor = "#fbcfe8";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.borderColor = "#fce7f3";
            }}
            >
              View History
            </button>
            <button style={{
              padding: "14px 32px",
              background: "rgba(255, 255, 255, 0.9)",
              color: "#a855f7",
              border: "2px solid #f3e8ff",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.borderColor = "#e9d5ff";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.borderColor = "#f3e8ff";
            }}
            >
              Schedule Appointment
            </button>
            <button style={{
              padding: "14px 32px",
              background: "rgba(255, 255, 255, 0.9)",
              color: "#3b82f6",
              border: "2px solid #dbeafe",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.borderColor = "#bfdbfe";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.borderColor = "#dbeafe";
            }}
            >
              Contact Doctor
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
