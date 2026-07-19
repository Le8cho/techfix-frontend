import { useFotoDispositivoQuery } from '@/api/dispositivos'
import { cn } from '@/lib/utils'

type DispositivoFotoProps = {
  dispositivoId: string | null
  tieneFoto: boolean
  className?: string
}

/**
 * El contenedor de blobs es privado (ver blob_storage.py), así que la foto
 * nunca se sirve desde su URL cruda: siempre se pide una SAS URL vía
 * GET /dispositivos/{id}/foto antes de renderizarla.
 */
export function DispositivoFoto({
  dispositivoId,
  tieneFoto,
  className,
}: DispositivoFotoProps) {
  const { data } = useFotoDispositivoQuery(
    dispositivoId ?? '',
    !!dispositivoId && tieneFoto
  )

  if (!tieneFoto || !data?.url) return null

  return (
    <img
      src={data.url}
      alt='Foto del dispositivo'
      className={cn('rounded-md border object-cover', className)}
    />
  )
}
