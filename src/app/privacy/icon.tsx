import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'black',
          borderRadius: '4px',
        }}
      >
        <svg
            width="80%"
            height="80%"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(262 84% 60%)" />
                    <stop offset="100%" stopColor="hsl(289 84% 65%)" />
                </linearGradient>
            </defs>
            <path d="
                M 31 30 
                H 69 
                C 72.3137 30 75 32.6863 75 36 
                V 41 
                H 25 
                V 36 
                C 25 32.6863 27.6863 30 31 30 Z

                M 25 47
                V 69
                C 25 72.3137 27.6863 75 31 75
                H 69
                C 72.3137 75 75 72.3137 75 69
                V 47
                H 60 L 48 62 L 40 54 H 25 Z
            " fill="url(#logoGradient)" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
