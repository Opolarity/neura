import { BORDER_LINE_OPTIONS, type BorderProps } from "../../lib/style-props";
import type { PropSetter } from "../../lib/use-node-props";
import { PROPERTY_HELP } from "../../lib/property-help";
import { numberRule } from "../../lib/validators";
import { PropertySection } from "../property-section";
import { ColorPropertyField, SelectField } from "../settings-fields";
import { MultiValueField } from "../multi-value-field";
import { CORNERS, SIDES } from "../multi-value-items";

/** 0 o más; vacío = 0 (lado sin borde, esquina recta). */
const validateMm = numberRule({ min: 0, empty: 0 });

/**
 * El grosor de cada lado, el estilo de la línea, el color y las esquinas
 * redondeadas, uno debajo del otro. El
 * grosor va primero y sin etiqueta: en la sección Borde se sobreentiende.
 */
export function BorderSection({
  props,
  set,
}: {
  props: BorderProps;
  set: PropSetter<BorderProps>;
}) {
  return (
    <PropertySection title="Borde">
      <MultiValueField
        label="Grosor del borde"
        hideLabel
        {...SIDES}
        value={props.borderWidth}
        validate={validateMm}
        onChange={(value) => set("borderWidth", value)}
      />
      <SelectField
        label="Estilo"
        help={PROPERTY_HELP.borderLineStyle}
        value={props.borderLineStyle}
        options={BORDER_LINE_OPTIONS}
        onChange={(value) => set("borderLineStyle", value)}
      />
      <ColorPropertyField
        label="Color"
        help={PROPERTY_HELP.borderColor}
        value={props.borderColor}
        onChange={(value) => set("borderColor", value)}
      />
      <MultiValueField
        label="Esquinas redondeadas"
        help={PROPERTY_HELP.borderRadius}
        {...CORNERS}
        value={props.borderRadius}
        validate={validateMm}
        onChange={(value) => set("borderRadius", value)}
      />
    </PropertySection>
  );
}
