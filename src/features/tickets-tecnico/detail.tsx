import { useState } from 'react'
import { format } from 'date-fns'
import { getRouteApi } from '@tanstack/react-router'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useConfirmarEntregaMutation, useTicketQuery } from '@/api/tickets'
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
import { AceptarDialog } from './components/aceptar-dialog'
import { RechazarDialog } from './components/rechazar-dialog'

const route = getRouteApi('/_authenticated/tecnico/tickets/$ticketId')

export function TicketDetalleTecnico() {
  const { ticketId } = route.useParams()
  const navigate = route.useNavigate()
  const { data: ticket, isLoading, isError } = useTicketQuery(ticketId)

  const [aceptarOpen, setAceptarOpen] = useState(false)
  const [rechazarOpen, setRechazarOpen] = useState(false)
  const [entregaOpen, setEntregaOpen] = useState(false)

  const confirmarEntrega = useConfirmarEntregaMutation()

  const handleConfirmarEntrega = () => {
    confirmarEntrega
      .mutateAsync(ticketId)
      .then(() => {
        toast.success('Entrega confirmada.')
        setEntregaOpen(false)
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
          onClick={() => navigate({ to: '/tecnico/tickets' })}
        >
          <ArrowLeft /> Volver a tickets
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
                  <span className='text-muted-foreground'>Precio base: </span>
                  {ticket.precio_base ? `S/ ${ticket.precio_base}` : '—'}
                </div>
                <div>
                  <span className='text-muted-foreground'>Precio final: </span>
                  {ticket.precio_final ? `S/ ${ticket.precio_final}` : '—'}
                </div>
                <div>
                  <span className='text-muted-foreground'>
                    Confirmación técnico:{' '}
                  </span>
                  {ticket.confirmado_tecnico ? 'Sí' : 'No'}
                </div>
                <div>
                  <span className='text-muted-foreground'>
                    Confirmación cliente:{' '}
                  </span>
                  {ticket.confirmado_cliente ? 'Sí' : 'No'}
                </div>
                {ticket.estado === 'FINALIZADO' && ticket.fecha_finalizacion && (
                  <div>
                    <span className='text-muted-foreground'>
                      Fecha de entrega:{' '}
                    </span>
                    {format(new Date(ticket.fecha_finalizacion), 'dd/MM/yyyy')}
                  </div>
                )}
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
                    </div>
                  )}
              </CardContent>
            </Card>

            <div className='flex flex-wrap gap-2'>
              {ticket.estado === 'EN_REVISION' && (
                <>
                  <Button onClick={() => setAceptarOpen(true)}>Aceptar</Button>
                  <Button
                    variant='destructive'
                    onClick={() => setRechazarOpen(true)}
                  >
                    Rechazar
                  </Button>
                </>
              )}
              {ticket.estado === 'EN_PROGRESO' &&
                !ticket.confirmado_tecnico && (
                  <Button onClick={() => setEntregaOpen(true)}>
                    Confirmar entrega
                  </Button>
                )}
            </div>

            <AdjuntosSection
              ticketId={ticketId}
              puedeSubir={
                ticket.estado === 'EN_REVISION' ||
                ticket.estado === 'EN_PROGRESO'
              }
            />

            <AceptarDialog
              ticketId={ticketId}
              precioBase={ticket.precio_base}
              open={aceptarOpen}
              onOpenChange={setAceptarOpen}
            />
            <RechazarDialog
              ticketId={ticketId}
              open={rechazarOpen}
              onOpenChange={setRechazarOpen}
            />
            <ConfirmDialog
              open={entregaOpen}
              onOpenChange={setEntregaOpen}
              title='Confirmar entrega'
              desc='Esto marca que ya entregaste el equipo reparado al cliente. El ticket pasa a Finalizado cuando el cliente también confirme la recepción.'
              confirmText='Confirmar entrega'
              isLoading={confirmarEntrega.isPending}
              handleConfirm={handleConfirmarEntrega}
            />
          </>
        )}
      </Main>
    </>
  )
}
