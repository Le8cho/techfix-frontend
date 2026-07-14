import { useClientesQuery } from '@/api/clientes'
import { type EstadoTicket, useTicketsQuery } from '@/api/tickets'
import { estadoTicketLabels } from '@/lib/ticket-estado'
import { useAuthStore } from '@/stores/auth-store'
import {
  Card,
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

export function TecnicoHome() {
  const nombre = useAuthStore((state) => state.auth.user?.nombre)
  const { data: tickets } = useTicketsQuery()
  const { data: clientes } = useClientesQuery()

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
        <p className='mt-2 text-muted-foreground'>Resumen del taller.</p>

        <div className='mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5'>
          <Card>
            <CardHeader>
              <CardDescription>Clientes</CardDescription>
              <CardTitle className='text-3xl'>
                {clientes?.length ?? '—'}
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
      </Main>
    </>
  )
}
