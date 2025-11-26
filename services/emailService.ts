import Constants from 'expo-constants';

const RESEND_API = 'https://api.resend.com/emails';

type ResendExtra = {
  resendKey?: string;
  resendFrom?: string;
  adminEmail?: string;
};

type ResendResponse = {
  id?: string;
  error?: string;
} & Record<string, any>;

function getExtra(): ResendExtra {
  return (
    (Constants?.expoConfig?.extra as ResendExtra | undefined) ??
    (Constants?.manifest?.extra as ResendExtra | undefined) ??
    {}
  );
}

function resolveValue(key: 'resendKey' | 'resendFrom' | 'adminEmail'): string | undefined {
  const extra = getExtra();
  if (extra?.[key]) return extra[key];

  const envMap: Record<typeof key, string | undefined> = {
    resendKey: process.env.EXPO_PUBLIC_RESEND_API_KEY,
    resendFrom: process.env.EXPO_PUBLIC_RESEND_FROM,
    adminEmail: process.env.EXPO_PUBLIC_ADMIN_EMAIL,
  };

  return envMap[key];
}

function getEnvVar(key: string): string {
  const value =
    key === 'EXPO_PUBLIC_RESEND_API_KEY'
      ? resolveValue('resendKey')
      : key === 'EXPO_PUBLIC_RESEND_FROM'
        ? resolveValue('resendFrom')
        : key === 'EXPO_PUBLIC_ADMIN_EMAIL'
          ? resolveValue('adminEmail')
          : process.env[key];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${key}`);
  }
  return value;
}

async function callResend(body: Record<string, any>): Promise<ResendResponse> {
  const apiKey = getEnvVar('EXPO_PUBLIC_RESEND_API_KEY');

  const response = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

export async function enviarCorreoEmpleado(email: string, justificacion: string): Promise<ResendResponse> {
  const from = getEnvVar('EXPO_PUBLIC_RESEND_FROM');

  return callResend({
    from: `Soporte WSA <${from}>`,
    to: email,
    subject: 'Solicitud de restablecimiento de contraseña',
    html: `
      Hola,<br><br>
      Hemos recibido tu solicitud de restablecimiento de contraseña para:<br><br>
      <b>${email}</b><br><br>
      Justificación:<br>
      "${justificacion}"<br><br>
      Nuestro equipo revisará la solicitud y te contactará si es necesario.<br><br>
      Saludos,<br>
      Soporte WSA
    `,
  });
}

export async function enviarCorreoAdmin(email: string, justificacion: string): Promise<ResendResponse> {
  const from = getEnvVar('EXPO_PUBLIC_RESEND_FROM');
  const admin = getEnvVar('EXPO_PUBLIC_ADMIN_EMAIL');

  return callResend({
    from: `WSA Sistema <${from}>`,
    to: admin,
    subject: '🔐 Solicitud de cambio de contraseña',
    html: `
      <h3>Datos de solicitud</h3>
      Correo del usuario:<br>
      <b>${email}</b><br><br>
      Justificación enviada:<br>
      "${justificacion}"<br><br>
      Acciones sugeridas:<br>
      - Validar identidad del trabajador<br>
      - Reset de contraseña<br>
    `,
  });
}
