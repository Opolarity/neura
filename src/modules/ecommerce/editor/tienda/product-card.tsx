import Image from "@/modules/ecommerce/editor/tienda/next-image";
import Link from "@/modules/ecommerce/editor/tienda/next-link";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatExhibitionDate, isOnExhibition } from "@/modules/ecommerce/editor/tienda/date";
import type { Product } from "@/modules/ecommerce/editor/tienda/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const discountPercent = product.salePrice
    ? Math.round(((product.salePrice - product.price) / product.salePrice) * 100)
    : null;

  // En exhibición el producto está en vitrina, no a la venta: tallas y precio se
  // siguen renderizando pero con opacity-0, y el botón solo lleva al detalle.
  //
  // Van invisibles en vez de no renderizarse porque la tarjeta es flex y su
  // imagen crece para llenar el hueco: quitarlos descuadraba el alto respecto a
  // las tarjetas normales de la misma grilla. Ocupando su espacio, todas miden
  // igual. Pasada la fecha de fin la tarjeta vuelve a la normalidad.
  const onExhibition = isOnExhibition(product.exhibitionEndDate);

  return (
    <Link href={`/producto/${product.id}`} className="group flex flex-col">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary h-full flex flex-col">
        {/* Promotional Banner */}
        {product.promotionalText && (
          <div
            className="absolute top-0 left-0 right-0 z-10 px-1 py-1 text-center text-xs font-bold tracking-wide"
            style={{
              backgroundColor: product.promotionalBgColor ?? "#000",
              color: product.promotionalTextColor ?? "#fff",
            }}
          >
            {product.promotionalText}
          </div>
        )}
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className={`object-cover transition-all duration-200 group-hover:scale-105 ${
            product.images[1] ? "group-hover:opacity-0" : ""
          }`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {product.images[1] && (
          <Image
            src={product.images[1]}
            alt={product.name}
            fill
            className="object-cover transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.isNew && (
            <Badge className="bg-primary text-primary-foreground border-0 text-[10px] font-bold tracking-wider">
              NUEVO
            </Badge>
          )}
          {product.isSale && product.salePrice && discountPercent && (
            <Badge className="bg-sale text-sale-foreground border-0 text-[10px] font-bold tracking-wider">
              -{discountPercent}%
            </Badge>
          )}
          {product.isPreSale && (
            <Badge className="bg-foreground text-background border-0 text-[10px] font-bold tracking-wider">
              PREVENTA
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-2 md:mt-3 flex flex-col items-center text-center gap-1 md:gap-1.5 w-full">
        <h3 className="text-xs md:text-sm lg:text-base font-medium text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors w-full">
          {product.name}
        </h3>

        {/* Sizes */}
        {product.groupTerms &&
          Object.keys(product.groupTerms).length > 0 ? (
          Object.entries(product.groupTerms).map(([key, terms]) => (
            <div
              key={key}
              aria-hidden={onExhibition}
              className={`flex items-center justify-center gap-1 flex-wrap w-medium ${onExhibition ? "opacity-0" : ""}`}
            >
              {terms.map((groupTerm) => {
                const isOutOfStock = (groupTerm.stock ?? 0) <= 0;
                return (
                  <button
                    key={groupTerm.name}
                    disabled={true}
                    className={`h-8 w-[30px] sm:w-[35px] md:w-[40px] rounded-md text-[10px] font-medium uppercase border flex items-center justify-center
                      ${
                        groupTerm.stock > 0
                          ? "border-primary/10 bg-primary/10 text-primary"
                          : ""
                      }
                      ${isOutOfStock ? "opacity-50 line-through" : ""}
                    `}
                  >
                    {groupTerm.name}
                  </button>
                );
              })}
            </div>
          ))
        ) : (
          <div className="">
            <button
              disabled={true}
              className="invisible border-primary/10 bg-primary/10 text-primary flex-1 h-8 min-w-[100px] rounded-md text-[10px] font-medium uppercase border"
            >
              Sin Variación
            </button>
          </div>
        )}

        {/* Price */}
        {onExhibition ? (
          // En exhibición no hay precio que mostrar: en su lugar va la fecha en que
          // el producto sale a la venta. La etiqueta va en el negro del precio sin
          // descuento y solo la fecha en el rojo del precio rebajado.
          //
          // Acá el bloque de precio ocupa una sola línea, así que el aviso lo
          // reemplaza sin descuadrar el alto de la tarjeta.
          <div className="flex items-center justify-center gap-2 w-full">
            <span className="text-sm lg:text-base font-semibold text-foreground">
              Disponible el{" "}
              <span className="text-red-500">
                {formatExhibitionDate(product.exhibitionEndDate)}
              </span>
            </span>
          </div>
        ) : (
        <div className="flex items-center justify-center gap-2 w-full">
          <span
            className={`text-sm lg:text-base font-bold ${product.salePrice ? "text-red-500" : "text-foreground"}`}
          >
            S/{(product.price ?? 0).toFixed(2)}
          </span>
          {product.salePrice && (
            <span className="text-[10px] md:text-xs lg:text-sm text-muted-foreground line-through">
              S/{product.salePrice.toFixed(2)}
            </span>
          )}
        </div>
        )}
        <div className="w-full">
          {onExhibition ? (
            // Sin `disabled` por stock: un producto en exhibición normalmente no
            // tiene unidades, y quedaría como "Agotado" sin poder abrirse.
            <button className="w-full flex items-center justify-center gap-2 h-9 md:h-10 rounded-lg text-xs md:text-sm font-semibold transition-colors bg-black text-primary-foreground hover:bg-black">
              Ver lanzamiento
            </button>
          ) : (
            <button
              disabled={product.stock === 0}
              className={`w-full flex items-center justify-center gap-2 h-9 md:h-10 rounded-lg text-xs md:text-sm font-semibold transition-colors ${
                product.stock === 0
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-black text-primary-foreground hover:bg-black"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              {product.stock === 0 ? "Agotado" : "Comprar"}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
