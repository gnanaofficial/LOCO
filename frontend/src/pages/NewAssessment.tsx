import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAssessment } from '../api/client';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { AssessmentLoading } from '../components/AssessmentLoading';

export const NewAssessment: React.FC = () => {
  const navigate = useNavigate();

  const [label, setLabel] = useState<string>('');
  const [mode, setMode] = useState<'address' | 'coordinates'>('address');
  const [address, setAddress] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!label.trim()) {
      setError('Please enter a location label (e.g., Denver Office).');
      return;
    }

    let payload: any = { label: label.trim() };

    if (mode === 'address') {
      if (!address.trim()) {
        setError('Please enter a US address.');
        return;
      }
      payload.address = address.trim();
    } else {
      const latNum = parseFloat(latitude);
      const lonNum = parseFloat(longitude);

      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        setError('Latitude must be a valid number between -90 and 90.');
        return;
      }
      if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
        setError('Longitude must be a valid number between -180 and 180.');
        return;
      }

      payload.latitude = latNum;
      payload.longitude = lonNum;
    }

    try {
      setLoading(true);
      const result = await createAssessment(payload);
      navigate(`/assessments/${result.id}`, { state: { assessment: result } });
    } catch (err: any) {
      setError(err.message || 'Unable to create assessment. Please check the location and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AssessmentLoading
        title="Assessing your location"
        description="Gathering live location factors and calculating your score."
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Title section */}
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-[11px] font-medium tracking-wide text-zinc-300">
          <MapPin className="size-3.5" /> LOCATION INTELLIGENCE
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
          Assess a Location
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Enter a US location to retrieve public data and calculate an assessment score.
        </p>
      </div>

      {/* Form Card */}
      <Card className="rounded-3xl p-6 sm:p-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-rose-400/10 border border-rose-300/20 rounded-xl text-rose-200 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-100 mb-0.5">Unable to create assessment</p>
              <p className="text-xs text-rose-300">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Label Field */}
          <div>
            <Label htmlFor="location-label" className="uppercase tracking-wider">
              Location Label <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="location-label"
              type="text"
              placeholder="e.g. Denver Office, Salt Lake Logistics Hub"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Location Type Selector (Tabs) */}
          <div>
            <Label className="uppercase tracking-wider">
              Location Mode
            </Label>
            <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/[0.07] bg-black/20 p-1.5">
              <button
                type="button"
                onClick={() => setMode('address')}
                disabled={loading}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  mode === 'address'
                    ? 'bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Address Mode
              </button>

              <button
                type="button"
                onClick={() => setMode('coordinates')}
                disabled={loading}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  mode === 'coordinates'
                    ? 'bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                Coordinates Mode
              </button>
            </div>
          </div>

          {/* Mode Inputs */}
          {mode === 'address' ? (
            <div>
              <Label htmlFor="us-address" className="uppercase tracking-wider">
                US Address <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="us-address"
                type="text"
                placeholder="e.g. 1437 Bannock St, Denver, CO"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Address will be geocoded to latitude & longitude using US Census Geocoder.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude" className="uppercase tracking-wider">
                  Latitude <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g. 39.7392"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  disabled={loading}
                  className="font-mono"
                />
              </div>

              <div>
                <Label htmlFor="longitude" className="uppercase tracking-wider">
                  Longitude <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="e.g. -104.9903"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  disabled={loading}
                  className="font-mono"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full"
            >
              <span>Assess Location</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
