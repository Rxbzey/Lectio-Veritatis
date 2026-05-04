import { forwardRef } from 'react';

interface ShareImageTemplateProps {
  bookName: string;
  chapter: number;
  verses: { number: number; text: string }[];
  rangeStart: number;
  rangeEnd: number;
  url: string;
}

export const ShareImageTemplate = forwardRef<HTMLDivElement, ShareImageTemplateProps>(
  function ShareImageTemplate({ bookName, chapter, verses, rangeStart, rangeEnd, url }, ref) {
    const isSingle = rangeStart === rangeEnd;
    const rangeLabel = isSingle ? `Versículo ${rangeStart}` : `Versículos ${rangeStart}–${rangeEnd}`;

    return (
      <div
        ref={ref}
        style={{
          width: '1080px',
          minHeight: '1080px',
          padding: '96px 88px',
          background:
            'radial-gradient(ellipse at top, #1a1710 0%, #0a0908 50%, #000000 100%)',
          color: '#ece7db',
          fontFamily: 'Inter, system-ui, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: '640px',
            color: 'rgba(201,168,76,0.05)',
            fontWeight: 700,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {chapter}
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '48px',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '1px',
                background: 'rgba(201,168,76,0.4)',
              }}
            />
            <span
              style={{
                fontSize: '13px',
                letterSpacing: '0.5em',
                textTransform: 'uppercase',
                color: 'rgba(201,168,76,0.7)',
                fontWeight: 500,
              }}
            >
              Lectio Veritatis
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '76px',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: '#ece7db',
              marginBottom: '16px',
              fontWeight: 400,
            }}
          >
            {bookName}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '20px',
              marginBottom: '64px',
            }}
          >
            <span
              style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: '28px',
                color: 'rgba(201,168,76,0.85)',
                fontStyle: 'italic',
              }}
            >
              Capítulo {chapter}
            </span>
            <span style={{ color: 'rgba(201,168,76,0.3)' }}>·</span>
            <span
              style={{
                fontSize: '14px',
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                color: 'rgba(201,168,76,0.65)',
              }}
            >
              {rangeLabel}
            </span>
          </div>

          <div
            style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '34px',
              lineHeight: 1.55,
              color: '#ece7db',
              letterSpacing: '0.005em',
            }}
          >
            {verses.map((v, i) => (
              <span key={v.number}>
                <sup
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '15px',
                    color: 'rgba(201,168,76,0.7)',
                    marginRight: '6px',
                    verticalAlign: 'super',
                  }}
                >
                  {v.number}
                </sup>
                {v.text}
                {i < verses.length - 1 ? ' ' : ''}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: '72px',
            paddingTop: '32px',
            borderTop: '1px solid rgba(201,168,76,0.18)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: 'rgba(212,207,197,0.4)',
            }}
          >
            Biblia Latinoamericana
          </span>
          <span
            style={{
              fontSize: '13px',
              color: 'rgba(201,168,76,0.6)',
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: '0.02em',
            }}
          >
            {url}
          </span>
        </div>
      </div>
    );
  },
);
