import { useMemo } from "react";
import { Editor, Frame } from "@craftjs/core";
import { useQuery } from "@tanstack/react-query";
import { loadPage } from "@/modules/ecommerce/editor/lib/editor-store";
import { assertResolverCompleto } from "@/modules/ecommerce/editor/lib/craft-resolver-check";
import { EditableImage } from "@/modules/ecommerce/editor/components/user-components/editable-image";
import { EditableHero } from "@/modules/ecommerce/editor/components/user-components/editable-hero";
import { EditableCarousel } from "@/modules/ecommerce/editor/components/user-components/editable-carousel";
import { EditableContainer } from "@/modules/ecommerce/editor/components/user-components/editable-container";
import { EditableCardCarousel } from "@/modules/ecommerce/editor/components/user-components/editable-card-carousel";
import { EditableButton } from "@/modules/ecommerce/editor/components/user-components/editable-button";
import { EditableIcon } from "@/modules/ecommerce/editor/components/user-components/editable-icon";
import { EditableVideo } from "@/modules/ecommerce/editor/components/user-components/editable-video";
import { EditablePromotionalText } from "@/modules/ecommerce/editor/components/user-components/editable-promotional-text";
import { EditableImageCarousel } from "@/modules/ecommerce/editor/components/user-components/editable-image-carousel";
import { EditableProductGrid } from "@/modules/ecommerce/editor/components/user-components/editable-product-grid";
import { EditableProductCarousel } from "@/modules/ecommerce/editor/components/user-components/editable-product-carousel";
import { EditableCategoryGrid } from "@/modules/ecommerce/editor/components/user-components/editable-category-grid";
import { EditableBenefits } from "@/modules/ecommerce/editor/components/user-components/editable-benefits";
import { EditableTestimonials } from "@/modules/ecommerce/editor/components/user-components/editable-testimonials";
import { EditableFAQ } from "@/modules/ecommerce/editor/components/user-components/editable-faq";
import { EditableMegaMenu } from "@/modules/ecommerce/editor/components/user-components/editable-mega-menu";
import { EditableRichText } from "@/modules/ecommerce/editor/components/user-components/editable-rich-text";
import { EditableNestedLinks } from "@/modules/ecommerce/editor/components/user-components/editable-nested-links";
import { EditableDropdownButton } from "@/modules/ecommerce/editor/components/user-components/editable-dropdown-button";
import { EditableHoverableDropdown } from "@/modules/ecommerce/editor/components/user-components/editable-hoverable-dropdown";
import { EditableProductPopover } from "@/modules/ecommerce/editor/components/user-components/editable-product-popover";
import { EditableCart } from "@/modules/ecommerce/editor/components/user-components/editable-cart";
import EditableAccount from "@/modules/ecommerce/editor/components/user-components/editable-account";
import { EditableSearch } from "@/modules/ecommerce/editor/components/user-components/editable-search";
import { EditableGoogleReviews } from "@/modules/ecommerce/editor/components/user-components/editable-google-reviews";
import { EditableCategoryCarousel } from "@/modules/ecommerce/editor/components/user-components/editable-category-carousel";
import { EditableContainerCarousel } from "@/modules/ecommerce/editor/components/user-components/editable-container-carousel";

const resolver = {
  EditableImage,
  EditableHero,
  EditableCarousel,
  EditableContainer,
  EditableCardCarousel,
  EditableButton,
  EditableIcon,
  EditableVideo,
  EditablePromotionalText,
  EditableImageCarousel,
  EditableProductGrid,
  EditableProductCarousel,
  EditableCategoryGrid,
  EditableBenefits,
  EditableTestimonials,
  EditableFAQ,
  EditableMegaMenu,
  EditableRichText,
  EditableNestedLinks,
  EditableDropdownButton,
  EditableHoverableDropdown,
  EditableProductPopover,
  EditableCart,
  EditableAccount,
  EditableSearch,
  EditableGoogleReviews,
  EditableCategoryCarousel,
  EditableContainerCarousel,
};

interface BlockRendererProps {
  slug: string;
  fallback?: React.ReactNode;
}

export function BlockRenderer({ slug, fallback = null }: BlockRendererProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["mobile-menu", slug],
    queryFn: () => loadPage(slug),
    staleTime: 5 * 60 * 1000,
  });

  const json = data?.content_json ?? null;

  // Ver lib/craft-resolver-check.ts: nombra el bloque que falta en vez de
  // dejar que craft.js muera con un TypeError anonimo.
  useMemo(() => {
    assertResolverCompleto(
      json,
      resolver,
      `bloque "${slug}" (components/editor/block-renderer.tsx)`
    );
  }, [json, slug]);

  if (isLoading || !json) return <>{fallback}</>;

  return (
    <Editor resolver={resolver} enabled={false}>
      <Frame json={json} />
    </Editor>
  );
}
