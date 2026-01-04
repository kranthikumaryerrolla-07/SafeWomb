import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [healthRecords, setHealthRecords] = useState([]);
  const [latestRecord, setLatestRecord] = useState(null);

  const [healthData, setHealthData] = useState({
    age: '',
    hemoglobin: '',
    blood_sugar: '',
    systolic_bp: '',
    diastolic_bp: '',
    tsh: '',
    amniotic_fluid: '',
    notes: ''
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        loadHealthRecords(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadHealthRecords(session.user.id);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadHealthRecords = async (userId) => {
    const { data: profile } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profile) {
      const { data: records } = await supabase
        .from('health_records')
        .select('*')
        .eq('patient_id', profile.id)
        .order('created_at', { ascending: false });

      if (records && records.length > 0) {
        setHealthRecords(records);
        setLatestRecord(records[0]);
      }
    }
  };

  const calculateRiskLevel = async (data) => {
    const riskScore =
      (parseFloat(data.hemoglobin) < 10 ? 2 : 0) +
      (parseFloat(data.blood_sugar) > 140 ? 2 : 0) +
      (parseInt(data.systolic_bp) > 140 ? 2 : 0) +
      (parseInt(data.diastolic_bp) > 90 ? 2 : 0) +
      (parseFloat(data.tsh) > 4 || parseFloat(data.tsh) < 0.5 ? 1 : 0) +
      (parseFloat(data.amniotic_fluid) < 10 ? 2 : 0);

    if (riskScore >= 5) return 'HIGH';
    if (riskScore >= 2) return 'MEDIUM';
    return 'LOW';
  };

  const handleHealthSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { data: profile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let patientId = profile?.id;

      if (!patientId) {
        const { data: newProfile, error: profileError } = await supabase
          .from('patient_profiles')
          .insert([{ user_id: user.id }])
          .select()
          .single();

        if (profileError) throw profileError;
        patientId = newProfile.id;
      }

      const riskLevel = await calculateRiskLevel(healthData);

      const { error: insertError } = await supabase
        .from('health_records')
        .insert([{
          patient_id: patientId,
          recorded_by: user.id,
          hemoglobin: parseFloat(healthData.hemoglobin),
          blood_sugar: parseFloat(healthData.blood_sugar),
          systolic_bp: parseInt(healthData.systolic_bp),
          diastolic_bp: parseInt(healthData.diastolic_bp),
          tsh: parseFloat(healthData.tsh),
          amniotic_fluid: parseFloat(healthData.amniotic_fluid),
          risk_level: riskLevel,
          notes: healthData.notes
        }]);

      if (insertError) throw insertError;

      await loadHealthRecords(user.id);
      setShowHealthForm(false);
      setHealthData({
        age: '',
        hemoglobin: '',
        blood_sugar: '',
        systolic_bp: '',
        diastolic_bp: '',
        tsh: '',
        amniotic_fluid: '',
        notes: ''
      });
    } catch (err) {
      setError(err.message);
    }
  };

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

  const getCurrentDate = () => {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.toLocaleString('default', { month: 'short' }),
      year: now.getFullYear(),
      time: now.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    };
  };

  const generateCalendar = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return { days, today, month: now.toLocaleString('default', { month: 'long' }), year };
  };

  if (loading) {
    return (
      <div style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "white",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          background: "rgba(255, 255, 255, 0.1)",
          padding: "24px 32px",
          borderRadius: "20px",
          backdropFilter: "blur(10px)"
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
                  outline: "none"
                }}
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
                  outline: "none"
                }}
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
                boxShadow: "0 4px 15px rgba(236, 72, 153, 0.3)"
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

  const currentDate = getCurrentDate();
  const calendar = generateCalendar();
  const riskColor = latestRecord?.risk_level === 'HIGH' ? '#ef4444' :
                    latestRecord?.risk_level === 'MEDIUM' ? '#f59e0b' : '#10b981';

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      minHeight: "100vh",
      padding: "20px",
      color: "white"
    }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        <header style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "20px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)"
            }}>
              ❤️
            </div>
            <span style={{ fontSize: "18px", fontWeight: "600" }}>MaternalCare</span>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search"
              style={{
                padding: "10px 16px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "10px",
                color: "white",
                outline: "none",
                backdropFilter: "blur(10px)",
                width: "200px"
              }}
            />
            <button
              onClick={handleSignOut}
              style={{
                padding: "10px 20px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                borderRadius: "10px",
                color: "white",
                cursor: "pointer",
                backdropFilter: "blur(10px)"
              }}
            >
              Sign Out
            </button>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "30px" }}>
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h1 style={{ margin: "0 0 4px 0", fontSize: "36px", fontWeight: "700" }}>Overview</h1>
              <p style={{ margin: "0", color: "#94a3b8", fontSize: "16px" }}>Patient Health</p>
            </div>

            <div style={{
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "24px",
              padding: "32px",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              marginBottom: "24px"
            }}>
              <div style={{ display: "flex", gap: "40px", alignItems: "center" }}>
                <div style={{ flex: "1" }}>
                  <img
                    src="/gemini_generated_image_25iolg25iolg25io.png"
                    alt="Baby Development"
                    style={{
                      width: "100%",
                      maxWidth: "320px",
                      height: "auto",
                      borderRadius: "20px"
                    }}
                  />
                  <div style={{
                    position: "relative",
                    marginTop: "-60px",
                    marginLeft: "20px",
                    background: "rgba(0, 0, 0, 0.6)",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    backdropFilter: "blur(10px)",
                    display: "inline-block"
                  }}>
                    <p style={{ margin: "0", fontSize: "12px", color: "#94a3b8" }}>Heart Rate</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "24px", fontWeight: "700" }}>
                      {latestRecord?.systolic_bp || 98}<span style={{ fontSize: "14px", color: "#94a3b8" }}>%</span>
                    </p>
                  </div>
                </div>

                <div style={{ flex: "1" }}>
                  <div style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "16px",
                    padding: "20px",
                    marginBottom: "16px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px"
                      }}>
                        👤
                      </div>
                      <div>
                        <p style={{ margin: "0", fontSize: "16px", fontWeight: "600" }}>{user.email?.split('@')[0]}</p>
                        <p style={{ margin: "0", fontSize: "14px", color: "#94a3b8" }}>Patient</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowHealthForm(!showHealthForm)}
                      style={{
                        padding: "10px 20px",
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "14px",
                        width: "100%"
                      }}
                    >
                      📋 Add Health Record
                    </button>
                  </div>

                  {latestRecord && (
                    <div style={{
                      background: `rgba(${riskColor === '#ef4444' ? '239, 68, 68' : riskColor === '#f59e0b' ? '245, 158, 11' : '16, 185, 129'}, 0.1)`,
                      borderRadius: "16px",
                      padding: "20px",
                      border: `1px solid ${riskColor}40`
                    }}>
                      <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#94a3b8" }}>Current Risk Level</p>
                      <p style={{ margin: "0", fontSize: "28px", fontWeight: "700", color: riskColor }}>
                        {latestRecord.risk_level}
                      </p>
                      <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
                        Last updated: {new Date(latestRecord.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {showHealthForm && (
              <div style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "24px",
                padding: "32px",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                marginBottom: "24px"
              }}>
                <h3 style={{ margin: "0 0 24px 0", fontSize: "20px", fontWeight: "600" }}>Add Health Record</h3>
                <form onSubmit={handleHealthSubmit}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#94a3b8" }}>
                        Age (years)
                      </label>
                      <input
                        type="number"
                        value={healthData.age}
                        onChange={(e) => setHealthData({...healthData, age: e.target.value})}
                        required
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "10px",
                          color: "white",
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#94a3b8" }}>
                        Hemoglobin (g/dL)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={healthData.hemoglobin}
                        onChange={(e) => setHealthData({...healthData, hemoglobin: e.target.value})}
                        required
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "10px",
                          color: "white",
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#94a3b8" }}>
                        Blood Sugar (mg/dL)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={healthData.blood_sugar}
                        onChange={(e) => setHealthData({...healthData, blood_sugar: e.target.value})}
                        required
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "10px",
                          color: "white",
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#94a3b8" }}>
                        Systolic BP (mmHg)
                      </label>
                      <input
                        type="number"
                        value={healthData.systolic_bp}
                        onChange={(e) => setHealthData({...healthData, systolic_bp: e.target.value})}
                        required
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "10px",
                          color: "white",
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#94a3b8" }}>
                        Diastolic BP (mmHg)
                      </label>
                      <input
                        type="number"
                        value={healthData.diastolic_bp}
                        onChange={(e) => setHealthData({...healthData, diastolic_bp: e.target.value})}
                        required
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "10px",
                          color: "white",
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#94a3b8" }}>
                        TSH (mIU/L)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={healthData.tsh}
                        onChange={(e) => setHealthData({...healthData, tsh: e.target.value})}
                        required
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "10px",
                          color: "white",
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#94a3b8" }}>
                        Amniotic Fluid (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={healthData.amniotic_fluid}
                        onChange={(e) => setHealthData({...healthData, amniotic_fluid: e.target.value})}
                        required
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "10px",
                          color: "white",
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#94a3b8" }}>
                      Notes (optional)
                    </label>
                    <textarea
                      value={healthData.notes}
                      onChange={(e) => setHealthData({...healthData, notes: e.target.value})}
                      rows="3"
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "10px",
                        color: "white",
                        outline: "none",
                        boxSizing: "border-box",
                        resize: "vertical"
                      }}
                    />
                  </div>

                  {error && (
                    <p style={{ color: "#ef4444", fontSize: "14px", marginTop: "16px" }}>{error}</p>
                  )}

                  <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                    <button
                      type="submit"
                      style={{
                        padding: "12px 32px",
                        background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
                        border: "none",
                        borderRadius: "10px",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "15px",
                        fontWeight: "600"
                      }}
                    >
                      Submit & Analyze
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHealthForm(false)}
                      style={{
                        padding: "12px 32px",
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "10px",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "15px"
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div style={{
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "24px",
              padding: "32px",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}>
              <h3 style={{ margin: "0 0 24px 0", fontSize: "18px", fontWeight: "600" }}>Recent Health Records</h3>
              <div style={{ display: "grid", gap: "16px" }}>
                {healthRecords.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "14px" }}>No health records yet. Add your first record above.</p>
                ) : (
                  healthRecords.slice(0, 3).map((record, idx) => (
                    <div key={record.id} style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "16px",
                      padding: "20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <p style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600" }}>
                          Health Check #{healthRecords.length - idx}
                        </p>
                        <p style={{ margin: "0", fontSize: "14px", color: "#94a3b8" }}>
                          {new Date(record.created_at).toLocaleDateString()} at {new Date(record.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        background: record.risk_level === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' :
                                   record.risk_level === 'MEDIUM' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: record.risk_level === 'HIGH' ? '#ef4444' :
                               record.risk_level === 'MEDIUM' ? '#f59e0b' : '#10b981',
                        fontWeight: "600",
                        fontSize: "14px"
                      }}>
                        {record.risk_level}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div>
            <div style={{
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "24px",
              padding: "24px",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              marginBottom: "24px"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px"
              }}>
                <p style={{ margin: "0", fontSize: "16px", fontWeight: "600" }}>{currentDate.time}</p>
              </div>

              <div style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                padding: "16px"
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px"
                }}>
                  <span style={{ fontSize: "14px", fontWeight: "600" }}>
                    {calendar.month} {calendar.year}
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                      cursor: "pointer",
                      padding: "4px 12px"
                    }}>←</button>
                    <button style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                      cursor: "pointer",
                      padding: "4px 12px"
                    }}>→</button>
                  </div>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "8px",
                  marginBottom: "12px"
                }}>
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <div key={day} style={{
                      textAlign: "center",
                      fontSize: "10px",
                      color: "#94a3b8",
                      fontWeight: "600"
                    }}>
                      {day}
                    </div>
                  ))}
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "8px"
                }}>
                  {calendar.days.map((day, idx) => (
                    <div key={idx} style={{
                      textAlign: "center",
                      padding: "8px",
                      borderRadius: "8px",
                      background: day === calendar.today ? "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)" :
                                 day ? "rgba(255, 255, 255, 0.05)" : "transparent",
                      fontSize: "14px",
                      fontWeight: day === calendar.today ? "700" : "500",
                      cursor: day ? "pointer" : "default",
                      color: day ? "white" : "transparent"
                    }}>
                      {day || "-"}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {latestRecord && (
              <div style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "24px",
                padding: "24px",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)"
              }}>
                <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: "600" }}>Latest Metrics</h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "12px",
                    padding: "16px"
                  }}>
                    <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#94a3b8" }}>Blood Pressure</p>
                    <p style={{ margin: "0", fontSize: "20px", fontWeight: "700" }}>
                      {latestRecord.systolic_bp}/{latestRecord.diastolic_bp}
                    </p>
                  </div>
                  <div style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "12px",
                    padding: "16px"
                  }}>
                    <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#94a3b8" }}>Blood Sugar</p>
                    <p style={{ margin: "0", fontSize: "20px", fontWeight: "700" }}>
                      {latestRecord.blood_sugar} mg/dL
                    </p>
                  </div>
                  <div style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "12px",
                    padding: "16px"
                  }}>
                    <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#94a3b8" }}>Hemoglobin</p>
                    <p style={{ margin: "0", fontSize: "20px", fontWeight: "700" }}>
                      {latestRecord.hemoglobin} g/dL
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
