
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({
  title,
  description,
  icon,
  action,
  className = ""
}: EmptyStateProps) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed h-[300px] bg-gray-50 ${className}`}>
      {icon && <div className="mb-6 text-orange-500">{icon}</div>}
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      <p className="text-gray-600 mt-3 mb-6 max-w-md">{description}</p>
      {action && (
        <Button 
          onClick={action.onClick}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg transform hover:scale-105 hover:shadow-lg transition-all duration-300"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
