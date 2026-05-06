import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, ArrowRight, CheckCircle, ChevronDown, Loader2, Pause, XCircle, RefreshCw, UserX, ShoppingCart, Zap } from "lucide-react";
import type { POSStep } from "../../types/POS.types";

interface POSWizardNavigationProps {
  currentStep: POSStep;
  canProceedNext: boolean;
  canFinalize: boolean;
  saving: boolean;
  onNext: () => void;
  onBack: () => void;
  onFinalize: () => void;
  onReset: () => void;
  onPause?: () => void;
  onCancel?: () => void;
  onAnonymousPurchase?: () => void;
  onNewSale?: () => void;
  onQuickEmission?: (typeCode: string) => void;
}

export default function POSWizardNavigation({
  currentStep,
  canProceedNext,
  canFinalize,
  saving,
  onNext,
  onBack,
  onFinalize,
  onReset,
  onPause,
  onCancel,
  onAnonymousPurchase,
  onNewSale,
  onQuickEmission,
}: POSWizardNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isPaymentStep = currentStep === 5;
  const isInvoicingStep = currentStep === 6;

  return (
    <footer className="bg-white border-t px-6 py-4 shrink-0">
      <div className="flex items-center justify-between">
        {/* Left side - Back button and info */}
        <div className="flex items-center gap-4">
          {!isFirstStep && !isInvoicingStep && (
            <Button
              variant="outline"
              onClick={onBack}
              className="gap-2"
              disabled={saving}
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          )}
          {!isInvoicingStep && (
            <Button
              variant="ghost"
              onClick={onReset}
              className="gap-2"
              disabled={saving}
            >
              <RefreshCw className="w-4 h-4" />
              Restablecer
            </Button>
          )}
          {isPaymentStep && onQuickEmission && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!canFinalize || saving}
                  className="gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Emisión Rápida
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onQuickEmission("INV")}>
                  Comprobante
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onQuickEmission("2")}>
                  Boleta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onQuickEmission("1")}>
                  Factura
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Center - Status info */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {/* Could add session info here */}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-3">
          {onAnonymousPurchase && (
            <Button
              variant="outline"
              onClick={onAnonymousPurchase}
              disabled={saving}
              className="gap-2"
            >
              <UserX className="w-4 h-4" />
              Venta Anónima
            </Button>
          )}

          {onPause && (
            <Button
              variant="outline"
              onClick={onPause}
              disabled={saving}
              className="gap-2"
            >
              <Pause className="w-4 h-4" />
              Pausar Venta
            </Button>
          )}

          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={saving}
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4" />
              Anular Proceso
            </Button>
          )}

          {isInvoicingStep ? (
            <Button
              onClick={onNewSale}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <ShoppingCart className="w-4 h-4" />
              Nueva Venta
            </Button>
          ) : isPaymentStep ? (
            <Button
              onClick={onFinalize}
              disabled={!canFinalize || saving}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Completar Venta
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!canProceedNext || saving}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {currentStep === 1 ? "Comenzar Venta" : "Continuar Venta"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
}
