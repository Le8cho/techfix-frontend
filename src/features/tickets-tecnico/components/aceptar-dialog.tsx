import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAceptarTicketMutation } from '@/api/tickets'
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
import { Input } from '@/components/ui/input'

const formSchema = z.object({
  precioFinal: z.number().positive('El precio debe ser mayor a 0.'),
})
type AceptarForm = z.infer<typeof formSchema>

type AceptarDialogProps = {
  ticketId: string
  precioBase: string | null
  servicioTipo: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AceptarDialog({
  ticketId,
  precioBase,
  servicioTipo,
  open,
  onOpenChange,
}: AceptarDialogProps) {
  const aceptar = useAceptarTicketMutation()
  // El servicio "Otros" no tiene un precio base real (el técnico lo define
  // recién acá), así que no se precarga: se deja vacío con un placeholder.
  const esOtros = servicioTipo === 'OTROS'
  const defaultPrecio = !esOtros && precioBase ? Number(precioBase) : undefined
  const form = useForm<AceptarForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { precioFinal: defaultPrecio },
  })

  useEffect(() => {
    if (open) {
      form.reset({ precioFinal: defaultPrecio })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, precioBase, servicioTipo])

  const onSubmit = (values: AceptarForm) => {
    aceptar
      .mutateAsync({ ticketId, precioFinal: values.precioFinal })
      .then(() => {
        toast.success('Ticket aceptado.')
        form.reset()
        onOpenChange(false)
      })
      .catch(handleServerError)
  }

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
          <DialogTitle>Aceptar ticket</DialogTitle>
          <DialogDescription>
            Define el precio final del servicio. El ticket pasará a estado
            "Espera de pago".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='aceptar-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='precioFinal'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio final (S/)</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.01'
                      min='0'
                      placeholder={esOtros ? '20' : undefined}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            type='submit'
            form='aceptar-form'
            disabled={aceptar.isPending}
          >
            Aceptar ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
