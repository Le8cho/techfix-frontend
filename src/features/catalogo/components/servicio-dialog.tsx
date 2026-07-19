import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  type Servicio,
  type TipoServicio,
  useActualizarServicioMutation,
  useCrearServicioMutation,
} from '@/api/catalogo'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const tipoServicioOptions: { value: TipoServicio; label: string }[] = [
  { value: 'PREVENTIVO', label: 'Preventivo' },
  { value: 'CORRECTIVO', label: 'Correctivo' },
  { value: 'SUSCRIPCION_SOFTWARE', label: 'Suscripción software' },
  { value: 'OTROS', label: 'Otros' },
]

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.').max(120),
  tipo_servicio: z.enum([
    'PREVENTIVO',
    'CORRECTIVO',
    'SUSCRIPCION_SOFTWARE',
    'OTROS',
  ]),
  precio_base: z.number().positive('El precio debe ser mayor a 0.'),
})
type ServicioForm = z.infer<typeof formSchema>

type ServicioDialogProps = {
  currentRow?: Servicio
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ServicioDialog({
  currentRow,
  open,
  onOpenChange,
}: ServicioDialogProps) {
  const isEdit = !!currentRow
  const crear = useCrearServicioMutation()
  const actualizar = useActualizarServicioMutation()

  const form = useForm<ServicioForm>({
    resolver: zodResolver(formSchema),
    defaultValues: currentRow
      ? {
          nombre: currentRow.nombre,
          tipo_servicio: currentRow.tipo_servicio,
          precio_base: Number(currentRow.precio_base),
        }
      : { nombre: '', tipo_servicio: 'PREVENTIVO', precio_base: 0 },
  })

  const isPending = crear.isPending || actualizar.isPending

  const onSubmit = (values: ServicioForm) => {
    const mutation = isEdit
      ? actualizar.mutateAsync({
          servicioId: currentRow.servicio_id,
          body: values,
        })
      : crear.mutateAsync(values)

    mutation
      .then(() => {
        toast.success(isEdit ? 'Servicio actualizado.' : 'Servicio creado.')
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
          <DialogTitle>
            {isEdit ? 'Editar servicio' : 'Nuevo servicio'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualiza los datos del servicio.'
              : 'Agrega un servicio al catálogo.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='servicio-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='nombre'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder='Mantenimiento preventivo' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='tipo_servicio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tipoServicioOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
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
              name='precio_base'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio base (S/)</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.01'
                      min='0'
                      {...field}
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
          <Button type='submit' form='servicio-form' disabled={isPending}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
