/**
 * CoverHeader — эстетичная адаптивная обложка страницы в стиле Zen Browser.
 * Использует публичные шедевры живописи.
 */

const COVERS = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg/800px-Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/800px-1665_Girl_with_a_Pearl_Earring.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Great_Wave_off_Kanagawa2.jpg/1024px-Great_Wave_off_Kanagawa2.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/1024px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Aivazovsky_-_The_Ninth_Wave.jpg/1024px-Aivazovsky_-_The_Ninth_Wave.jpg',
]

export function getCoverForPage(seed = 0) {
  const num = typeof seed === 'number' ? seed : String(seed).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return COVERS[Math.abs(num) % COVERS.length]
}

export default function CoverHeader({ seed = 0, title = '', subtitle = '' }) {
  const url = getCoverForPage(seed)

  return (
    <div className="w-full bg-th-bg text-th-text shrink-0">
      {/* Картина */}
      <div
        className="w-full h-28 sm:h-36 md:h-44 bg-center bg-cover relative overflow-hidden transition-all"
        style={{ backgroundImage: `url(${url})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40" />
      </div>

      {/* Заголовок под обложкой */}
      {(title || subtitle) && (
        <div className="px-4 sm:px-8 md:px-12 pt-4 sm:pt-6 pb-2">
          {title && (
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-th-text tracking-tight leading-tight">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-1 text-xs sm:text-sm text-th-muted">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  )
}
