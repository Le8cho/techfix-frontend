import { isRedirect } from '@tanstack/react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '@/stores/auth-store'

async function importGuard() {
  const { useAuthStore } = await import('@/stores/auth-store')
  const { Route } = await import('./route')
  return { useAuthStore, Route }
}

const tecnico: AuthUser = {
  id: 't1',
  nombre: 'Tec',
  email: 'tec@example.com',
  rol: 'tecnico',
}
const cliente: AuthUser = {
  id: 'c1',
  nombre: 'Cli',
  email: 'cli@example.com',
  rol: 'cliente',
}

describe('/_authenticated/cliente route guard', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('deja pasar a un usuario con rol cliente', async () => {
    const { useAuthStore, Route } = await importGuard()
    useAuthStore.getState().auth.setSession('token', cliente)

    expect(() => Route.options.beforeLoad?.({} as never)).not.toThrow()
  })

  it('redirige a /403 a un usuario con rol tecnico', async () => {
    const { useAuthStore, Route } = await importGuard()
    useAuthStore.getState().auth.setSession('token', tecnico)

    try {
      Route.options.beforeLoad?.({} as never)
      expect.fail('el guard debería haber lanzado un redirect')
    } catch (err) {
      expect(isRedirect(err)).toBe(true)
      expect((err as { options: { to?: string } }).options.to).toBe('/403')
    }
  })
})
