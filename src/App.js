import { Routes, Route, Link } from "react-router-dom";
import Weather from "./pages/Weather";

export default function App() {
  return (
    <>
      <nav
        style={{
          padding: 12,
          borderBottom: "1px solid #eee",
          marginBottom: 16,
        }}
      >
        <Link to="/weather">Weather</Link>
      </nav>

      <Routes>
        <Route path="/weather" element={<Weather />} />
        <Route
          path="*"
          element={
            <div style={{ padding: 16 }}>
              홈입니다. <Link to="/weather">/weather</Link> 로 이동해 보세요.
            </div>
          }
        />
      </Routes>
    </>
  );
}
