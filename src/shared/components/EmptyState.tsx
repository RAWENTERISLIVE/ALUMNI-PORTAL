
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
    <div className={`flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed h-[300px] bg-muted/30 ${className}`}>
      {icon && <div className="mb-6 text-foreground">{icon}</div>}
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      <p className="text-muted-foreground mt-3 mb-6 max-w-md">{description}</p>
      {action && (
        <Button 
          onClick={action.onClick}
          className="bg-primary hover:bg-primary/90 text-white rounded-lg transform hover:scale-105 hover:shadow-lg transition-all duration-300"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
