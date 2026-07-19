import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Power } from 'lucide-react'
import { type Servicio } from '@/api/catalogo'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTableColumnHeader } from '@/components/data-table'

const tipoServicioLabels: Record<Servicio['tipo_servicio'], string> = {
  PREVENTIVO: 'Preventivo',
  CORRECTIVO: 'Correctivo',
  SUSCRIPCION_SOFTWARE: 'Suscripción software',
  OTROS: 'Otros',
}

type ColumnsActions = {
  onEdit: (servicio: Servicio) => void
  onToggleActivo: (servicio: Servicio) => void
}

export function getCatalogoColumns({
  onEdit,
  onToggleActivo,
}: ColumnsActions): ColumnDef<Servicio>[] {
  return [
    {
      accessorKey: 'nombre',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Nombre' />
      ),
      cell: ({ row }) => (
        <div className='ps-3 font-medium'>{row.getValue('nombre')}</div>
      ),
      meta: { className: 'ps-3' },
      enableHiding: false,
    },
    {
      accessorKey: 'tipo_servicio',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Tipo' />
      ),
      cell: ({ row }) => tipoServicioLabels[row.original.tipo_servicio],
    },
    {
      accessorKey: 'precio_base',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Precio base' />
      ),
      cell: ({ row }) => <div>S/ {row.getValue('precio_base')}</div>,
    },
    {
      accessorKey: 'activo',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Estado' />
      ),
      cell: ({ row }) => {
        const activo = row.getValue('activo')
        return (
          <Badge
            variant='outline'
            className={cn(
              activo
                ? 'border-teal-200 bg-teal-100/30 text-teal-900 dark:text-teal-200'
                : 'border-neutral-300 bg-neutral-300/40'
            )}
          >
            {activo ? 'Activo' : 'Inactivo'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Abrir menú</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleActivo(row.original)}>
              <Power /> {row.original.activo ? 'Desactivar' : 'Activar'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
