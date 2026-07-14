import type { Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const obtenerMeMock = vi.fn()
const registrarClienteMock = vi.fn()

vi.mock('./auth', () => ({
  obtenerMe: (...args: unknown[]) => obtenerMeMock(...args),
}))
vi.mock('./clientes', () => ({
  registrarCliente: (...args: unknown[]) => registrarClienteMock(...args),
}))
vi.mock('./supabase-client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

function axiosError404() {
  const err = new Error('Not Found') as Error & {
    isAxiosError: true
    response: { status: number }
  }
  err.isAxiosError = true
  err.response = { status: 404 }
  return err
}

async function importAuthSession() {
  const mod = await import('./auth-session')
  const { useAuthStore } = await import('@/stores/auth-store')
  return { ...mod, useAuthStore }
}

function sesionCon(rol: string): Session {
  return {
    access_token: 'tok-123',
    user: { user_metadata: { rol } },
  } as unknown as Session
}

describe('hidratarSesion — auto-aprovisionamiento (Fase 1)', () => {
  beforeEach(() => {
    vi.resetModules()
    obtenerMeMock.mockReset()
    registrarClienteMock.mockReset()
  })

  it('usa el perfil de /auth/me directo cuando la fila ya existe', async () => {
    obtenerMeMock.mockResolvedValueOnce({
      id: '1',
      nombre: 'Ana',
      email: 'a@x.com',
      rol: 'cliente',
    })
    const { hidratarSesion } = await importAuthSession()

    const perfil = await hidratarSesion(sesionCon('cliente'))

    expect(perfil.nombre).toBe('Ana')
    expect(registrarClienteMock).not.toHaveBeenCalled()
    expect(obtenerMeMock).toHaveBeenCalledTimes(1)
  })

  it('cliente nuevo (404) dispara auto-registro y reintenta /auth/me una sola vez', async () => {
    obtenerMeMock
      .mockRejectedValueOnce(axiosError404())
      .mockResolvedValueOnce({
        id: '2',
        nombre: 'Nuevo',
        email: 'n@x.com',
        rol: 'cliente',
      })
    registrarClienteMock.mockResolvedValueOnce(undefined)
    const { hidratarSesion, useAuthStore } = await importAuthSession()

    const perfil = await hidratarSesion(sesionCon('cliente'))

    expect(registrarClienteMock).toHaveBeenCalledTimes(1)
    expect(obtenerMeMock).toHaveBeenCalledTimes(2)
    expect(perfil.nombre).toBe('Nuevo')
    expect(useAuthStore.getState().auth.user?.nombre).toBe('Nuevo')
  })

  it('técnico sin fila (404) NO autoregistra — lanza PerfilNoProvisionadoError', async () => {
    obtenerMeMock.mockRejectedValueOnce(axiosError404())
    const { hidratarSesion, PerfilNoProvisionadoError } =
      await importAuthSession()

    await expect(hidratarSesion(sesionCon('tecnico'))).rejects.toBeInstanceOf(
      PerfilNoProvisionadoError
    )
    expect(registrarClienteMock).not.toHaveBeenCalled()
  })

  it('propaga errores que no son 404 sin intentar autoregistro', async () => {
    obtenerMeMock.mockRejectedValueOnce(new Error('500 boom'))
    const { hidratarSesion } = await importAuthSession()

    await expect(hidratarSesion(sesionCon('cliente'))).rejects.toThrow(
      '500 boom'
    )
    expect(registrarClienteMock).not.toHaveBeenCalled()
  })
})
