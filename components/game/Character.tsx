'use client';

export type CharacterProps = {
  walking: boolean;
  facing: 'left' | 'right';
  /** Balloon / heart fill color. Defaults to the original red. */
  balloonColor?: string;
  /** Scale relative to the native 500×240 ch-wrapper. Defaults to 0.34 (player size). */
  scale?: number;
};

export default function Character({
  walking,
  facing,
  balloonColor = '#ef4023',
  scale = 0.34,
}: CharacterProps) {
  return (
    <div style={{
      transform: `translateX(-50%) scaleX(${facing === 'left' ? -1 : 1})`,
      transformOrigin: 'center bottom',
      transition: 'transform 0.1s ease',
    }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'bottom center' }}>
        <div className={`ch-wrapper${walking ? ' ch-walking' : ''}`}>
          <div className="ch-animal">
            <div className="ch-ballons">
              {/* Inline style overrides the .ch-heart span { background } rule */}
              <div className="ch-heart">
                <span style={{ background: balloonColor }} />
                <span style={{ background: balloonColor }} />
              </div>
            </div>
            <div className="ch-ears" />
            <div className="ch-body">
              <div className="ch-eyes" />
              <div className="ch-nose"><span /><span /></div>
              <div className="ch-hands">
                <div className="ch-left-hand"><span /><span /></div>
                <div className="ch-right-hand"><span /><span /></div>
              </div>
            </div>
            <div className="ch-legs"><span /><span /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
