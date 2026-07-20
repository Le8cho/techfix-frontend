import { useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { type Servicio, useServiciosQuery } from '@/api/catalogo'
import { useDispositivosQuery } from '@/api/dispositivos'
import { useCrearTicketMutation } from '@/api/tickets'
import { handleServerError } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

function buildFormSchema(servicios: Servicio[]) {
  return z
    .object({
      dispositivo_id: z.string().min(1, 'Selecciona un dispositivo.'),
      servicio_id: z.string().min(1, 'Selecciona un servicio.'),
      descripcion: z.string().max(1000).optional(),
    })
    .superRefine((data, ctx) => {
      const servicio = servicios.find((s) => s.servicio_id === data.servicio_id)
      if (servicio?.tipo_servicio === 'OTROS' && !data.descripcion?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['descripcion'],
          message:
            'Describe el problema para que el técnico pueda definir el precio.',
        })
      }
    })
}
type CrearTicketForm = z.infer<ReturnType<typeof buildFormSchema>>

type CrearTicketDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CrearTicketDialog({
  open,
  onOpenChange,
}: CrearTicketDialogProps) {
  const navigate = useNavigate()
  const { data: dispositivos } = useDispositivosQuery()
  const { data: servicios } = useServiciosQuery()
  const crear = useCrearTicketMutation()

  const formSchema = useMemo(
    () => buildFormSchema(servicios ?? []),
    [servicios]
  )
  const form = useForm<CrearTicketForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { dispositivo_id: '', servicio_id: '', descripcion: '' },
  })
  const servicioSeleccionado = servicios?.find(
    (s) => s.servicio_id === form.watch('servicio_id')
  )
  const esOtros = servicioSeleccionado?.tipo_servicio === 'OTROS'

  // "Otros" siempre al final: el resto mantiene el orden alfabético que ya
  // devuelve el backend (sort es estable).
  const serviciosOrdenados = [...(servicios ?? [])].sort((a, b) => {
    if (a.tipo_servicio === 'OTROS') return 1
    if (b.tipo_servicio === 'OTROS') return -1
    return 0
  })

  const onSubmit = (values: CrearTicketForm) => {
    crear
      .mutateAsync(values)
      .then((ticket) => {
        toast.success('Ticket creado.')
        form.reset()
        onOpenChange(false)
        navigate({
          to: '/cliente/tickets/$ticketId',
          params: { ticketId: ticket.ticket_id },
        })
      })
      .catch(handleServerError)
  }

  const sinDispositivos = (dispositivos?.length ?? 0) === 0

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>Nuevo ticket</DialogTitle>
          <DialogDescription>
            Elige el dispositivo y el servicio que necesitas.
          </DialogDescription>
        </DialogHeader>
        {sinDispositivos ? (
          <p className='text-sm text-muted-foreground'>
            Todavía no registraste ningún dispositivo. Andá a "Mis dispositivos"
            para agregar uno antes de crear un ticket.
          </p>
        ) : (
          <Form {...form}>
            <form
              id='crear-ticket-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='dispositivo_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dispositivo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Selecciona un dispositivo' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dispositivos?.map((d) => (
                          <SelectItem
                            key={d.dispositivo_id}
                            value={d.dispositivo_id}
                          >
                            {d.marca} {d.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='servicio_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servicio</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Selecciona un servicio' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviciosOrdenados.map((s) => (
                          <SelectItem key={s.servicio_id} value={s.servicio_id}>
                            {s.nombre}
                            {s.tipo_servicio !== 'OTROS' && ` — S/ ${s.precio_base}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='descripcion'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Descripción {esOtros ? '' : '(opcional)'}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={
                          esOtros
                            ? 'Describe el problema para que el técnico defina el precio…'
                            : 'Contanos qué le pasa a tu equipo…'
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}
        {!sinDispositivos && (
          <DialogFooter>
            <Button
              type='submit'
              form='crear-ticket-form'
              disabled={crear.isPending}
            >
              Crear ticket
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
