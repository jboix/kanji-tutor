/** Spanish messages: settings (screen, key, models, tutor, language, reading, backup, about). */
import type { Messages } from '../../types.ts';

export const settings = {
  back: 'Atrás',
  title: 'Ajustes',

  keyHeading: 'Clave de API de Gemini',
  keySaved: 'Hay una clave guardada en este dispositivo.',
  keyNone: 'Aún no hay clave. Las explicaciones de IA siguen desactivadas hasta que añadas una.',
  keyTesting: 'Probando la clave…',
  keyField: 'Clave de API',
  keyPlaceholder: 'Pega la clave',
  keyShowLabel: 'Mostrar la clave',
  keyHideLabel: 'Ocultar la clave',
  keyShow: 'Mostrar',
  keyHide: 'Ocultar',
  save: 'Guardar',
  cancel: 'Cancelar',
  keyRemove: 'Quitar la clave',
  keyRemoveConfirm: 'Quitar',
  keyRemoveQuestion:
    '¿Quitar la clave de este dispositivo? Las explicaciones de IA se detienen hasta que añadas otra.',
  keyNoticeSaved: 'Clave guardada.',
  keyNoticeRemoved: 'Clave quitada.',
  keyTest: 'Probar clave',
  keyHint:
    'Se guarda solo en este navegador, nunca en las copias de seguridad. «Probar clave» hace una única llamada real muy pequeña.',

  models: 'Modelos',
  modelUse: 'Usar',
  advancedModels: 'Avanzado: modelos',
  fastModel: 'Modelo rápido',
  fastHint: 'Explicaciones del día a día, fotos y voz. «Probar clave» comprueba este.',
  teacherModel: 'Modelo profesor',
  teacherHint: 'Explicaciones que primero comprueban lo que sabes. Por defecto {model}.',
  priceUnknown:
    'Desconocido para la página de costes: las estimaciones usan el precio de Flash-Lite.',
  price: 'Unos {input} de entrada y {output} de salida por millón de tokens.',
  priceChange:
    'Unos {input} de entrada y {output} de salida por millón de tokens hasta el {date}; después, {nextInput} y {nextOutput}.',

  tutor: 'Tutor',
  tutorOnAsk: 'Solo cuando lo pido',
  tutorAuto: 'Explicar también mis errores automáticamente',
  tutorMark:
    'Los botones con el sello {seal} y «1 solicitud» envían una solicitud a Gemini; «Guardado» abre una respuesta que ya tienes, sin solicitud. Un texto marcado «Escrito por el tutor» viene de la IA.',
  tutorHint:
    'Las notas de la propia app se muestran siempre primero. Cada explicación del tutor es una solicitud a Gemini; una clave gratuita permite unas diez por minuto.',

  explanationsIn: 'Explicaciones en',
  immersionAuto: 'Auto',
  immersionNative: 'Mi idioma',
  immersionMixed: 'Mixto',
  immersionJapanese: 'Japonés',
  autoNative: 'en {language}',
  autoMixed: 'mixtas: japonés y luego una línea en {language}',
  autoJapanese: 'en japonés a tu nivel',
  autoLine:
    'Auto sigue tu nivel y las palabras que conoces. Ahora, en N{level}, las explicaciones van {where}.',
  immersionHint:
    'En japonés, el tutor usa palabras que conoces; una palabra nueva lleva furigana y su significado al tocarla.',
  languageEn: 'inglés',
  languageFr: 'francés',
  languageEs: 'español',

  language: 'Idioma',
  languageHint:
    'La interfaz y las explicaciones del tutor usan este idioma. El japonés se queda como está.',

  reading: 'Lectura',
  furigana: 'Furigana',
  furiganaNew: 'Solo palabras nuevas',
  furiganaAll: 'Todas las palabras',
  sessionLength: 'Duración de la sesión',
  sessionMinutes: '{n} min',
  sessionLengthHint:
    'Más o menos este tiempo, según la estimación, con solo unas pocas palabras nuevas a la vez.',
  explainFirst: 'Explicar primero lo nuevo',
  explainFirstOn: 'Sí',
  explainFirstOff: 'No',
  explainFirstHint:
    'No: sin tarjetas de introducción. Una etiqueta «Nuevo» en el ejercicio abre la misma explicación.',
  sounds: 'Sonido',
  soundHint:
    'Los tonos de las respuestas y el japonés en voz alta. Desactivado, la app no suena: los botones de altavoz se ocultan y las sesiones no incluyen escucha.',
  listening: 'Ejercicios de escucha',
  listeningOn: 'Activados',
  listeningOff: 'Desactivados',
  listeningHint:
    'Desactivados: no hay ejercicios que reproducen una frase para elegir su significado.',
  lesson: 'Lección actual',
  lessonNone: 'Los elementos nuevos no llevan etiqueta de lección.',
  lessonTagged: 'Los elementos nuevos se etiquetan {lesson}.',

  level: 'Tu nivel',
  levelHint: 'Las palabras nuevas vienen de este nivel del JLPT.',
  findLevel: 'Encontrar mi nivel',
  knownWords: 'Palabras conocidas',
  knownHint:
    'Marca como ya conocidas las palabras del JLPT N5 y N4, lecciones de Minna o tu propia lista.',
  markKnown: 'Marcar lo que ya sabes',
  learned: 'Lo que has aprendido',

  theme: 'Tema',
  themeSystem: 'Sistema',
  themeLight: 'Claro',
  themeDark: 'Oscuro',

  backup: 'Copia de seguridad',
  backupNone: 'Aún no hay copia de seguridad.',
  backupLast: 'Última copia: {date}.',
  backupExport: 'Exportar',
  backupImport: 'Importar',
  backupReplace: 'Reemplazar',
  backupReplaceQuestion:
    'Esto reemplaza tu historial de lectura en este dispositivo por {name}. Tu clave se queda. Exporta antes si quieres conservar lo que hay aquí.',
  backupRestored: 'Copia de seguridad restaurada.',
  backupHint: 'Un archivo JSON con todo, salvo la clave y la caché de la IA.',

  install: 'Instalar Kanji Tutor',
  installLead:
    'Desde la pantalla de inicio se abre a pantalla completa, funciona sin conexión y es menos probable que el dispositivo borre sus datos.',
  installButton: 'Instalar',
  installShare: 'Compartir',
  installIos: 'Toca Compartir {icon} y luego Añadir a pantalla de inicio.',
  installMenu: 'Usa el menú del navegador: Instalar app, o Añadir a pantalla de inicio.',

  storage: 'Almacenamiento',
  storagePersistent: 'Persistente: el navegador conservará tus datos.',
  storageNotPersistent:
    'Aún no es persistente: el navegador puede borrar los datos tras una pausa larga. Instala la app en la pantalla de inicio y haz copias de seguridad.',
  storageAsk: 'Pedir que conserve los datos',
  storageUsed: 'Usando {used} en este dispositivo.',
  storageUsedOf: 'Usando {used} de unos {quota} que este dispositivo permite a la app.',
  sizeKb: '{size} KB',
  sizeMb: '{size} MB',
  sizeGb: '{size} GB',

  erase: 'Borrar todos mis datos',
  eraseHint:
    'Elimina todo lo que la aplicación guarda en este dispositivo: tu progreso, repasos, notas, capturas, ajustes, tu clave de Gemini, la caché de la IA y el diccionario. No se puede deshacer.',
  eraseStart: 'Borrar todos mis datos…',
  eraseConfirm:
    '¿Borrar todo en este dispositivo? Exporta antes una copia de seguridad si quizá la quieres recuperar. La aplicación volverá a empezar en la bienvenida.',
  eraseExportFirst: 'Exportar antes una copia',
  eraseDo: 'Borrar todo',
  erasing: 'Borrando…',
  eraseFailed:
    'Algo detuvo el borrado. Cierra otras pestañas de la aplicación y vuelve a intentarlo.',

  about: 'Acerca de',
  aboutApp: 'Kanji Tutor: kanji leídos en frases reales, hasta el JLPT N3.',
  welcomeAgain: 'Repetir la bienvenida',
  version: 'Versión',
  versionLine: '{version}, compilación {id}, {when}',
  updateCheck: 'Buscar actualizaciones',
  updateChecking: 'Buscando…',
  updateFound:
    'Hay una versión nueva. Se descarga en segundo plano y aparece aquí cuando esté lista.',
  versionNewest: 'La más reciente',
  updateTrouble: '¿Problemas al actualizar?',
  updateLatest: 'Es la versión más reciente.',
  updateUnavailable: 'Aquí no hay actualizaciones (sin servicio sin conexión).',
  updateFailed: 'No se pudo contactar con el servidor. «Recargar de cero» sigue funcionando.',
  reloadFresh: 'Recargar de cero',
  reloadFreshHint:
    '«Recargar de cero» borra la copia guardada de la app y la vuelve a cargar del servidor. Tu progreso y tus ajustes se mantienen.',
  aboutPrivacy: 'Sin analíticas ni telemetría: tus datos se quedan en este dispositivo.',
  credits: 'Créditos',
  creditsDictionary: 'Diccionario',
  creditsDictionaryBy: '{jmdict} y {kanjidic}, propiedad del {edrdg}',
  creditsJlpt: 'Niveles JLPT',
  creditsJlptBy: 'Listas JLPT de Jonathan Waller (CC BY), asociadas a JMdict por {link}',
  creditsSentences: 'Frases de ejemplo',
  creditsHandwriting: 'Reconocimiento de escritura',
  creditsHandwritingBy: 'Adaptado de {link}, de Dominik Klein y Seth Clydesdale',
  creditsFonts: 'Fuentes',
  creditsLibraries: 'Bibliotecas',
  creditsApp: 'Esta app',
  creditsAppBy: 'Código fuente en {link}',
  creditsDownload: 'Descargar las licencias completas',
  backToList: 'Ajustes',
  buildLine: 'Kanji Tutor {version} · compilación {id}',
  catSessions: 'Sesiones',
  catSessionsLine: '{minutes} · {explain}',
  catExplainFirst: 'explicar primero lo nuevo',
  catSkipFirst: 'lo nuevo en una etiqueta',
  catTutor: 'Tutor IA',
  catTutorDetail: 'Clave, modelo, cómo explica, uso',
  catLanguage: 'Idioma',
  catLanguageDetail: 'La app y las explicaciones',
  catAppearance: 'Apariencia',
  catSoundOff: 'Sonido desactivado',
  catWords: 'Tus palabras',
  catWordsDetail: 'Tu nivel, palabras conocidas, tu clase',
  catBackup: 'Copia y almacenamiento',
  catBackupDetail: 'Exportar, importar, espacio usado, borrar',
  catInstall: 'Instalar',
  catInstallDetail: 'Añadir a la pantalla de inicio',
  catAbout: 'Acerca de y versión',
  catAboutDetail: 'Buscar actualizaciones, recargar de cero, créditos',
} satisfies Messages['settings'];
