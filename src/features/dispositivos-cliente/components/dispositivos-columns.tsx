import { format } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { type Dispositivo } from '@/api/dispositivos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTableColumnHeader } from '@/components/data-table'
import { DispositivoFoto } from '@/components/dispositivo-foto'
import { LongText } from '@/components/long-text'

type ColumnsActions = {
  onEdit: (dispositivo: Dispositivo) => void
  onDelete: (dispositivo: Dispositivo) => void
}

export function getDispositivosColumns({
  onEdit,
  onDelete,
}: ColumnsActions): ColumnDef<Dispositivo>[] {
  return [
    {
      id: 'foto',
      header: '',
      cell: ({ row }) => (
        <DispositivoFoto
          dispositivoId={row.original.dispositivo_id}
          tieneFoto={!!row.original.foto_url}
          className='h-10 w-10'
        />
      ),
      meta: { className: 'ps-3' },
      enableHiding: false,
    },
    {
      id: 'marcaModelo',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Dispositivo' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-48 ps-3 font-medium'>
          {row.original.marca} {row.original.modelo}
        </LongText>
      ),
      meta: { className: 'ps-3' },
      enableHiding: false,
    },
    {
      id: 'tipo',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Tipo' />
      ),
      cell: ({ row }) => <div>{row.original.tipo_dispositivo.nombre}</div>,
    },
    {
      accessorKey: 'numero_serie',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='N° de serie' />
      ),
      cell: ({ row }) => (
        <div className='text-nowrap'>{row.getValue('numero_serie') ?? '—'}</div>
      ),
    },
    {
      accessorKey: 'activo',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Estado' />
      ),
      cell: ({ row }) => (
        <Badge variant='outline'>
          {row.getValue('activo') ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      accessorKey: 'creado_en',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Registrado' />
      ),
      cell: ({ row }) => (
        <div className='text-nowrap'>
          {format(new Date(row.getValue('creado_en')), 'dd/MM/yyyy')}
        </div>
      ),
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
            <DropdownMenuItem
              variant='destructive'
              onClick={() => onDelete(row.original)}
            >
              <Trash2 /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
