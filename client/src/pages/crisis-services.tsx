import { useCrisisServices } from "@/hooks/use-crisis-services";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CrisisServicesPage() {
  const [region, setRegion] = useState("NSW"); // Default region, can be user-selected
  const { services, loading } = useCrisisServices(region);

  const regions = [
    "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 shadow-xl min-h-screen relative">
        <header className="bg-primary dark:bg-gray-800 text-white p-4 shadow-lg sticky top-0 z-10">
          <h1 className="text-xl font-semibold">Crisis Services</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {regions.map((r) => (
              <Button
                key={r}
                variant={region === r ? "default" : "outline"}
                onClick={() => setRegion(r)}
                className="text-xs px-3 py-1"
              >
                {r}
              </Button>
            ))}
          </div>
        </header>
        <div className="p-6">
          {loading ? (
            <div>Loading crisis services...</div>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.id} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h2 className="font-bold text-lg text-blue-800 dark:text-blue-200">{service.name}</h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-1">{service.description}</p>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Phone: <a href={`tel:${service.phone}`}>{service.phone}</a></div>
                  {service.website && (
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <a href={service.website} target="_blank" rel="noopener noreferrer">Website</a>
                    </div>
                  )}
                  <div className="text-xs mt-2 text-gray-500">Region: {service.region.join(", ")}</div>
                </div>
              ))}
              {services.length === 0 && <div>No crisis services found for this region.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
