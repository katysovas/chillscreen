export function MicrophoneAccessory({ color = '#2c3e50' }: { color?: string }) {
  return (
    <div className="ch-mic">
      <div className="ch-mic-head" style={{ ['--mic-color' as string]: color }} />
      <div className="ch-mic-grille" />
      <div className="ch-mic-handle" />
    </div>
  );
}
