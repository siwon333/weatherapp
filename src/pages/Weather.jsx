import { useEffect, useRef, useState } from "react";
import WeatherCard from "../components/WeatherCard";
import ForecastList from "../components/ForecastList";
import {
  getByCity,
  getByCoords,
  getForecastByCity,
  getForecastByCoords,
} from "../services/weather";

// 캐시 유지 시간 (10분)
const CACHE_MAX_AGE = 10 * 60 * 1000;

// 캐시 키 만들기
function makeCacheKey(src, units) {
  if (src.type === "city") {
    return `weather_city_${src.value}_${units}`;
  }
  // coords
  const lat = src.lat.toFixed(3);
  const lon = src.lon.toFixed(3);
  return `weather_coords_${lat}_${lon}_${units}`;
}

// 캐시 읽기
function loadCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.time) return null;
    if (Date.now() - parsed.time > CACHE_MAX_AGE) return null;
    return parsed;
  } catch {
    return null;
  }
}

// 캐시 쓰기
function saveCache(key, current, forecast) {
  try {
    const payload = {
      time: Date.now(),
      current,
      forecast,
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // localStorage 꽉 찬 경우 등은 무시
  }
}

export default function Weather() {
  const [cityInput, setCityInput] = useState("");
  const [units, setUnits] = useState("metric"); // metric | imperial
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // 마지막 조회 소스 기억 (도시/좌표) – 단위 변경 시 재조회용
  const lastSourceRef = useRef(null);

  // 공통 조회 함수: 현재 + 예보 + 캐시 처리
  const updateWeather = async (src) => {
    const trimmed =
      src.type === "city" ? { ...src, value: src.value.trim() } : src;
    if (trimmed.type === "city" && !trimmed.value) return;

    setLoading(true);
    setErr(null);
    lastSourceRef.current = trimmed;

    const cacheKey = makeCacheKey(trimmed, units);
    const cached = loadCache(cacheKey);
    if (cached) {
      setCurrent(cached.current);
      setForecast(cached.forecast);
      setLoading(false);
      return;
    }

    try {
      let currentPromise;
      let forecastPromise;

      if (trimmed.type === "city") {
        currentPromise = getByCity(trimmed.value, { units, lang: "kr" });
        forecastPromise = getForecastByCity(trimmed.value, {
          units,
          lang: "kr",
        });
      } else {
        currentPromise = getByCoords(trimmed.lat, trimmed.lon, {
          units,
          lang: "kr",
        });
        forecastPromise = getForecastByCoords(trimmed.lat, trimmed.lon, {
          units,
          lang: "kr",
        });
      }

      const [currentRes, forecastRes] = await Promise.all([
        currentPromise,
        forecastPromise,
      ]);

      setCurrent(currentRes);
      setForecast(forecastRes);
      saveCache(cacheKey, currentRes, forecastRes);
    } catch (e) {
      setErr(e);
      setCurrent(null);
      setForecast(null);
    } finally {
      setLoading(false);
    }
  };

  // === 검색 디바운스 (입력이 멈춘 후 300ms 뒤 요청) ===
  useEffect(() => {
    const name = cityInput.trim();
    if (!name) return;

    const id = setTimeout(() => {
      updateWeather({ type: "city", value: name });
    }, 300);

    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityInput, units]);

  // === 단위 변경 시: 마지막 조회가 좌표 기반이면 다시 조회 (도시 검색은 위 useEffect가 처리) ===
  useEffect(() => {
    const src = lastSourceRef.current;
    if (!src || src.type !== "coords") return;
    updateWeather(src);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units]);

  // 폼 submit은 기본 동작만 막고, 실제 검색은 디바운스가 담당
  const onSubmit = (e) => {
    e.preventDefault();
  };

  // 내 위치(GPS) 버튼
  const onMyLocation = () => {
    if (!navigator.geolocation) {
      setErr(new Error("이 브라우저는 위치 정보를 지원하지 않습니다."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateWeather({
          type: "coords",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      () => {
        setErr(new Error("위치 권한을 허용해주세요."));
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  return (
    <main
      style={{
        maxWidth: 800,
        margin: "40px auto",
        padding: "0 16px",
        fontFamily: '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont',
      }}
    >
      <h1>OpenWeather 날씨 앱</h1>

      {/* 검색 폼 */}
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
      >
        <label
          htmlFor="city-input"
          style={{ flexBasis: "100%", fontSize: 14, fontWeight: "bold" }}
        >
          도시명 검색
        </label>

        <input
          id="city-input"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          placeholder="도시명 입력 (예: Seoul,KR)"
          style={{ flex: "1 1 250px", padding: 8 }}
          aria-describedby="city-help"
        />
        <button
          type="button"
          onClick={onMyLocation}
          aria-label="내 위치로 현재 날씨 검색"
        >
          내 위치
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <span style={{ fontSize: 14 }}>단위</span>
          <label>
            <input
              type="radio"
              name="units"
              value="metric"
              checked={units === "metric"}
              onChange={(e) => setUnits(e.target.value)}
            />{" "}
            ℃
          </label>
          <label>
            <input
              type="radio"
              name="units"
              value="imperial"
              checked={units === "imperial"}
              onChange={(e) => setUnits(e.target.value)}
            />{" "}
            ℉
          </label>
        </div>

        <p
          id="city-help"
          style={{ flexBasis: "100%", margin: "8px 0 0", fontSize: 13, color: "#666" }}
        >
          입력이 멈춘 후 약 0.3초 뒤에 자동으로 검색됩니다. (예: <code>Seoul,KR</code>)
        </p>
      </form>

      {/* 상태 메시지 – 접근성 고려 */}
      {loading && (
        <p aria-busy="true" style={{ marginTop: 16 }}>
          불러오는 중…
        </p>
      )}

      {err && (
        <p
          role="alert"
          style={{ marginTop: 16, color: "#d33" }}
        >
          오류: {err.message}
        </p>
      )}

      {!loading && !err && !current && (
        <p style={{ marginTop: 16 }}>
          도시를 검색하거나 <strong>내 위치</strong> 버튼을 눌러보세요.
        </p>
      )}

      {/* 현재 날씨 + 5일 예보 */}
      <WeatherCard data={current} />
      <ForecastList forecast={forecast} />
    </main>
  );
}
