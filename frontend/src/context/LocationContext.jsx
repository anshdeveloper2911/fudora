import { createContext, useContext, useEffect, useState } from "react";

const LocationCtx = createContext(null);
export const useLocation = () => useContext(LocationCtx);

const KEY = "fudora_location_v1";
const DEFAULT_LOC = {
  formatted: "Sasaram, Bihar, India",
  area: "Sasaram",
  city: "Sasaram",
  state: "Bihar",
  pincode: "821115",
  lat: null,
  lng: null,
  source: "default",
};

function loadLoc() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_LOC;
    const parsed = JSON.parse(raw);
    return parsed && parsed.city ? parsed : DEFAULT_LOC;
  } catch { return DEFAULT_LOC; }
}

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(loadLoc);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(location));
  }, [location]);

  const setLocation = (loc) => setLocationState({ ...DEFAULT_LOC, ...loc });
  const clearLocation = () => setLocationState(DEFAULT_LOC);

  return (
    <LocationCtx.Provider value={{ location, setLocation, clearLocation }}>
      {children}
    </LocationCtx.Provider>
  );
}
