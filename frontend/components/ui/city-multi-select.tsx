'use client';

import { useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { City } from '@/lib/api-client';

interface CityMultiSelectProps {
  cities: City[];
  selectedCityIds: string[];
  onChange: (cityIds: string[]) => void;
  placeholder?: string;
}

export function CityMultiSelect({
  cities,
  selectedCityIds,
  onChange,
  placeholder = 'İl adı yazarak arayın...',
}: CityMultiSelectProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const cityById = useMemo(() => new Map(cities.map((city) => [city.id, city])), [cities]);
  const selectedCities = selectedCityIds
    .map((id) => cityById.get(id))
    .filter((city): city is City => city !== undefined);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const normalized = query.trim().toLocaleLowerCase('tr-TR');
    return cities
      .filter(
        (city) =>
          !selectedCityIds.includes(city.id) &&
          city.name.toLocaleLowerCase('tr-TR').includes(normalized),
      )
      .slice(0, 8);
  }, [cities, query, selectedCityIds]);

  const selectCity = (cityId: string) => {
    onChange([...selectedCityIds, cityId]);
    setQuery('');
    setIsOpen(false);
  };

  const removeCity = (cityId: string) => {
    onChange(selectedCityIds.filter((id) => id !== cityId));
  };

  return (
    <div ref={containerRef} className="relative">
      {selectedCities.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedCities.map((city) => (
            <span
              key={city.id}
              className="flex items-center gap-1.5 rounded-full bg-brand-50 py-1 pl-3 pr-1.5 text-sm font-medium text-brand-700"
            >
              {city.name}
              <button
                type="button"
                onClick={() => removeCity(city.id)}
                className="flex h-5 w-5 items-center justify-center rounded-full text-brand-500 hover:bg-brand-100 hover:text-brand-700"
                aria-label={`${city.name} tercihini kaldır`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />

      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-card">
          {suggestions.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-slate-400">Eşleşen il bulunamadı.</p>
          ) : (
            suggestions.map((city) => (
              <button
                key={city.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectCity(city.id)}
                className={cn(
                  'block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700',
                )}
              >
                {city.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
