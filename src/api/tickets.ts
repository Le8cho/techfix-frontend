import type { Query } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { EstadoTicket } from './clientes'
import { httpClient, unwrap } from './http-client'

export type { EstadoTicket }

export interface TicketResponse {
  ticket_id: string
  cliente_id: string
  servicio_id: string
  servicio_nombre: string | null
  servicio_tipo: string | null
  tecnico_id: string | null
  dispositivo_id: string | null
  dispositivo_marca: string | null
  dispositivo_modelo: string | null
  dispositivo_foto_url: string | null
  estado: EstadoTicket
  descripcion: string | null
  precio_base: string | null // Decimal serializado como string
  precio_final: string | null
  motivo_rechazo: string | null // siempre null salvo que quien pregunta sea técnico (intencional, ver plan SD-07)
  confirmado_tecnico: boolean
  confirmado_cliente: boolean
  fecha_finalizacion: string | null
  creado_en: string
  actualizado_en: string | null
  garantia_fecha_inicio: string | null
  garantia_fecha_vencimiento: string | null
  garantia_usada: boolean | null
}

export interface TicketListItem {
  ticket_id: string
  estado: EstadoTicket
  servicio_id: string
  servicio_nombre: string | null
  dispositivo_id: string | null
  dispositivo_marca: string | null
  dispositivo_modelo: string | null
  dispositivo_foto_url: string | null
  precio_base: string | null
  precio_final: string | null
  creado_en: string
}

export interface TicketCrear {
  dispositivo_id: string
  servicio_id: string
  descripcion?: string
}

export interface TicketesFiltros {
  estado?: EstadoTicket
  cliente_id?: string // técnico/admin únicamente
  tipo_dispositivo_id?: number
  servicio_id?: string
  fecha_desde?: string
  garantia_vencida?: boolean // técnico/admin únicamente
}

const listarTickets = (filtros: TicketesFiltros = {}) =>
  unwrap<TicketListItem[]>(
    httpClient.get('/api/v1/tickets', { params: filtros })
  )

const obtenerTicket = (ticketId: string) =>
  unwrap<TicketResponse>(httpClient.get(`/api/v1/tickets/${ticketId}`))

const crearTicket = (body: TicketCrear) =>
  unwrap<TicketResponse>(httpClient.post('/api/v1/tickets', body))

const confirmarRecepcion = (ticketId: string) =>
  unwrap<TicketResponse>(
    httpClient.patch(`/api/v1/tickets/${ticketId}/confirmar-recepcion`)
  )

const reabrirTicket = (ticketId: string, descripcion?: string) =>
  unwrap<TicketResponse>(
    httpClient.patch(
      `/api/v1/tickets/${ticketId}/reabrir`,
      descripcion ? { descripcion } : undefined
    )
  )

const aceptarTicket = (ticketId: string, precioFinal: number) =>
  unwrap<TicketResponse>(
    httpClient.patch(`/api/v1/tickets/${ticketId}/aceptar`, {
      precio_final: precioFinal,
    })
  )

const rechazarTicket = (ticketId: string, motivoRechazo: string) =>
  unwrap<TicketResponse>(
    httpClient.patch(`/api/v1/tickets/${ticketId}/rechazar`, {
      motivo_rechazo: motivoRechazo,
    })
  )

const confirmarEntrega = (ticketId: string) =>
  unwrap<TicketResponse>(
    httpClient.patch(`/api/v1/tickets/${ticketId}/confirmar-entrega`)
  )

export function useTicketsQuery(filtros: TicketesFiltros = {}) {
  return useQuery({
    queryKey: ['tickets', filtros],
    queryFn: () => listarTickets(filtros),
  })
}

export function useTicketQuery(ticketId: string) {
  return useQuery({
    queryKey: ['tickets', ticketId],
    queryFn: () => obtenerTicket(ticketId),
    enabled: !!ticketId,
    // La pasarela de pago se abre en otra pestaña: mientras el ticket espera
    // el pago, se refresca solo cada 3s para reflejar la confirmación sin
    // que el cliente tenga que recargar la página a mano.
    refetchInterval: (query: Query<TicketResponse>) =>
      query.state.data?.estado === 'EN_ESPERA_PAGO' ? 3000 : false,
  })
}

function useTicketMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  })
}

export function useCrearTicketMutation() {
  return useTicketMutation(crearTicket)
}

export function useConfirmarRecepcionMutation() {
  return useTicketMutation(confirmarRecepcion)
}

export function useReabrirTicketMutation() {
  return useTicketMutation(
    ({ ticketId, descripcion }: { ticketId: string; descripcion?: string }) =>
      reabrirTicket(ticketId, descripcion)
  )
}

export function useAceptarTicketMutation() {
  return useTicketMutation(
    ({ ticketId, precioFinal }: { ticketId: string; precioFinal: number }) =>
      aceptarTicket(ticketId, precioFinal)
  )
}

export function useRechazarTicketMutation() {
  return useTicketMutation(
    ({
      ticketId,
      motivoRechazo,
    }: {
      ticketId: string
      motivoRechazo: string
    }) => rechazarTicket(ticketId, motivoRechazo)
  )
}

export function useConfirmarEntregaMutation() {
  return useTicketMutation(confirmarEntrega)
}
