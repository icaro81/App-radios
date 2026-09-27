export interface VersionRelease {
  version: string;
  buildCode: number;
  date: string;
  tagline: string; // Reseña breve del cambio principal
  changes: string[]; // Lista detallada de cambios
  isLatest?: boolean;
}

export const VERSION_HISTORY: VersionRelease[] = [
  {
    version: '1.0.40',
    buildCode: 40,
    date: '27 Sep 2026',
    tagline: 'Control remoto optimizado para Android TV y TV Box: cambio ágil de Skin (Sol ☀️ / Luna 🌙) y navegación D-Pad inteligente.',
    changes: [
      'Cambio directo de Skin con mando a distancia: Acceso instantáneo en cabecera y pie de página, o pulsando la tecla [0], [*] o teclas de color en el mando.',
      'Navegación espacial D-Pad perfeccionada: Salto lateral con flecha izquierda [◄] desde cualquier emisora directamente al panel de reproducción.',
      'Acceso rápido al conmutador de tema subiendo desde la primera emisora o los controles principales [▲].',
      'Anillos de enfoque con alto contraste y brillo reactivo optimizados para televisores a distancia.',
      'Control de tecla Volver/Atrás que regresa el foco a la consola antes de salir de la aplicación.'
    ],
    isLatest: true,
  },
  {
    version: '1.0.24',
    buildCode: 24,
    date: '26 Sep 2026',
    tagline: 'Iconos Sol ☀️ / Luna 🌙, ecualizador nítido en fondo celeste y cuadro de cambios con reseñas dinámicas.',
    changes: [
      'Nuevo control táctil Sol ☀️ / Luna 🌙: Siluetas intuitivas de luna creciente (Negro Cristal) y sol radiante (Celeste Galena) con cápsula cristal e iluminación reactiva.',
      'Ecualizador Canvas (VU Meter) perfeccionado en Celeste Galena: Eliminada la sombra negra distorsionada, logrando barras nítidas de cristal obsidiana y brillo especular.',
      'Contraste perfecto en ventana de Ecualizador: Frecuencias, faders verticales y etiquetas con máxima legibilidad en ambos temas.',
      'Cuadro de cambios y detalles dinámico: Cada actualización incluye su propia reseña destacada e historial navegable de versiones anteriores sin congelarse en la primera entrega.',
      'Optimización de fluidez para Android TV y mandos a distancia de TV Box sin retardo en selección.'
    ],
  },
  {
    version: '1.0.23',
    buildCode: 23,
    date: '06 Sep 2026',
    tagline: 'Renombrado oficial a Galena Digital y optimizaciones para TV Box.',
    changes: [
      'Renombrado oficial a Galena Digital HD.',
      'Ecualizador vertical optimizado sin lag ni brillo pesado en TV Box.',
      'Gestión inteligente del botón atrás en TV Box: 1 toque cierra ventanas emergentes, 2 toques cierra la aplicación.',
      'Descarga e instalación en una sola pulsación asegurando permisos nativos antes de descargar.',
      'Compatibilidad completa con Android TV, mando a distancia y pantalla apagada.'
    ],
  },
  {
    version: '1.0.22',
    buildCode: 22,
    date: '28 Ago 2026',
    tagline: 'Ecualizador paramétrico de 4 bandas y compatibilidad con Android Auto.',
    changes: [
      'Ecualizador paramétrico de 4 bandas (Bajo, Medio, Intermedio, Agudo) con ajuste en tiempo real y perfiles rápidos.',
      'Compatibilidad con selector multimedia de Android Auto.',
      'Bloqueo del protector de pantalla y reposo en Android TV.'
    ],
  },
  {
    version: '1.0.21',
    buildCode: 21,
    date: '15 Ago 2026',
    tagline: 'Lanzamiento inicial de Galena Digital con acabado de cristal.',
    changes: [
      'Visualizador de espectro de audio en tiempo real con vúmetro reactivo.',
      'Sintonización rápida de estaciones en cuadrícula 2x2 táctil y para mando.',
      'Integración PWA e instalación en Android / Android TV.'
    ],
  },
];

export const APP_NAME = 'Galena Digital';
export const APP_VERSION = '1.0.40';
export const APP_BUILD_CODE = 40;
export const DEFAULT_REPO = 'icaro81/App-radios';

export const LATEST_RELEASE = VERSION_HISTORY[0];
export const CURRENT_CHANGELOG = LATEST_RELEASE.changes;
