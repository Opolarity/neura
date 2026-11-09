import { PROPERTY_HELP } from "../../lib/property-help";
import type { AppearanceProps } from "../../lib/style-props";
import type { PropSetter } from "../../lib/use-node-props";
import { PropertySection } from "../property-section";
import { ColorPropertyField } from "../settings-fields";

/** Fondo. */
export function AppearanceSection({
  props,
  set,
}: {
  props: AppearanceProps;
  set: PropSetter<AppearanceProps>;
}) {
  return (
    <PropertySection title="Apariencia">
      <ColorPropertyField
        label="Fondo"
        help={PROPERTY_HELP.background}
        value={props.background}
        onChange={(value) => set("background", value)}
      />
    </PropertySection>
  );
}
