import React from 'react';

interface FactorSceneProps {
  factorName: string;
  value: string | null;
}

const readNumber = (value: string | null) => {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

function WeatherScene({ value }: { value: string | null }) {
  const condition = (value || '').toLowerCase();
  const kind = /thunder|storm|lightning/.test(condition)
    ? 'storm'
    : /rain|drizzle|shower/.test(condition)
      ? 'rain'
      : /snow|sleet|hail/.test(condition)
        ? 'snow'
        : /fog|mist/.test(condition)
          ? 'fog'
          : /cloud|overcast/.test(condition)
            ? 'cloudy'
            : 'clear';

  return (
    <div className={`factor-scene weather-scene weather-${kind}`} aria-hidden="true">
      {kind === 'clear' && <div className="weather-sun"><span /></div>}
      <div className="weather-cloud weather-cloud--back" />
      <div className="weather-cloud weather-cloud--front" />
      {kind === 'rain' || kind === 'storm' ? (
        <div className="weather-rain">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ '--drop-index': i } as React.CSSProperties} />)}</div>
      ) : null}
      {kind === 'snow' && <div className="weather-snow">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ '--flake-index': i } as React.CSSProperties} />)}</div>}
      {kind === 'storm' && <div className="weather-lightning" />}
      {kind === 'fog' && <div className="weather-fog"><i /><i /><i /></div>}
      <div className="weather-horizon" />
      <span className="scene-caption">{value || 'Weather pattern'}</span>
    </div>
  );
}

function TemperatureScene({ value }: { value: string | null }) {
  const parsed = readNumber(value);
  const temp = parsed !== null && /°?\s*f\b/i.test(value || '') ? (parsed - 32) * (5 / 9) : parsed;
  const warm = temp !== null && temp >= 24;
  const cold = temp !== null && temp <= 8;
  const variant = warm ? 'warm' : cold ? 'cold' : 'mild';
  const position = temp === null ? 50 : Math.max(0, Math.min(100, ((temp + 20) / 60) * 100));

  return (
    <div className={`factor-scene temperature-scene temperature-${variant}`} aria-hidden="true">
      <div className="temperature-orb"><span /></div>
      <div className="temperature-flow"><i /><i /><i /><i /></div>
      {cold && <div className="temperature-frost">{Array.from({ length: 5 }, (_, i) => <i key={i} style={{ '--flake-index': i } as React.CSSProperties} />)}</div>}
      <div className="temperature-scale" style={{ '--temp-position': `${position}%` } as React.CSSProperties}>
        <span className="temperature-scale__marker" />
      </div>
      <div className="temperature-horizon" />
      <span className="scene-caption">{value || 'Temperature'}</span>
    </div>
  );
}

function ElevationScene({ value }: { value: string | null }) {
  const elevation = readNumber(value);
  const high = elevation !== null && elevation >= 1800;
  const mid = elevation !== null && elevation >= 700 && !high;
  const variant = high ? 'high' : mid ? 'mid' : 'low';

  return (
    <div className={`factor-scene elevation-scene elevation-${variant}`} aria-hidden="true">
      <div className="elevation-sky" />
      <div className="elevation-mountain elevation-mountain--far" />
      <div className="elevation-mountain elevation-mountain--near" />
      <div className="elevation-tree elevation-tree--one" />
      <div className="elevation-tree elevation-tree--two" />
      <div className="elevation-ground" />
      <span className="scene-caption">{value || 'Elevation profile'}</span>
    </div>
  );
}

export const FactorScene: React.FC<FactorSceneProps> = ({ factorName, value }) => {
  const name = factorName.toLowerCase();
  if (name.includes('weather')) return <WeatherScene value={value} />;
  if (name.includes('temperature')) return <TemperatureScene value={value} />;
  if (name.includes('elevation')) return <ElevationScene value={value} />;
  return null;
};
