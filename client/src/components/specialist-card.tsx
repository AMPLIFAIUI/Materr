import { ChevronRight } from "lucide-react";
import { getColorClasses, type Specialist } from "@/lib/specialists";

interface SpecialistCardProps {
  specialist: Specialist;
  onClick: (specialist: Specialist) => void;
}

export function SpecialistCard({ specialist, onClick }: SpecialistCardProps) {
  const colors = getColorClasses(specialist.color);

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer hover:border-primary"
      onClick={() => onClick(specialist)}
    >
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 ${colors.bg} rounded-full flex items-center justify-center`}>
          <i className={`${specialist.icon} ${colors.text} text-xl`}></i>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-secondary">{specialist.specialty}</h3>
          <p className="text-sm text-gray-600">{specialist.description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
}
