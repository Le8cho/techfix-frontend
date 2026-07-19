import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useReabrirTicketMutation } from '@/api/tickets'
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
import { Textarea } from '@/components/ui/textarea'

const formSchema = z.object({
  descripcion: z
    .string()
    .min(10, 'Describe el problema con al menos 10 caracteres.')
    .max(1000),
})
type ReportarIncidenteForm = z.infer<typeof formSchema>

type ReportarIncidenteDialogProps = {
  ticketId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportarIncidenteDialog({
  ticketId,
  open,
  onOpenChange,
}: ReportarIncidenteDialogProps) {
  const reabrir = useReabrirTicketMutation()
  const form = useForm<ReportarIncidenteForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { descripcion: '' },
  })

  const onSubmit = (values: ReportarIncidenteForm) => {
    reabrir
      .mutateAsync({ ticketId, descripcion: values.descripcion })
      .then(() => {
        toast.success(
          'Ticket reabierto por garantía. Ya puedes adjuntar imágenes del problema.'
        )
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
          <DialogTitle>Reportar incidente por garantía</DialogTitle>
          <DialogDescription>
            Cuéntanos qué problema presenta el equipo. El ticket se reabrirá
            para que el técnico lo revise nuevamente; luego podrás adjuntar
            fotos del problema.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='reportar-incidente-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='descripcion'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción del problema</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
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
            form='reportar-incidente-form'
            disabled={reabrir.isPending}
          >
            Reportar incidente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
