import { iconUrl } from "../services/weather";

// 5일 예보 리스트
export default function ForecastList({ forecast }) {
  if (!forecast?.list?.length) return null;

  // 하루에 여러 개(3시간 간격) 중에서, 12시(정오) 데이터 위주로 5일만 뽑기
  const byDate = new Map();

  forecast.list.forEach((item) => {
    const d = new Date(item.dt * 1000);
    const dateKey = d.toLocaleDateString(); // 예: 2025. 10. 30.

    const hour = d.getHours();
    const prev = byDate.get(dateKey);

    // 12시에 가장 가깝게 선택
    if (!prev || Math.abs(hour - 12) < Math.abs(prev._hour - 12)) {
      byDate.set(dateKey, { ...item, _hour: hour });
    }
  });

  const days = Array.from(byDate.entries())
    .slice(0, 5) // 최대 5일
    .map(([date, item]) => ({ date, item }));

  return (
    <section
      aria-label="5일 예보"
      style={{ marginTop: 32 }}
    >
      <h2 style={{ marginTop: 0 }}>5일 예보</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: 12,
        }}
      >
        {days.map(({ date, item }) => {
          const w = item.weather?.[0] || {};
          const main = item.main || {};
          const icon = w.icon ? iconUrl(w.icon) : "";
          const time = new Date(item.dt * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <article
              key={item.dt}
              style={{
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 12,
                background: "#fafafa",
              }}
            >
              <div style={{ fontSize: 13, marginBottom: 4 }}>{date}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{time}</div>
              {icon && (
                <img
                  src={icon}
                  alt={w.description || "weather icon"}
                  style={{ width: 50, height: 50 }}
                />
              )}
              <p style={{ margin: "4px 0", fontWeight: "bold" }}>
                {Math.round(main.temp)}°
              </p>
              <p style={{ margin: 0, fontSize: 12 }}>
                {w.main} {w.description && `- ${w.description}`}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
