// KU-041 · Avatares ilustrados para la foto del cliente (cuando no se toma o no se carga una foto).
// Hombres y mujeres con distintos tonos de piel, peinados, color de pelo, barba y gafas.
// Se dibujan en SVG y, al elegir uno, se convierten a JPEG igual que una foto cargada.
import React, { useMemo, useState } from 'react'
import { Modal } from './ui'

const SKIN = { s1: ['#F6D7C3', '#E8BFA6'], s2: ['#EBC2A0', '#D9A982'], s3: ['#D6A27A', '#C28A62'], s4: ['#B57B53', '#9E6643'], s5: ['#8D5A3B', '#764830'], s6: ['#5E3B27', '#4C2F1F'] }
const BG = ['#E6DAC6', '#D7E6F2', '#DDEBD9', '#F3DDE3', '#E4DFF2', '#F4E4C8', '#D9ECEA', '#EEE3D9']
const SHIRT = ['#4A9FD8', '#3F8F6B', '#C8553D', '#7A5CB8', '#2F3A4A', '#D89A2B', '#B8477A', '#5E7C8C']

// Pelo que va detrás de la cabeza (largo o recogido).
const hairBack = (style, c) => {
  if (style === 'long') return <path d="M58 88 C54 46 78 30 100 30 C124 30 148 46 142 90 L148 150 C140 160 120 158 116 150 L84 150 C80 158 60 160 52 150 Z" fill={c} />
  if (style === 'longCurly') return <g fill={c}>{[[60, 70], [56, 96], [58, 122], [62, 146], [140, 70], [144, 96], [142, 122], [138, 146], [100, 32], [78, 40], [122, 40]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="18" />)}<rect x="56" y="60" width="88" height="90" /></g>
  if (style === 'braids') return <g fill={c}><path d="M60 86 C56 46 80 30 100 30 C122 30 146 46 140 88 Z" />{[0, 1, 2, 3].map((i) => <g key={i}><ellipse cx="62" cy={106 + i * 16} rx="8" ry="9" /><ellipse cx="138" cy={106 + i * 16} rx="8" ry="9" /></g>)}</g>
  if (style === 'bun') return <circle cx="100" cy="30" r="17" fill={c} />
  if (style === 'afro') return <g fill={c}>{[[64, 62], [76, 42], [100, 34], [124, 42], [136, 62], [142, 86], [58, 86]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="22" />)}</g>
  return null
}

// Pelo de adelante (sobre la frente).
const hairFront = (style, c) => {
  switch (style) {
    case 'short': return <path d="M63 84 C58 50 80 38 100 38 C124 38 144 50 137 84 C132 66 118 58 100 60 C84 60 70 66 63 84 Z" fill={c} />
    case 'side': return <path d="M63 86 C56 50 80 36 102 37 C126 38 145 52 137 86 C128 64 110 56 92 64 C80 68 70 74 63 86 Z" fill={c} />
    case 'buzz': return <path d="M65 78 C64 52 82 42 100 42 C120 42 137 52 135 78 C126 64 114 60 100 60 C86 60 74 64 65 78 Z" fill={c} opacity=".85" />
    case 'curly': return <g fill={c}>{[[70, 62], [82, 50], [96, 45], [110, 46], [124, 52], [133, 64], [64, 76], [136, 78]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="11" />)}</g>
    case 'afro': return <path d="M64 82 C64 62 80 54 100 54 C120 54 136 62 136 82 C126 70 114 66 100 66 C86 66 74 70 64 82 Z" fill={c} />
    case 'long': case 'braids': case 'bun': return <path d="M62 88 C58 52 80 40 100 40 C122 40 142 52 138 88 C132 66 114 56 96 60 C80 64 68 72 62 88 Z" fill={c} />
    case 'longCurly': return <g fill={c}>{[[72, 58], [86, 48], [100, 45], [114, 48], [128, 58], [66, 74], [134, 74]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="12" />)}</g>
    default: return null
  }
}

export const AvatarSvg = ({ a, size = 96 }) => {
  const [skin, shade] = SKIN[a.skin]
  const lips = a.female ? '#B4545F' : shade
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={a.label}>
      <defs><clipPath id={`c-${a.id}`}><circle cx="100" cy="100" r="100" /></clipPath></defs>
      <g clipPath={`url(#c-${a.id})`}>
        <rect width="200" height="200" fill={BG[a.bg]} />
        {hairBack(a.hair, a.hairColor)}
        <path d="M28 210 C28 160 58 142 100 142 C142 142 172 160 172 210 Z" fill={SHIRT[a.shirt]} />
        <path d="M84 112 L84 146 C92 154 108 154 116 146 L116 112 Z" fill={shade} />
        {a.female ? <path d="M84 142 C92 156 108 156 116 142" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="3" /> : <path d="M86 142 L100 158 L114 142" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="4" />}
        <ellipse cx="64" cy="94" rx="8" ry="11" fill={shade} />
        <ellipse cx="136" cy="94" rx="8" ry="11" fill={shade} />
        <ellipse cx="100" cy="90" rx="36" ry={a.female ? 41 : 43} fill={skin} />
        {a.beard === 'full' && <path d="M64 92 C64 128 82 136 100 136 C118 136 136 128 136 92 C132 112 122 114 112 110 L88 110 C78 114 68 112 64 92 Z" fill={a.hairColor} />}
        {a.beard === 'stubble' && <path d="M66 98 C68 126 84 134 100 134 C116 134 132 126 134 98 C128 118 116 120 100 120 C84 120 72 118 66 98 Z" fill={a.hairColor} opacity=".35" />}
        {hairFront(a.hair, a.hairColor)}
        <path d={`M80 ${a.female ? 79 : 80} q7 -4 14 0 M106 ${a.female ? 79 : 80} q7 -4 14 0`} stroke={a.hair === 'bald' ? shade : a.hairColor} strokeWidth={a.female ? 2.5 : 3.5} fill="none" strokeLinecap="round" />
        <ellipse cx="87" cy="91" rx="3.6" ry="4.2" fill="#2A211C" />
        <ellipse cx="113" cy="91" rx="3.6" ry="4.2" fill="#2A211C" />
        {a.female && <path d="M82 88 l-3 -2 M118 88 l3 -2" stroke="#2A211C" strokeWidth="1.6" strokeLinecap="round" />}
        <path d="M100 96 q-4 10 0 12" stroke={shade} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        {a.beard === 'mustache' || a.beard === 'full' ? <path d="M88 113 q12 -6 24 0 q-12 4 -24 0 Z" fill={a.hairColor} /> : null}
        <path d={a.smile ? 'M88 116 q12 10 24 0 q-12 3 -24 0 Z' : 'M90 117 q10 5 20 0'} fill={a.smile ? '#fff' : 'none'} stroke={lips} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
        {a.glasses && <g fill="none" stroke="#2F2F33" strokeWidth="2.6"><circle cx="87" cy="91" r="10" /><circle cx="113" cy="91" r="10" /><path d="M97 91 h6 M77 89 l-12 -3 M123 89 l12 -3" /></g>}
        {a.female && a.earrings && <g fill="#E0B341"><circle cx="64" cy="108" r="3" /><circle cx="136" cy="108" r="3" /></g>}
      </g>
    </svg>
  )
}

