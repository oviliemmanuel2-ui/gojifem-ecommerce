'use client';

import React, { useState } from 'react';
import { Truck, CheckCircle, Globe } from 'lucide-react';

const SERVICEABLE_DESTINATIONS = [
  { code: 'NG', name: 'Nigeria (All 36 States + FCT)', days: '1 - 3 Business Days', status: 'available' },
  { code: 'GH', name: 'Ghana (Accra & Kumasi)', days: '3 - 5 Business Days', status: 'available' },
  { code: 'GB', name: 'United Kingdom (Export Corridors)', days: '4 - 7 Business Days', status: 'available' },
  { code: 'US', name: 'United States (Express Only)', days: '5 - 8 Business Days', status: 'available' },
];

export function DeliveryChecker() {
  const [selectedCountry, setSelectedCountry] = useState('NG');
  const [selectedState, setSelectedState] = useState('Lagos');

  const destination = SERVICEABLE_DESTINATIONS.find((d) => d.code === selectedCountry);

  return (
    <div className="bg-rose/30 border border-gold/40 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Truck className="w-5 h-5 text-ruby" />
        <h4 className="font-serif font-bold text-espresso text-sm">Delivery Coverage & Estimator</h4>
      </div>

      <p className="text-xs text-espresso/75 mb-4 leading-relaxed">
        GOJIFEM delivers directly from verified Nigerian merchants to supported destinations worldwide.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-[11px] font-bold text-espresso mb-1">Destination Country</label>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full text-xs border border-rose rounded-lg p-2 bg-white text-espresso focus:outline-none focus:ring-1 focus:ring-ruby font-medium"
          >
            {SERVICEABLE_DESTINATIONS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCountry === 'NG' && (
          <div>
            <label className="block text-[11px] font-bold text-espresso mb-1">Nigerian State</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full text-xs border border-rose rounded-lg p-2 bg-white text-espresso focus:outline-none focus:ring-1 focus:ring-ruby font-medium"
            >
              <option value="Lagos">Lagos State (Same-Day / Next-Day)</option>
              <option value="Abuja">Abuja FCT (1-2 Days)</option>
              <option value="Rivers">Rivers State - Port Harcourt (2 Days)</option>
              <option value="Oyo">Oyo State - Ibadan (1-2 Days)</option>
              <option value="Kano">Kano State (2-3 Days)</option>
              <option value="Enugu">Enugu State (2-3 Days)</option>
              <option value="Other">All Other 30 States (2-4 Days)</option>
            </select>
          </div>
        )}
      </div>

      {destination && (
        <div className="p-3 bg-rose/60 border border-gold/30 rounded-xl text-xs space-y-1.5 text-espresso">
          <div className="flex items-center gap-1.5 font-bold text-espresso">
            <CheckCircle className="w-4 h-4 text-ruby shrink-0" />
            <span>Serviceable: Tracked Doorstep Delivery Available</span>
          </div>
          <div className="text-[11px] text-espresso/80 pl-5.5">
            Estimated Transit Time: <strong className="text-espresso">{destination.days}</strong>
          </div>
          <div className="text-[10px] text-espresso/70 pl-5.5 pt-1 border-t border-rose/80 flex items-center gap-1">
            <Globe className="w-3 h-3 text-ruby" />
            <span>International card payments accepted for this destination.</span>
          </div>
        </div>
      )}
    </div>
  );
}
