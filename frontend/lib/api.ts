import axios from 'axios';
import { useErrorStore } from '@/store/error.store';
import { useAuthStore } from '@/store/auth.store';

const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002') + '/api',
  withCredentials: true,
});

const ERROR_MAP: Record<number, { title: string; message: string; solution: string }> = {
  400: {
    title: 'Datos incorrectos',
    message: 'El formulario tiene información inválida o incompleta.',
    solution: 'Revisá los campos marcados en rojo y completá todos los datos requeridos.',
  },
  401: {
    title: 'Sesión expirada',
    message: 'Tu sesión ha caducado o no tenés permisos para realizar esta acción.',
    solution: 'Cerrá sesión y volvé a ingresar con tus credenciales.',
  },
  403: {
    title: 'Acceso denegado',
    message: 'No tenés permisos para realizar esta operación.',
    solution: 'Contactá al administrador del sistema si creés que deberías tener acceso.',
  },
  404: {
    title: 'No encontrado',
    message: 'El recurso que buscás no existe o fue eliminado.',
    solution: 'Volvé al listado y verificá que el elemento exista.',
  },
  409: {
    title: 'Conflicto de datos',
    message: 'Ya existe un registro con esa información (por ejemplo, el correo ya está registrado).',
    solution: 'Revisá si el usuario o registro ya existe antes de crearlo de nuevo.',
  },
  413: {
    title: 'Archivo demasiado grande',
    message: 'El archivo que intentás subir supera el límite permitido (5 MB).',
    solution: 'Reducí el tamaño del archivo o comprimilo antes de adjuntarlo.',
  },
  422: {
    title: 'Error de validación',
    message: 'Los datos enviados no cumplen con el formato requerido.',
    solution: 'Revisá que todos los campos tengan el formato correcto (fechas, correos, números).',
  },
  429: {
    title: 'Demasiadas solicitudes',
    message: 'Realizaste demasiadas peticiones en poco tiempo.',
    solution: 'Esperá unos segundos e intentá de nuevo.',
  },
  500: {
    title: 'Error interno del servidor',
    message: 'Ocurrió un error inesperado en el servidor.',
    solution: 'Intentá de nuevo en unos minutos. Si el problema persiste, informale al área TIC.',
  },
  502: {
    title: 'Servidor no disponible',
    message: 'El servidor de backend no está respondiendo.',
    solution: 'El servicio puede estar reiniciándose. Esperá 1-2 minutos e intentá de nuevo.',
  },
  503: {
    title: 'Servicio no disponible',
    message: 'El sistema está temporalmente fuera de servicio.',
    solution: 'Esperá unos minutos. Si el problema continúa, contactá al área TIC.',
  },
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't show modal for login errors — those pages handle them inline
    const url: string = error.config?.url ?? '';
    const silentRoutes = ['/auth/login', '/auth/me'];
    if (silentRoutes.some((r) => url.includes(r))) {
      return Promise.reject(error);
    }

    const status: number | undefined = error.response?.status;

    // If 401 and no authenticated user, auth-provider is already handling the redirect
    if (status === 401 && !useAuthStore.getState().user) {
      return Promise.reject(error);
    }

    const serverMessage: string | undefined =
      error.response?.data?.message ?? error.response?.data?.error;

    if (!status) {
      // Network error — no response at all
      useErrorStore.getState().show({
        title: 'Sin conexión con el servidor',
        message: 'No se pudo conectar con el sistema. Verificá tu conexión a internet.',
        solution: 'Revisá que estés conectado a la red de CEMINSA o a internet. Si el problema persiste, contactá al área TIC.',
      });
      return Promise.reject(error);
    }

    const known = ERROR_MAP[status];
    useErrorStore.getState().show({
      title: known?.title ?? 'Error inesperado',
      message: serverMessage ?? known?.message ?? `Ocurrió un error (código ${status}).`,
      solution: known?.solution,
      code: status,
    });

    return Promise.reject(error);
  },
);

export default api;
