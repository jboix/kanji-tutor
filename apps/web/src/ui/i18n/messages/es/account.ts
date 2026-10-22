/** Spanish messages: cloud saves, logging in to them, and Settings → Cloud saves. */
import type { Messages } from '../../types.ts';

export const account = {
  logInTitle: 'Iniciar sesión',
  logInLead: 'Continúa con el progreso guardado en otro dispositivo.',
  linkPhone: 'Vincular desde tu teléfono',
  linkPhoneDetail: 'Escribe un código en el dispositivo que tiene tu progreso',
  passkey: 'Usar una llave de acceso',
  passkeyDetail: 'Face ID, Windows Hello o tu gestor de contraseñas',
  emailCode: 'Recibir un código por correo',
  emailCodeDetail: 'Si ya no tienes el otro dispositivo',
  backToWelcome: 'Volver a la bienvenida',
  otherWays: 'Otras formas de entrar',
  bringing: 'Trayendo tu progreso…',

  linkSteps:
    'En el dispositivo que tiene tu progreso, abre Ajustes → Copias en la nube → Vincular un dispositivo, y escribe este código. Vale dos minutos.',
  linkWaiting: 'Esperando al otro dispositivo…',
  linkNewCode: 'Código nuevo',
  passkeyButton: 'Usar mi llave de acceso',
  passkeyWaiting: 'Esperando tu llave de acceso…',
  emailLabel: 'Tu correo de recuperación',
  emailSend: 'Enviar el código',
  emailSent:
    'Si una cuenta tiene esta dirección, va de camino un código de 6 cifras. Vale 10 minutos.',
  codeLabel: 'Código del correo',
  codeSubmit: 'Entrar',

  joinTitle: 'Activar las copias en la nube',
  joinLead:
    'Tu progreso se guarda en el servidor de Kanji Tutor, cifrado, y se mantiene al día en cada dispositivo donde entres. Entras con una llave de acceso: no hay contraseña.',
  inviteLabel: 'Código de invitación',
  joinButton: 'Crear una llave de acceso y activar',
  joinDone: 'Las copias en la nube están activadas, y tu progreso está guardado.',
  joinContinue: 'Continuar',
  joinAlready: 'Las copias en la nube ya están activadas en este dispositivo.',

  cloudTitle: 'Copias en la nube',
  cloudDetail: 'Tu progreso en cada dispositivo',
  cloudOff:
    'Desactivadas en este dispositivo. Con una invitación, tu progreso se guarda en línea y se mantiene al día en tus otros dispositivos.',
  cloudTurnOn: 'Activar',
  cloudLogIn: 'Mejor iniciar sesión',
  cloudLogInHint:
    'Al iniciar sesión llega el progreso guardado en línea; lo que solo está en este dispositivo también se conserva.',
  statusSaved: 'Guardado a las {time}.',
  statusUpToDate: 'Al día.',
  statusWaiting: 'Cambios pendientes: se guardan en un momento.',
  statusSaving: 'Guardando…',
  statusOffline: 'Sin conexión: tus cambios se guardan cuando vuelvas a estar en línea.',
  statusPaused: 'Muchos guardados esta hora: el siguiente sale en unos minutos.',
  statusFailed: 'El último guardado no llegó. Lo vuelve a intentar solo.',
  saveNow: 'Guardar ahora',

  devicesTitle: 'Dispositivos',
  deviceThis: 'Este dispositivo',
  deviceSeen: 'Usado el {date}',
  deviceRemove: 'Cerrar sesión',
  deviceRemoveQuestion:
    '¿Cerrar la sesión de «{name}»? Conserva su progreso, pero no guarda nada más hasta que vuelva a entrar.',
  linkTitle: 'Vincular un dispositivo',
  linkHint:
    'En el dispositivo nuevo, elige Iniciar sesión, luego Vincular desde tu teléfono, y escribe aquí el código que muestra.',
  linkCodeLabel: 'Código del dispositivo nuevo',
  linkLookUp: 'Siguiente',
  linkAsk: '«{name}» pide usar tu progreso.',
  linkApprove: 'Dejarlo entrar',
  linkApproved: 'Vinculado: «{name}» está trayendo tu progreso.',

  emailTitle: 'Correo de recuperación',
  emailNone: 'Ninguno todavía. Con uno, puedes entrar con un código si pierdes tus dispositivos.',
  emailCurrent: 'Los códigos van a {email}.',
  emailNew: 'Dirección de correo',
  emailSendCode: 'Enviar un código',
  emailCodeSent: 'Va de camino un código a {email}.',
  emailConfirm: 'Confirmar',
  emailSaved: 'Guardado: los códigos van ahora a {email}.',

  passkeyTitle: 'Llave de acceso',
  passkeyHint:
    'Añade una llave de acceso en este dispositivo, para entrar con Face ID, Windows Hello o tu gestor de contraseñas.',
  passkeyAdd: 'Añadir una llave de acceso',
  passkeyAdded: 'Llave de acceso añadida.',

  thisDeviceTitle: 'En este dispositivo',
  logOut: 'Cerrar sesión',
  logOutQuestion:
    '¿Cerrar sesión en este dispositivo? Su progreso se queda aquí; solo deja de guardar en línea.',
  loggedOut: 'Sesión cerrada. Tu progreso se queda en este dispositivo.',
  deleteAccount: 'Eliminar la cuenta en línea',
  deleteQuestion:
    '¿Eliminar tu cuenta en línea y su copia? Cada dispositivo conserva su progreso, pero ya no se guarda nada en línea. No se puede deshacer.',
  deleteConfirm: 'Eliminar',
  cancel: 'Cancelar',

  errorOffline: 'Sin conexión. Inténtalo de nuevo cuando estés en línea.',
  errorServer: 'El servidor no respondió como se esperaba. Inténtalo de nuevo en un momento.',
  errorSignedOut: 'Se cerró la sesión de este dispositivo. Vuelve a entrar.',
  errorInviteNeeded: 'Este código de invitación no sirve: puede que esté usado o revocado.',
  errorPasskeyCancelled: 'No se usó la llave de acceso. Inténtalo cuando quieras.',
  errorPasskeyRefused: 'La llave de acceso no funcionó aquí. Prueba otra forma de entrar.',
  errorPasskeyUnknown: 'Esta llave de acceso no es de ninguna cuenta de Kanji Tutor.',
  errorChallengeExpired: 'Tardó demasiado. Inténtalo de nuevo.',
  errorCodeExpired: 'Este código ha caducado. Pide uno nuevo.',
  errorCodeUsed: 'Este código ya se usó.',
  errorCodeWrong: 'Ese código no es correcto. Revísalo e inténtalo de nuevo.',
  errorEmailOff: 'Los códigos por correo no están configurados en este servidor.',
  errorEmailFailed: 'No se pudo enviar el correo. Inténtalo más tarde.',
  errorEmailTaken: 'Esta dirección pertenece a otra cuenta.',
  errorTooManyCodes: 'Demasiados códigos para esta dirección. Inténtalo dentro de una hora.',
  errorSlowDown: 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.',
  errorBadRequest: 'Eso no parece correcto. Revisa lo que escribiste.',
} satisfies Messages['account'];
