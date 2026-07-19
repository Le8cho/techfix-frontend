import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { httpClient, unwrap } from './http-client'

export type TipoServicio =
  | 'PREVENTIVO'
  | 'CORRECTIVO'
  | 'SUSCRIPCION_SOFTWARE'
  | 'OTROS'

export interface Servicio {
  servicio_id: string
  nombre: string
  tipo_servicio: TipoServicio
  precio_base: string // Decimal del backend serializado como string, ver Decimal-as-string en el plan
  activo: boolean
}

export interface ServicioCreate {
  nombre: string
  tipo_servicio: TipoServicio
  precio_base: number
}

export type ServicioUpdate = Partial<ServicioCreate> & { activo?: boolean }

const listarServicios = () =>
  unwrap<Servicio[]>(httpClient.get('/api/v1/catalogo/servicios'))

const crearServicio = (body: ServicioCreate) =>
  unwrap<Servicio>(httpClient.post('/api/v1/catalogo/servicios', body))

const actualizarServicio = (servicioId: string, body: ServicioUpdate) =>
  unwrap<Servicio>(
    httpClient.patch(`/api/v1/catalogo/servicios/${servicioId}`, body)
  )

export function useServiciosQuery() {
  return useQuery({
    queryKey: ['catalogo', 'servicios'],
    queryFn: listarServicios,
  })
}

export function useCrearServicioMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: crearServicio,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['catalogo', 'servicios'] }),
  })
}

export function useActualizarServicioMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      servicioId,
      body,
    }: {
      servicioId: string
      body: ServicioUpdate
    }) => actualizarServicio(servicioId, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['catalogo', 'servicios'] }),
  })
}
