import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { backendApi } from '../services/api';
import { useAuth } from './AuthContext';
import type { House } from '../types/domain';

type HouseInput = {
  name: string;
  description: string;
};

type HouseContextType = {
  houses: House[];
  housesLoading: boolean;
  refreshHouses: () => Promise<void>;
  createHouse: (payload: HouseInput) => Promise<void>;
  updateHouse: (houseId: string, payload: HouseInput) => Promise<void>;
  deleteHouse: (houseId: string) => Promise<void>;
};

const HouseContext = createContext<HouseContextType | null>(null);

export function HouseProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [houses, setHouses] = useState<House[]>([]);
  const [housesLoading, setHousesLoading] = useState(false);

  const refreshHouses = useCallback(async () => {
    setHousesLoading(true);
    try {
      const data = await backendApi.getHouses();
      setHouses(data);
    } catch {
      setHouses([]);
    } finally {
      setHousesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshHouses();
    } else {
      setHouses([]);
    }
  }, [isAuthenticated, refreshHouses]);

  const createHouse = useCallback(async ({ name, description }: HouseInput) => {
    if (!name.trim()) {
      throw new Error('House name is required.');
    }

    await backendApi.createHouse({
      name: name.trim(),
      description: description.trim() || undefined,
    });
    await refreshHouses();
  }, [refreshHouses]);

  const updateHouse = useCallback(async (houseId: string, payload: HouseInput) => {
    await backendApi.updateHouse({
      house_id: houseId,
      name: payload.name.trim(),
      description: payload.description.trim(),
    });
    await refreshHouses();
  }, [refreshHouses]);

  const deleteHouse = useCallback(async (houseId: string) => {
    await backendApi.deleteHouse(houseId);
    await refreshHouses();
  }, [refreshHouses]);

  const value = useMemo<HouseContextType>(
    () => ({
      houses,
      housesLoading,
      refreshHouses,
      createHouse,
      updateHouse,
      deleteHouse,
    }),
    [houses, housesLoading, refreshHouses, createHouse, updateHouse, deleteHouse],
  );

  return <HouseContext.Provider value={value}>{children}</HouseContext.Provider>;
}

export function useHouseStore() {
  const context = useContext(HouseContext);
  if (!context) {
    throw new Error('useHouseStore must be used inside HouseProvider');
  }

  return context;
}
