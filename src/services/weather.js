// OpenWeather API 호출 모듈 (현재 날씨 + 5일 예보, 공통 fetch 헬퍼 포함)

const BASE = process.env.REACT_APP_OW_BASE || "https://api.openweathermap.org";
const KEY = process.env.REACT_APP_OW_KEY;

// 공통 요청 헬퍼: res.ok 검사 + AbortController + 타임아웃
async function ow(path, params = {}, { signal } = {}) {
  if (!KEY) {
    throw new Error("환경변수 REACT_APP_OW_KEY가 없습니다.");
  }

  const q = new URLSearchParams({ ...params, appid: KEY }).toString();
  const url = `${BASE}${path}?${q}`;

  const ac = new AbortController();
  const timeoutId = setTimeout(() => ac.abort(), 8000); // 8초 타임아웃

  try {
    const res = await fetch(url, { signal: signal ?? ac.signal });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const j = await res.json();
        if (j?.message) msg = `${res.status}: ${j.message}`;
      } catch (e) {
        // JSON 파싱 실패 시엔 기본 메시지 유지
      }
      throw new Error(msg);
    }

    return await res.json();
  } catch (e) {
    if (e.name === "AbortError") {
      throw new Error("요청이 시간 초과되었습니다.");
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

// === 현재 날씨 ===
export function getByCity(city, { units = "metric", lang = "kr" } = {}, opts = {}) {
  return ow("/data/2.5/weather", { q: city, units, lang }, opts);
}

export function getByCoords(lat, lon, { units = "metric", lang = "kr" } = {}, opts = {}) {
  return ow("/data/2.5/weather", { lat, lon, units, lang }, opts);
}

// === 5일(3시간 간격) 예보 ===
export function getForecastByCity(
  city,
  { units = "metric", lang = "kr" } = {},
  opts = {}
) {
  return ow("/data/2.5/forecast", { q: city, units, lang }, opts);
}

export function getForecastByCoords(
  lat,
  lon,
  { units = "metric", lang = "kr" } = {},
  opts = {}
) {
  return ow("/data/2.5/forecast", { lat, lon, units, lang }, opts);
}

// 아이콘 URL 헬퍼
export function iconUrl(icon) {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}
