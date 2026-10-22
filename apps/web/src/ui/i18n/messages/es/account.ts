/** Spanish messages: logging in to bring progress from another device (cloud saves). */
import type { Messages } from '../../types.ts';

export const account = {
  logInTitle: 'Iniciar sesión',
  logInLead: 'Sigue con el progreso guardado en otro dispositivo.',
  linkPhone: 'Vincular desde tu móvil',
  linkPhoneDetail: 'Escanea un código con el dispositivo que tiene tu progreso',
  passkey: 'Usar una llave de acceso',
  passkeyDetail: 'Face ID, Windows Hello o tu gestor de contraseñas',
  emailCode: 'Recibir un código por correo',
  emailCodeDetail: 'Si ya no tienes el otro dispositivo',
  notYet:
    'Las copias en la nube aún no están disponibles. Elige Empezar por ahora; tu progreso se queda en este dispositivo.',
  backToWelcome: 'Volver a la bienvenida',
} satisfies Messages['account'];
