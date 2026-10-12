import { useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SplashPage from "@/shared/components/splash/SplashPage";
import LoaderContent from "@/shared/components/loader/LoaderContent";
import { useAuth } from "../hooks/useAuth";
import { useOAuthConsent } from "../hooks/useOAuthConsent";
import { loginUrlWithNext } from "../utils/safeNext";

// Marca en la URL de vuelta del login: el usuario acaba de elegir su cuenta,
// así que no hace falta volver a confirmarla.
const ACCOUNT_CHOSEN = "cuenta";

// Pantalla de consentimiento OAuth. Supabase Auth manda aquí al usuario
// (GOTRUE_OAUTH_SERVER_AUTHORIZATION_PATH) cuando una app como Claude o ChatGPT
// pide acceso a su cuenta del ERP a través del MCP de ventas (neura-mcp).
//
// Auth asocia la solicitud al primer usuario que lee su detalle y no la cambia.
// Por eso, si el navegador ya tenía una sesión abierta, primero se confirma
// esa cuenta y solo después se lee la solicitud: "Usar otra cuenta" cierra la
// sesión antes de que quede asociada a la equivocada.
const OAuthConsent = () => {
  const { user, loading, signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const authorizationId = searchParams.get("authorization_id");
  const [accountConfirmed, setAccountConfirmed] = useState(searchParams.get(ACCOUNT_CHOSEN) === "1");

  const chosenUrl = () => {
    const params = new URLSearchParams(location.search);
    params.set(ACCOUNT_CHOSEN, "1");
    return `${location.pathname}?${params.toString()}`;
  };

  const { status, details, error, approve, deny } = useOAuthConsent(
    authorizationId,
    !loading && !!user && accountConfirmed
  );

  if (loading) return <SplashPage />;
  // Sin sesión: el login elige la cuenta, la vuelta ya llega confirmada.
  if (!user) return <Navigate to={loginUrlWithNext(chosenUrl())} replace />;

  const switchAccount = async () => {
    await signOut();
    navigate(loginUrlWithNext(chosenUrl()), { replace: true });
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

          {!accountConfirmed && (
            <>
              <div className="mt-6 text-center">
                <h1 className="text-xl font-bold text-foreground">¿Con qué cuenta quieres conectar?</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Una aplicación (Claude o ChatGPT) quiere consultar tus ventas. Vas a conectar con:
                </p>
                <p className="mt-3 text-base font-semibold text-foreground break-all">{user.email}</p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-11" onClick={switchAccount}>
                  Usar otra cuenta
                </Button>
                <Button className="h-11 font-semibold" onClick={() => setAccountConfirmed(true)}>
                  Continuar
                </Button>
              </div>
            </>
          )}

          {accountConfirmed && status === "error" && (
            <div className="mt-8 space-y-5">
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
                {error}
              </div>
              <Button variant="outline" className="h-11 w-full" onClick={() => navigate("/")}>
                Ir al ERP
              </Button>
            </div>
          )}

          {accountConfirmed && (status === "loading" || status === "redirecting") && (
            <div className="mt-8 py-6">
              <LoaderContent
                message={status === "loading" ? "Cargando solicitud..." : "Volviendo a la aplicación..."}
              />
            </div>
          )}

          {accountConfirmed && (status === "ready" || status === "submitting") && details && (
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthConsent;
