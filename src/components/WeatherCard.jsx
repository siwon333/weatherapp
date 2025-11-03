// 현재 날씨를 보여주는 카드 컴포넌트

export default function WeatherCard({ data }) {
  if (!data) return null;

  const w = data.weather?.[0] || {};
  const main = data.main || {};
  const wind = data.wind || {};
  const icon = w.icon
    ? `https://openweathermap.org/img/wn/${w.icon}@2x.png`
    : "";

  const updatedAt = data.dt
    ? new Date(data.dt * 1000).toLocaleString()
    : "";

  return (
    <section
      aria-label="현재 날씨"
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 16,
        marginTop: 24,
        background: "#fff",
      }}
    >
      <header style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {icon && (
          <img
            src={icon}
            alt={w.description || "weather icon"}
            style={{ width: 80, height: 80 }}
          />
        )}
        <div>
          <h2 style={{ margin: 0 }}>
            {data.name}
            {data.sys?.country ? ` (${data.sys.country})` : ""}
          </h2>
          <p style={{ margin: "4px 0", color: "#555" }}>
            {w.main} {w.description ? `- ${w.description}` : ""}
          </p>
        </div>
      </header>

      <div style={{ marginTop: 12 }}>
        <p style={{ fontSize: 32, margin: "4px 0" }}>
          {Math.round(main.temp)}°
        </p>
        <p style={{ margin: "4px 0" }}>
          체감: {Math.round(main.feels_like)}° / 최저:{" "}
          {Math.round(main.temp_min)}° / 최고: {Math.round(main.temp_max)}°
        </p>
        <p style={{ margin: "4px 0" }}>
          습도: {main.humidity}% • 풍속: {wind.speed} m/s
        </p>
      </div>

      {data.sys?.sunrise && (
        <p style={{ marginTop: 8 }}>
          일출: {new Date(data.sys.sunrise * 1000).toLocaleTimeString()} • 일몰:{" "}
          {new Date(data.sys.sunset * 1000).toLocaleTimeString()}
        </p>
      )}

      {updatedAt && (
        <p style={{ marginTop: 4, fontSize: 12, color: "#777" }}>
          측정 시각: {updatedAt}
        </p>
      )}
    </section>
  );
}
