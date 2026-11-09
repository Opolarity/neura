import type { SpacingProps } from "../../lib/style-props";
import type { PropSetter } from "../../lib/use-node-props";
import { PROPERTY_HELP } from "../../lib/property-help";
import { numberRule } from "../../lib/validators";
import { PropertySection } from "../property-section";
import { MultiValueField } from "../multi-value-field";
import { SIDES } from "../multi-value-items";

/** Cada lado: 0 o más; vacío = 0. */
const validateSide = numberRule({ min: 0, empty: 0 });

/** Margen interior y exterior. La Hoja no tiene exterior: es el papel. */
export function SpacingSection({
  props,
  set,
  showMargin = true,
}: {
  props: SpacingProps;
  set: PropSetter<SpacingProps>;
  showMargin?: boolean;
}) {
  return (
    <PropertySection title="Espaciado">
      <MultiValueField
        label="Margen Interior"
        help={PROPERTY_HELP.padding}
        {...SIDES}
        value={props.padding}
        validate={validateSide}
        onChange={(value) => set("padding", value)}
      />
      {showMargin && (
        <MultiValueField
          label="Margen Exterior"
          help={PROPERTY_HELP.margin}
          {...SIDES}
          value={props.margin}
          validate={validateSide}
          onChange={(value) => set("margin", value)}
        />
      )}
    </PropertySection>
  );
}