const HAIR_COLORS = ['#1F1A17', '#3B2A20', '#5C3A21', '#8A5A2B', '#B9874E', '#8C8C8C']
// Combinaciones fijas para que la lista no cambie entre aperturas.
const MEN = [
  ['s1', 'short', 3, 'stubble', false], ['s2', 'side', 1, null, true], ['s3', 'buzz', 0, 'full', false], ['s4', 'curly', 0, null, false],
  ['s5', 'afro', 0, 'mustache', false], ['s6', 'buzz', 0, 'stubble', false], ['s2', 'bald', 0, 'full', false], ['s3', 'short', 5, 'mustache', true],
  ['s4', 'side', 1, null, false], ['s1', 'curly', 4, null, false], ['s5', 'short', 0, null, true], ['s6', 'afro', 0, 'full', false]
]
const WOMEN = [
  ['s1', 'long', 4, false, true], ['s2', 'long', 2, false, false], ['s3', 'bun', 1, true, true], ['s4', 'longCurly', 1, false, true],
  ['s5', 'afro', 0, false, true], ['s6', 'braids', 0, false, true], ['s2', 'longCurly', 3, false, false], ['s3', 'long', 0, true, false],
  ['s4', 'bun', 0, false, true], ['s1', 'bun', 5, true, false], ['s5', 'braids', 1, false, false], ['s6', 'long', 0, false, true]
]
export const AVATARS = [
  ...MEN.map(([skin, hair, hc, beard, glasses], i) => ({ id: `h${i + 1}`, female: false, label: `Hombre ${i + 1}`, skin, hair, hairColor: HAIR_COLORS[hc], beard, glasses, smile: i % 3 !== 2, bg: i % BG.length, shirt: (i * 3) % SHIRT.length })),
  ...WOMEN.map(([skin, hair, hc, glasses, earrings], i) => ({ id: `m${i + 1}`, female: true, label: `Mujer ${i + 1}`, skin, hair, hairColor: HAIR_COLORS[hc], glasses, earrings, smile: i % 3 !== 1, bg: (i + 3) % BG.length, shirt: (i * 5 + 2) % SHIRT.length }))
]

// Convierte el avatar a JPEG (data URL) del tamaño pedido, igual que una foto cargada.
export const avatarToDataUrl = (svgEl, size) => new Promise((resolve, reject) => {
  const xml = new XMLSerializer().serializeToString(svgEl)
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = size; canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size)
    ctx.drawImage(img, 0, 0, size, size)
    resolve(canvas.toDataURL('image/jpeg', 0.9))
  }
  img.onerror = () => reject(new Error('No se pudo preparar el avatar'))
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`
})

// Ventana para elegir un avatar. onPick recibe { photo, thumb } en data URL.
export const AvatarPicker = ({ onPick, onClose }) => {
  const [filter, setFilter] = useState('todos')
  const [error, setError] = useState('')
  const list = useMemo(() => AVATARS.filter((a) => filter === 'todos' || (filter === 'mujeres') === a.female), [filter])
  const pick = async (e) => {
    const svg = e.currentTarget.querySelector('svg')
    try { onPick({ photo: await avatarToDataUrl(svg, 480), thumb: await avatarToDataUrl(svg, 120) }) } catch (err) { setError(err.message) }
  }
  return (
    <Modal title="Elegir un avatar" onClose={onClose}>
      <div className="stack">
        <div className="tabs" role="tablist">
          {[['todos', 'Todos'], ['hombres', 'Hombres'], ['mujeres', 'Mujeres']].map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={filter === k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>)}
        </div>
        <div className="avatar-grid">
          {list.map((a) => <button key={a.id} type="button" className="avatar-option" onClick={pick} title={a.label}><AvatarSvg a={a} size={84} /></button>)}
        </div>
        <small className="hint">Úsalo cuando el cliente no quiere o no puede tomarse la foto. Puedes cambiarlo después por una foto real.</small>
        {error && <div className="alert bad">{error}</div>}
      </div>
    </Modal>
  )
}
