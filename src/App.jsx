import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

const MEDICAL_RANGES = {
  age: { min: 15, max: 50, step: 1, unit: 'years' },
  bmi: { min: 15, max: 50, step: 0.1, unit: 'kg/m²' },
  gestational_week: { min: 1, max: 42, step: 1, unit: 'weeks' },
  systolic_bp: { min: 70, max: 200, step: 1, unit: 'mmHg' },
  diastolic_bp: { min: 40, max: 130, step: 1, unit: 'mmHg' },
  blood_sugar: { min: 50, max: 400, step: 0.1, unit: 'mg/dL' },
  hemoglobin: { min: 5, max: 20, step: 0.1, unit: 'g/dL' },
  kick_count: { min: 0, max: 50, step: 1, unit: 'per hour' },
  amniotic_fluid: { min: 0, max: 30, step: 0.1, unit: 'cm' }
};

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
  const [predicting, setPredicting] = useState(false);

  const [healthData, setHealthData] = useState({
    age: '',
    bmi: '',
    gestational_week: '',
    systolic_bp: '',
    diastolic_bp: '',
    blood_sugar: '',
    hemoglobin: '',
    kick_count: '',
    amniotic_fluid: '',
    previous_complications: '0',
    rh_factor: '1',
    pregnancy_order: '1',
    notes: ''
  });

  const inputRefs = useRef({});

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

  const handleKeyDown = (e, fieldName) => {
    const config = MEDICAL_RANGES[fieldName];
    if (!config) return;

    const currentValue = parseFloat(healthData[fieldName]) || config.min;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = Math.min(currentValue + config.step, config.max);
      setHealthData({ ...healthData, [fieldName]: newValue.toFixed(config.step < 1 ? 1 : 0) });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = Math.max(currentValue - config.step, config.min);
      setHealthData({ ...healthData, [fieldName]: newValue.toFixed(config.step < 1 ? 1 : 0) });
    }
  };

  const validateInput = (fieldName, value) => {
    const config = MEDICAL_RANGES[fieldName];
    if (!config) return true;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    return numValue >= config.min && numValue <= config.max;
  };

  const handleHealthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPredicting(true);

    try {
      for (const [field, value] of Object.entries(healthData)) {
        if (MEDICAL_RANGES[field] && value && !validateInput(field, value)) {
          const config = MEDICAL_RANGES[field];
          throw new Error(`${field} must be between ${config.min} and ${config.max} ${config.unit}`);
        }
      }

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

      const predictionData = {
        age: parseFloat(healthData.age),
        bmi: parseFloat(healthData.bmi),
        gestational_week: parseInt(healthData.gestational_week),
        systolic_bp: parseInt(healthData.systolic_bp),
        diastolic_bp: parseInt(healthData.diastolic_bp),
        blood_sugar: parseFloat(healthData.blood_sugar),
        hemoglobin: parseFloat(healthData.hemoglobin),
        kick_count: parseInt(healthData.kick_count),
        amniotic_fluid: parseFloat(healthData.amniotic_fluid),
        previous_complications: parseInt(healthData.previous_complications),
        rh_factor: parseInt(healthData.rh_factor),
        pregnancy_order: parseInt(healthData.pregnancy_order)
      };

      const riskScore =
        (predictionData.hemoglobin < 10 ? 2 : 0) +
        (predictionData.blood_sugar > 140 ? 2 : 0) +
        (predictionData.systolic_bp > 140 ? 2 : 0) +
        (predictionData.diastolic_bp > 90 ? 2 : 0) +
        (predictionData.amniotic_fluid < 10 ? 2 : 0) +
        (predictionData.kick_count < 5 ? 1 : 0);

      const riskLevel = riskScore >= 5 ? 'HIGH' : riskScore >= 2 ? 'MEDIUM' : 'LOW';

      const { error: insertError } = await supabase
        .from('health_records')
        .insert([{
          patient_id: patientId,
          recorded_by: user.id,
          age: predictionData.age,
          bmi: predictionData.bmi,
          gestational_week: predictionData.gestational_week,
          systolic_bp: predictionData.systolic_bp,
          diastolic_bp: predictionData.diastolic_bp,
          blood_sugar: predictionData.blood_sugar,
          hemoglobin: predictionData.hemoglobin,
          kick_count: predictionData.kick_count,
          amniotic_fluid: predictionData.amniotic_fluid,
          previous_complications: predictionData.previous_complications,
          rh_factor: predictionData.rh_factor,
          pregnancy_order: predictionData.pregnancy_order,
          risk_level: riskLevel,
          notes: healthData.notes
        }]);

      if (insertError) throw insertError;

      await loadHealthRecords(user.id);
      setShowHealthForm(false);
      setHealthData({
        age: '',
        bmi: '',
        gestational_week: '',
        systolic_bp: '',
        diastolic_bp: '',
        blood_sugar: '',
        hemoglobin: '',
        kick_count: '',
        amniotic_fluid: '',
        previous_complications: '0',
        rh_factor: '1',
        pregnancy_order: '1',
        notes: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setPredicting(false);
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

  const renderInputField = (name, label, type = 'number') => {
    const config = MEDICAL_RANGES[name];
    return (
      <div>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#94a3b8" }}>
          {label} {config && `(${config.min}-${config.max} ${config.unit})`}
        </label>
        <input
          ref={el => inputRefs.current[name] = el}
          type={type}
          step={config?.step || 'any'}
          min={config?.min}
          max={config?.max}
          value={healthData[name]}
          onChange={(e) => setHealthData({...healthData, [name]: e.target.value})}
          onKeyDown={(e) => handleKeyDown(e, name)}
          required
          placeholder={`Use ↑↓ arrows`}
          style={{
            width: "100%",
            padding: "12px",
            background: "rgba(255, 255, 255, 0.05)",
            border: `1px solid ${healthData[name] && !validateInput(name, healthData[name]) ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: "10px",
            color: "white",
            outline: "none",
            boxSizing: "border-box"
          }}
        />
        {healthData[name] && !validateInput(name, healthData[name]) && (
          <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
            Must be between {config.min}-{config.max}
          </p>
        )}
      </div>
    );
  };

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
                    <p style={{ margin: "0", fontSize: "12px", color: "#94a3b8" }}>Week {latestRecord?.gestational_week || '20'}</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "24px", fontWeight: "700" }}>
                      Trimester {latestRecord?.gestational_week ? Math.ceil(latestRecord.gestational_week / 13) : 2}
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
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                    {renderInputField('age', 'Age')}
                    {renderInputField('bmi', 'BMI')}
                    {renderInputField('gestational_week', 'Gestational Week')}
                    {renderInputField('systolic_bp', 'Systolic BP')}
                    {renderInputField('diastolic_bp', 'Diastolic BP')}
                    {renderInputField('blood_sugar', 'Blood Sugar')}
                    {renderInputField('hemoglobin', 'Hemoglobin')}
                    {renderInputField('kick_count', 'Kick Count')}
                    {renderInputField('amniotic_fluid', 'Amniotic Fluid')}

                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#94a3b8" }}>
                        Previous Complications
                      </label>
                      <select
                        value={healthData.previous_complications}
                        onChange={(e) => setHealthData({...healthData, previous_complications: e.target.value})}
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
                      >
                        <option value="0" style={{ background: "#1a1a2e" }}>No</option>
                        <option value="1" style={{ background: "#1a1a2e" }}>Yes</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#94a3b8" }}>
                        RH Factor
                      </label>
                      <select
                        value={healthData.rh_factor}
                        onChange={(e) => setHealthData({...healthData, rh_factor: e.target.value})}
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
                      >
                        <option value="1" style={{ background: "#1a1a2e" }}>Positive</option>
                        <option value="0" style={{ background: "#1a1a2e" }}>Negative</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#94a3b8" }}>
                        Pregnancy Order
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={healthData.pregnancy_order}
                        onChange={(e) => setHealthData({...healthData, pregnancy_order: e.target.value})}
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
                      disabled={predicting}
                      style={{
                        padding: "12px 32px",
                        background: predicting ? "rgba(255, 255, 255, 0.1)" : "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
                        border: "none",
                        borderRadius: "10px",
                        color: "white",
                        cursor: predicting ? "not-allowed" : "pointer",
                        fontSize: "15px",
                        fontWeight: "600"
                      }}
                    >
                      {predicting ? 'Analyzing...' : 'Predict Risk Level'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHealthForm(false)}
                      disabled={predicting}
                      style={{
                        padding: "12px 32px",
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "10px",
                        color: "white",
                        cursor: predicting ? "not-allowed" : "pointer",
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
                          Week {record.gestational_week} Check
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
                  <div style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "12px",
                    padding: "16px"
                  }}>
                    <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#94a3b8" }}>BMI</p>
                    <p style={{ margin: "0", fontSize: "20px", fontWeight: "700" }}>
                      {latestRecord.bmi}
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
