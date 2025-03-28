import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ 
  text = "Cargando...", 
  size = "md", 
  className = "" 
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  const textSizeMap = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeMap[size]}`} />
      {text && <p className={`${textSizeMap[size]} font-medium text-gray-700 dark:text-gray-300`}>{text}</p>}
    </div>
  );
} 