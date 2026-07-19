import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import type { TicketResponse } from '@/api/tickets'

const ticketQueryMock = vi.fn()
const inertMutation = () => ({ mutateAsync: vi.fn(), isPending: false })

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    getRouteApi: () => ({
      useParams: () => ({ ticketId: 'ticket-1' }),
      useNavigate: () => vi.fn(),
    }),
  }
})

vi.mock('@/api/tickets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/tickets')>()
  return {
    ...actual,
    useTicketQuery: () => ticketQueryMock(),
    useConfirmarEntregaMutation: inertMutation,
  }
})

vi.mock('@/features/ticket-adjuntos', () => ({
  AdjuntosSection: () => null,
}))

vi.mock('@/components/layout/header', () => ({
  Header: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))
vi.mock('@/components/layout/main', () => ({
  Main: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/profile-dropdown', () => ({
  ProfileDropdown: () => null,
}))
vi.mock('@/components/theme-switch', () => ({
  ThemeSwitch: () => null,
}))

function makeTicket(overrides: Partial<TicketResponse>): TicketResponse {
  return {
    ticket_id: 'ticket-1',
    cliente_id: 'cliente-1',
    servicio_id: 'servicio-1',
    servicio_nombre: 'Reparación Dummy',
    tecnico_id: 'tecnico-1',
    dispositivo_id: 'disp-1',
    dispositivo_marca: 'HP',
    dispositivo_modelo: 'X1',
    dispositivo_foto_url: null,
    estado: 'EN_REVISION',
    descripcion: null,
    precio_base: '45.00',
    precio_final: null,
    motivo_rechazo: null,
    confirmado_tecnico: false,
    confirmado_cliente: false,
    fecha_finalizacion: null,
    creado_en: '2026-01-01T00:00:00Z',
    actualizado_en: null,
    garantia_fecha_inicio: null,
    garantia_fecha_vencimiento: null,
    garantia_usada: null,
    ...overrides,
  }
}

async function renderConTicket(overrides: Partial<TicketResponse>) {
  ticketQueryMock.mockReturnValue({
    data: makeTicket(overrides),
    isLoading: false,
    isError: false,
  })
  const { TicketDetalleTecnico } = await import('./detail')
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <TicketDetalleTecnico />
    </QueryClientProvider>
  )
}

describe('TicketDetalleTecnico — acciones visibles según estado', () => {
  it('EN_REVISION: muestra Aceptar y Rechazar, no otras acciones', async () => {
    const screen = await renderConTicket({ estado: 'EN_REVISION' })

    await expect
      .element(screen.getByRole('button', { name: 'Aceptar' }))
      .toBeVisible()
    await expect
      .element(screen.getByRole('button', { name: 'Rechazar' }))
      .toBeVisible()
    await expect
      .element(screen.getByRole('button', { name: 'Confirmar entrega' }))
      .not.toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Archivar' }))
      .not.toBeInTheDocument()
  })

  it('EN_ESPERA_PAGO: el técnico no tiene ninguna acción disponible', async () => {
    const screen = await renderConTicket({ estado: 'EN_ESPERA_PAGO' })

    await expect
      .element(screen.getByRole('button', { name: 'Aceptar' }))
      .not.toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Confirmar entrega' }))
      .not.toBeInTheDocument()
  })

  it('EN_PROGRESO sin confirmar por el técnico: muestra Confirmar entrega', async () => {
    const screen = await renderConTicket({
      estado: 'EN_PROGRESO',
      confirmado_tecnico: false,
    })

    await expect
      .element(screen.getByRole('button', { name: 'Confirmar entrega' }))
      .toBeVisible()
  })

  it('EN_PROGRESO ya confirmado por el técnico: NO vuelve a mostrar Confirmar entrega', async () => {
    const screen = await renderConTicket({
      estado: 'EN_PROGRESO',
      confirmado_tecnico: true,
    })

    await expect
      .element(screen.getByRole('button', { name: 'Confirmar entrega' }))
      .not.toBeInTheDocument()
  })

  it('FINALIZADO: no muestra acciones manuales de garantía/archivar (son automáticas)', async () => {
    const screen = await renderConTicket({
      estado: 'FINALIZADO',
      fecha_finalizacion: '2026-01-10T00:00:00Z',
      garantia_fecha_vencimiento: '2026-01-24T00:00:00Z',
    })

    await expect
      .element(screen.getByRole('button', { name: 'Registrar garantía' }))
      .not.toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Archivar' }))
      .not.toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Aceptar' }))
      .not.toBeInTheDocument()
    await expect.element(screen.getByText(/Garantía hasta/)).toBeVisible()
  })
})
