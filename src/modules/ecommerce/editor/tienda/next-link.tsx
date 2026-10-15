// Sustituto de `next/link` para los bloques del editor. Pinta el mismo <a>, pero
// no navega: los enlaces de un bloque apuntan a rutas de la tienda
// (/categoria/..., /p/...) y en el canvas del ERP un clic tiene que seleccionar
// el bloque, no sacar al usuario del editor.
import { forwardRef, type AnchorHTMLAttributes } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string };
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
};

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    href,
    prefetch: _prefetch,
    replace: _replace,
    scroll: _scroll,
    shallow: _shallow,
    passHref: _passHref,
    legacyBehavior: _legacyBehavior,
    onClick,
    ...rest
  },
  ref,
) {
  return (
    <a
      ref={ref}
      href={typeof href === "string" ? href : href.pathname}
      onClick={(evento) => {
        onClick?.(evento);
        evento.preventDefault();
      }}
      {...rest}
    />
  );
});

export default Link;
