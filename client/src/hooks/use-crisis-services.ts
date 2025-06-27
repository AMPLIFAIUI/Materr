import { useEffect, useState } from "react";

export interface CrisisService {
  id: number;
  name: string;
  phone: string;
  country: string;
  region: string[];
  serviceType: string;
  isAvailable24h: boolean;
  operatingHours?: string;
  description: string;
  website?: string;
  languages?: string[];
  specializations?: string[];
}

export function useCrisisServices(region: string) {
  const [services, setServices] = useState<CrisisService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/data/crisis_services.json")
      .then((res) => res.json())
      .then((data: CrisisService[]) => {
        // Filter by region (region array contains selected region or 'National')
        setServices(
          data.filter((service) =>
            service.region.includes(region) || service.region.includes("National")
          )
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [region]);

  return { services, loading };
}
