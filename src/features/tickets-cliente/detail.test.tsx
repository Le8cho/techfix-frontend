import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import type { TicketResponse } from '@/api/tickets'

const ticketQueryMock = vi.fn()
const inertMutation = () => ({ mutateAsync: vi.fn(), isPending: false })

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>()
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
    useConfirmarRecepcionMutation: inertMutation,
    useReabrirTicketMutation: inertMutation,
  }
})

vi.mock('@/api/payments', () => ({
  useCrearPreferenciaMutation: inertMutation,
}))

vi.mock('@mercadopago/sdk-react', () => ({
  Wallet: () => null,
}))

vi.mock('@/features/ticket-adjuntos', () => ({
  AdjuntosSection: () => null,
}))

vi.mock('@/components/layout/header', () => ({
  Header: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))
vi.mock('@/components/layout/main', () => ({
  Main: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
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
    ...overrides,
  }
}

async function renderConTicket(overrides: Partial<TicketResponse>) {
  ticketQueryMock.mockReturnValue({
    data: makeTicket(overrides),
    isLoading: false,
    isError: false,
  })
  const { TicketDetalleCliente } = await import('./detail')
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <TicketDetalleCliente />
    </QueryClientProvider>
  )
}

describe('TicketDetalleCliente — acciones visibles según estado', () => {
  it('EN_ESPERA_PAGO: muestra el botón Pagar', async () => {
    const screen = await renderConTicket({ estado: 'EN_ESPERA_PAGO' })

    await expect
      .element(screen.getByRole('button', { name: 'Pagar' }))
      .toBeVisible()
  })

  it('EN_REVISION: el cliente no tiene ninguna acción disponible', async () => {
    const screen = await renderConTicket({ estado: 'EN_REVISION' })

    await expect
      .element(screen.getByRole('button', { name: 'Pagar' }))
      .not.toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Confirmar recepción' }))
      .not.toBeInTheDocument()
  })

  it('EN_PROGRESO confirmado por técnico y no por cliente: muestra Confirmar recepción', async () => {
    const screen = await renderConTicket({
      estado: 'EN_PROGRESO',
      confirmado_tecnico: true,
      confirmado_cliente: false,
    })

    await expect
      .element(screen.getByRole('button', { name: 'Confirmar recepción' }))
      .toBeVisible()
  })

  it('EN_PROGRESO sin confirmar por el técnico: NO muestra Confirmar recepción', async () => {
    const screen = await renderConTicket({
      estado: 'EN_PROGRESO',
      confirmado_tecnico: false,
      confirmado_cliente: false,
    })

    await expect
      .element(screen.getByRole('button', { name: 'Confirmar recepción' }))
      .not.toBeInTheDocument()
  })

  it('EN_PROGRESO ya confirmado por ambos: NO vuelve a mostrar Confirmar recepción', async () => {
    const screen = await renderConTicket({
      estado: 'EN_PROGRESO',
      confirmado_tecnico: true,
      confirmado_cliente: true,
    })

    await expect
      .element(screen.getByRole('button', { name: 'Confirmar recepción' }))
      .not.toBeInTheDocument()
  })

  it('FINALIZADO: muestra Reportar incidente (garantía)', async () => {
    const screen = await renderConTicket({ estado: 'FINALIZADO' })

    await expect
      .element(
        screen.getByRole('button', { name: 'Reportar incidente (garantía)' })
      )
      .toBeVisible()
  })

  it('RECHAZADO: no expone motivo_rechazo ni acciones (el cliente se entera por email)', async () => {
    const screen = await renderConTicket({
      estado: 'RECHAZADO',
      motivo_rechazo: null,
    })

    await expect
      .element(screen.getByRole('button', { name: 'Pagar' }))
      .not.toBeInTheDocument()
  })
})
