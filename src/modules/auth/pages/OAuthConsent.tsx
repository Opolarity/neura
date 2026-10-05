import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SplashPage from "@/shared/components/splash/SplashPage";
import LoaderContent from "@/shared/components/loader/LoaderContent";
import { useAuth } from "../hooks/useAuth";
import { useOAuthConsent } from "../hooks/useOAuthConsent";
import { loginUrlWithNext } from "../utils/safeNext";

// Pantalla de consentimiento OAuth. Supabase Auth manda aquí al usuario
// (GOTRUE_OAUTH_SERVER_AUTHORIZATION_PATH) cuando una app como Claude pide
// acceso a su cuenta del ERP a través del MCP de ventas (neura-mcp).
const OAuthConsent = () => {
  const { user, loading, signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const authorizationId = searchParams.get("authorization_id");
  const here = `${location.pathname}${location.search}`;

  const { status, details, error, approve, deny } = useOAuthConsent(
    authorizationId,
    !loading && !!user
  );

  if (loading) return <SplashPage />;
  if (!user) return <Navigate to={loginUrlWithNext(here)} replace />;

  const switchAccount = async () => {
    await signOut();
    navigate(loginUrlWithNext(here), { replace: true });
  };

  const clientName = details?.client.name || "Una aplicación";
  const busy = status === "submitting" || status === "redirecting";

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center">
            <img src="/logo-neura-color.png" alt="Neura" className="h-8 w-auto" />
          </div>

          {status === "error" && (
            <div className="mt-8 space-y-5">
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
                {error}
              </div>
              <Button variant="outline" className="h-11 w-full" onClick={() => navigate("/")}>
                Ir al ERP
              </Button>
            </div>
          )}

          {(status === "loading" || status === "redirecting") && (
            <div className="mt-8 py-6">
              <LoaderContent
                message={status === "loading" ? "Cargando solicitud..." : "Volviendo a la aplicación..."}
              />
            </div>
          )}

          {(status === "ready" || status === "submitting") && details && (
            <>
              <div className="mt-6 text-center">
                <h1 className="text-xl font-bold text-foreground">
                  {clientName} quiere acceder a tu cuenta
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">{details.user.email}</p>
              </div>

              <ul className="mt-8 space-y-4 text-sm">
                <li className="flex gap-3">
                  <Eye className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <span className="font-semibold">Consultar tus ventas:</span> resúmenes,
                    ventas por sucursal, canal o método de pago, listados y detalle de cada
                    venta.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <span className="font-semibold">Solo lectura:</span> no podrá crear,
                    editar ni eliminar nada.
                  </span>
                </li>
                <li className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Verá lo mismo que tu rol puede ver en el ERP, y solo de tu empresa.
                  </span>
                </li>
              </ul>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-11" disabled={busy} onClick={deny}>
                  Rechazar
                </Button>
                <Button className="h-11 font-semibold" disabled={busy} onClick={approve}>
                  {status === "submitting" ? "Procesando..." : "Permitir"}
                </Button>
              </div>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                ¿No eres tú?{" "}
                <button
                  type="button"
                  className="font-semibold text-foreground hover:underline"
                  disabled={busy}
                  onClick={switchAccount}
                >
                  Cambiar de cuenta
                </button>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthConsent;
