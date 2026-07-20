import { useState } from 'react'
import { format } from 'date-fns'
import { getRouteApi } from '@tanstack/react-router'
import { Wallet } from '@mercadopago/sdk-react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCrearPreferenciaMutation } from '@/api/payments'
import { useConfirmarRecepcionMutation, useTicketQuery } from '@/api/tickets'
import { handleServerError } from '@/lib/handle-server-error'
import { estadoTicketBadgeClass, estadoTicketLabels } from '@/lib/ticket-estado'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DispositivoFoto } from '@/components/dispositivo-foto'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { AdjuntosSection } from '@/features/ticket-adjuntos'
import { ReportarIncidenteDialog } from './components/reportar-incidente-dialog'

const route = getRouteApi('/_authenticated/cliente/tickets/$ticketId')

export function TicketDetalleCliente() {
  const { ticketId } = route.useParams()
  const navigate = route.useNavigate()
  const { data: ticket, isLoading, isError } = useTicketQuery(ticketId)

  const [recepcionOpen, setRecepcionOpen] = useState(false)
  const [reportarIncidenteOpen, setReportarIncidenteOpen] = useState(false)
  const [preferenceId, setPreferenceId] = useState<string | null>(null)

  const confirmarRecepcion = useConfirmarRecepcionMutation()
  const crearPreferencia = useCrearPreferenciaMutation()

  const handlePagar = () => {
    crearPreferencia
      .mutateAsync(ticketId)
      .then(({ preference_id }) => setPreferenceId(preference_id))
      .catch(handleServerError)
  }

  const handleConfirmarRecepcion = () => {
    confirmarRecepcion
      .mutateAsync(ticketId)
      .then(() => {
        toast.success('Recepción confirmada. ¡Gracias por confiar en TechFix!')
        setRecepcionOpen(false)
      })
      .catch(handleServerError)
  }

  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <Button
          variant='ghost'
          size='sm'
          className='w-fit'
          onClick={() => navigate({ to: '/cliente/tickets' })}
        >
          <ArrowLeft /> Volver a mis tickets
        </Button>

        {isLoading && (
          <div className='flex items-center gap-2 text-muted-foreground'>
            <Loader2 className='animate-spin' /> Cargando…
          </div>
        )}
        {isError && (
          <p className='text-muted-foreground'>No se encontró el ticket.</p>
        )}

        {ticket && (
          <>
            <Card>
              <CardHeader>
                <div className='flex flex-wrap items-center gap-2'>
                  <CardTitle className='text-xl'>
                    {ticket.dispositivo_marca && ticket.dispositivo_modelo
                      ? `${ticket.dispositivo_marca} ${ticket.dispositivo_modelo}`
                      : `Ticket #${ticket.ticket_id.slice(0, 8)}`}
                  </CardTitle>
                  <Badge
                    variant='outline'
                    className={cn(estadoTicketBadgeClass[ticket.estado])}
                  >
                    {estadoTicketLabels[ticket.estado]}
                  </Badge>
                </div>
                <CardDescription>
                  {ticket.servicio_nombre ?? 'Servicio'} · Creado el{' '}
                  {format(new Date(ticket.creado_en), 'dd/MM/yyyy HH:mm')}
                </CardDescription>
              </CardHeader>
              <CardContent className='grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2'>
                <DispositivoFoto
                  dispositivoId={ticket.dispositivo_id}
                  tieneFoto={!!ticket.dispositivo_foto_url}
                  className='col-span-full h-40 w-40'
                />
                <div>
                  <span className='text-muted-foreground'>Descripción: </span>
                  {ticket.descripcion ?? '—'}
                </div>
                <div>
                  <span className='text-muted-foreground'>Precio final: </span>
                  {ticket.precio_final ? `S/ ${ticket.precio_final}` : '—'}
                </div>
                {ticket.estado === 'FINALIZADO' &&
                  ticket.garantia_fecha_vencimiento && (
                    <div>
                      <span className='text-muted-foreground'>
                        Garantía hasta:{' '}
                      </span>
                      {format(
                        new Date(ticket.garantia_fecha_vencimiento),
                        'dd/MM/yyyy'
                      )}
                      {ticket.garantia_usada && ' (ya utilizada)'}
                    </div>
                  )}
              </CardContent>
            </Card>

            <div className='flex flex-wrap gap-2'>
              {ticket.estado === 'EN_ESPERA_PAGO' && !preferenceId && (
                <Button
                  onClick={handlePagar}
                  disabled={crearPreferencia.isPending}
                >
                  {crearPreferencia.isPending && (
                    <Loader2 className='animate-spin' />
                  )}
                  Pagar
                </Button>
              )}
              {ticket.estado === 'EN_PROGRESO' &&
                ticket.confirmado_tecnico &&
                !ticket.confirmado_cliente && (
                  <Button onClick={() => setRecepcionOpen(true)}>
                    Confirmar recepción
                  </Button>
                )}
              {ticket.estado === 'FINALIZADO' &&
                ticket.garantia_fecha_vencimiento &&
                !ticket.garantia_usada && (
                  <Button
                    variant='outline'
                    onClick={() => setReportarIncidenteOpen(true)}
                  >
                    Reportar incidente (garantía)
                  </Button>
                )}
            </div>

            {preferenceId && ticket.estado === 'EN_ESPERA_PAGO' && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Completar el pago</CardTitle>
                  <CardDescription>
                    Elegí tu método de pago para continuar. Se abrirá en una
                    pestaña nueva.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Wallet
                    initialization={{ preferenceId, redirectMode: 'blank' }}
                  />
                </CardContent>
              </Card>
            )}

            <AdjuntosSection
              ticketId={ticketId}
              puedeSubir={
                ticket.estado === 'EN_REVISION' ||
                ticket.estado === 'EN_PROGRESO'
              }
            />

            <ConfirmDialog
              open={recepcionOpen}
              onOpenChange={setRecepcionOpen}
              title='Confirmar recepción'
              desc='Confirmá que ya recibiste tu equipo y que el servicio quedó conforme. El ticket pasará a Finalizado.'
              confirmText='Confirmar recepción'
              isLoading={confirmarRecepcion.isPending}
              handleConfirm={handleConfirmarRecepcion}
            />
            <ReportarIncidenteDialog
              ticketId={ticketId}
              open={reportarIncidenteOpen}
              onOpenChange={setReportarIncidenteOpen}
            />
          </>
        )}
      </Main>
    </>
  )
}
