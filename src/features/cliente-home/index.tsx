import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { useMiPerfilQuery } from '@/api/clientes'
import { useDispositivosQuery } from '@/api/dispositivos'
import { type EstadoTicket, useTicketsQuery } from '@/api/tickets'
import { useAuthStore } from '@/stores/auth-store'
import { estadoTicketLabels } from '@/lib/ticket-estado'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

const ESTADOS_DESTACADOS: EstadoTicket[] = [
  'EN_REVISION',
  'EN_ESPERA_PAGO',
  'EN_PROGRESO',
  'FINALIZADO',
]

export function ClienteHome() {
  const nombre = useAuthStore((state) => state.auth.user?.nombre)
  const { data: tickets } = useTicketsQuery()
  const { data: dispositivos } = useDispositivosQuery()
  const { data: perfil, isLoading: perfilLoading } = useMiPerfilQuery()

  const conteoPorEstado = (tickets ?? []).reduce<
    Partial<Record<EstadoTicket, number>>
  >((acc, ticket) => {
    acc[ticket.estado] = (acc[ticket.estado] ?? 0) + 1
    return acc
  }, {})

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <h1 className='text-2xl font-bold tracking-tight'>Hola, {nombre}</h1>
        <p className='mt-2 text-muted-foreground'>
          Tus dispositivos y tickets.
        </p>

        <div className='mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5'>
          <Card>
            <CardHeader>
              <CardDescription>Dispositivos</CardDescription>
              <CardTitle className='text-3xl'>
                {dispositivos?.length ?? '—'}
              </CardTitle>
            </CardHeader>
          </Card>
          {ESTADOS_DESTACADOS.map((estado) => (
            <Card key={estado}>
              <CardHeader>
                <CardDescription>{estadoTicketLabels[estado]}</CardDescription>
                <CardTitle className='text-3xl'>
                  {conteoPorEstado[estado] ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className='mt-6'>
          <CardHeader>
            <CardTitle className='text-base'>Detalle por dispositivo</CardTitle>
            <CardDescription>
              Cada ticket con su servicio, costo y fecha de garantía (si el
              dispositivo ya fue entregado).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {perfilLoading && (
              <p className='text-sm text-muted-foreground'>Cargando…</p>
            )}
            {!perfilLoading && (perfil?.dispositivos.length ?? 0) === 0 && (
              <p className='text-sm text-muted-foreground'>
                Todavía no tienes dispositivos registrados.
              </p>
            )}
            <div className='flex flex-col gap-6'>
              {perfil?.dispositivos.map((dispositivo) => (
                <div key={dispositivo.dispositivo_id}>
                  <h3 className='mb-2 font-medium'>
                    {dispositivo.marca} {dispositivo.modelo}
                    {dispositivo.tipo_nombre && (
                      <span className='ms-2 text-sm font-normal text-muted-foreground'>
                        ({dispositivo.tipo_nombre})
                      </span>
                    )}
                  </h3>
                  {dispositivo.tickets.length === 0 ? (
                    <p className='text-sm text-muted-foreground'>
                      Sin tickets registrados.
                    </p>
                  ) : (
                    <div className='overflow-x-auto'>
                      <table className='w-full text-sm'>
                        <thead>
                          <tr className='border-b text-left text-muted-foreground'>
                            <th className='py-2 pe-4'>Ticket</th>
                            <th className='py-2 pe-4'>Estado</th>
                            <th className='py-2 pe-4'>Servicio</th>
                            <th className='py-2 pe-4'>Costo</th>
                            <th className='py-2 pe-4'>Creado</th>
                            <th className='py-2 pe-4'>Entregado</th>
                            <th className='py-2 pe-4'>Garantía hasta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dispositivo.tickets.map((ticket) => (
                            <tr key={ticket.ticket_id} className='border-b'>
                              <td className='py-2 pe-4'>
                                <Link
                                  to='/cliente/tickets/$ticketId'
                                  params={{ ticketId: ticket.ticket_id }}
                                  className='underline-offset-4 hover:underline'
                                >
                                  #{ticket.ticket_id.slice(0, 8)}
                                </Link>
                              </td>
                              <td className='py-2 pe-4'>
                                <Badge variant='outline'>
                                  {estadoTicketLabels[ticket.estado]}
                                </Badge>
                              </td>
                              <td className='py-2 pe-4'>
                                {ticket.servicio_nombre ?? '—'}
                              </td>
                              <td className='py-2 pe-4'>
                                {ticket.precio_final ?? ticket.precio_base
                                  ? `S/ ${ticket.precio_final ?? ticket.precio_base}`
                                  : '—'}
                              </td>
                              <td className='py-2 pe-4 text-nowrap'>
                                {format(
                                  new Date(ticket.creado_en),
                                  'dd/MM/yyyy'
                                )}
                              </td>
                              <td className='py-2 pe-4 text-nowrap'>
                                {ticket.fecha_finalizacion
                                  ? format(
                                      new Date(ticket.fecha_finalizacion),
                                      'dd/MM/yyyy'
                                    )
                                  : '—'}
                              </td>
                              <td className='py-2 pe-4 text-nowrap'>
                                {ticket.garantia_fecha_vencimiento
                                  ? format(
                                      new Date(
                                        ticket.garantia_fecha_vencimiento
                                      ),
                                      'dd/MM/yyyy'
                                    )
                                  : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
