export default function App() {
  return (
    <div style={{
      padding: "40px",
      fontFamily: "Arial",
      color: "white",
      background: "#0f172a",
      minHeight: "100vh"
    }}>
      <header style={{ marginBottom: "40px" }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: "32px" }}>Maternal Risk AI</h1>
        <p style={{ margin: "0", color: "#94a3b8", fontSize: "16px" }}>
          Monitor maternal health metrics and risk assessments
        </p>
      </header>

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
