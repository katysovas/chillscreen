export function LightsaberAccessory({
  bladeColor = '#FFE566',
  hiltColor = '#5a5a62',
}: {
  bladeColor?: string;
  hiltColor?: string;
}) {
  return (
    <div className="ch-saber">
      <div
        className="ch-saber-blade"
        style={{ ['--saber-blade' as string]: bladeColor }}
      />
      <div className="ch-saber-hilt" style={{ background: hiltColor }} />
      <div className="ch-saber-guard" />
      <div className="ch-saber-glow" style={{ background: bladeColor }} />
    </div>
  );
}
