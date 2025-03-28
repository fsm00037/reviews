import { AlertCircle, XCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { APIError } from "@/lib/types";

interface ApiErrorAlertProps {
  error: APIError | null;
  onDismiss?: () => void;
}

export function ApiErrorAlert({ error, onDismiss }: ApiErrorAlertProps) {
  if (!error) return null;

  return (
    <Alert variant="destructive" className="mb-4 animate-in fade-in duration-300 relative">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="ml-2">Error {error.status > 0 ? `(${error.status})` : ''}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="font-medium">{error.message}</p>
        {error.details && (
          <p className="text-sm opacity-90 mt-1">{error.details}</p>
        )}
      </AlertDescription>
      {onDismiss && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 h-6 w-6 rounded-full" 
          onClick={onDismiss}
        >
          <XCircle className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </Button>
      )}
    </Alert>
  );
} 