import { useMutation, useQuery } from '@tanstack/react-query'
import type { TipoServicio } from './catalogo'
import { httpClient, unwrap } from './http-client'

export type EstadoTicket =
  | 'EN_REVISION'
  | 'EN_ESPERA_PAGO'
  | 'EN_PROGRESO'
  | 'FINALIZADO'
  | 'RECHAZADO'
  | 'ARCHIVADO'
  | 'CANCELADO'

export interface ClienteOut {
  cliente_id: string
  nombre: string
  email: string
  distrito: string
  activo: boolean
  creado_en: string
}

export interface ClienteListItem {
  cliente_id: string
  nombre: string
  email: string
  distrito: string
  tickets_activos: number
  ultimo_ticket_estado: EstadoTicket | null
  creado_en: string
}

export interface TicketResumen {
  ticket_id: string
  estado: EstadoTicket
  servicio_nombre: string | null
  precio_base: number | null
  precio_final: number | null
  creado_en: string
  fecha_finalizacion: string | null
  garantia_fecha_inicio: string | null
  garantia_fecha_vencimiento: string | null
}

export interface DispositivoConTickets {
  dispositivo_id: string
  tipo_nombre: string | null
  marca: string
  modelo: string
  numero_serie: string | null
  activo: boolean
  tickets: TicketResumen[]
}

export interface ClienteProfile {
  cliente_id: string
  nombre: string
  email: string
  distrito: string
  activo: boolean
  creado_en: string
  dispositivos: DispositivoConTickets[]
}

export interface ClientesFiltros {
  estado_ticket?: EstadoTicket
  distrito?: string
  fecha_desde?: string
  tipo_ultimo_ticket?: TipoServicio
}

/** Autoregistro (bridge Supabase -> Azure SQL): idempotente, sin body, lee
 * nombre/distrito de user_metadata en el JWT. Ver Fase 0/1 del plan. */
export const registrarCliente = () =>
  unwrap<ClienteOut>(httpClient.post('/api/v1/clientes/registro'))

export const listarClientes = (filtros: ClientesFiltros = {}) =>
  unwrap<ClienteListItem[]>(
    httpClient.get('/api/v1/clientes', { params: filtros })
  )

export const obtenerClienteProfile = (clienteId: string) =>
  unwrap<ClienteProfile>(httpClient.get(`/api/v1/clientes/${clienteId}`))

export const obtenerMiPerfil = () =>
  unwrap<ClienteProfile>(httpClient.get('/api/v1/clientes/me/perfil'))

export function useRegistrarClienteMutation() {
  return useMutation({ mutationFn: registrarCliente })
}

export function useClientesQuery(filtros: ClientesFiltros = {}) {
  return useQuery({
    queryKey: ['clientes', filtros],
    queryFn: () => listarClientes(filtros),
  })
}

export function useClienteProfileQuery(clienteId: string) {
  return useQuery({
    queryKey: ['clientes', clienteId],
    queryFn: () => obtenerClienteProfile(clienteId),
    enabled: !!clienteId,
  })
}

export function useMiPerfilQuery() {
  return useQuery({
    queryKey: ['clientes', 'me', 'perfil'],
    queryFn: obtenerMiPerfil,
  })
}
