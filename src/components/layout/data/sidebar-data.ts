import {
  LayoutDashboard,
  ListTodo,
  Monitor,
  Package,
  User,
  Users,
  Wrench,
} from 'lucide-react'
import { type Rol } from '@/stores/auth-store'
import { type SidebarData } from '../types'

export function getSidebarData(
  rol: Rol,
  user: { nombre: string; email: string }
): SidebarData {
  const navGroups: SidebarData['navGroups'] =
    rol === 'tecnico'
      ? [
          {
            title: 'TechFix',
            items: [
              { title: 'Dashboard', url: '/tecnico', icon: LayoutDashboard },
              { title: 'Clientes', url: '/tecnico/clientes', icon: Users },
              {
                title: 'Dispositivos',
                url: '/tecnico/dispositivos',
                icon: Monitor,
              },
              { title: 'Tickets', url: '/tecnico/tickets', icon: ListTodo },
              { title: 'Catálogo', url: '/tecnico/catalogo', icon: Package },
              { title: 'Mi perfil', url: '/tecnico/perfil', icon: User },
            ],
          },
        ]
      : [
          {
            title: 'TechFix',
            items: [
              { title: 'Dashboard', url: '/cliente', icon: LayoutDashboard },
              {
                title: 'Mis dispositivos',
                url: '/cliente/dispositivos',
                icon: Monitor,
              },
              { title: 'Mis tickets', url: '/cliente/tickets', icon: ListTodo },
              { title: 'Mi perfil', url: '/cliente/perfil', icon: User },
            ],
          },
        ]

  return {
    user: { name: user.nombre, email: user.email, avatar: '' },
    teams: [
      {
        name: 'TechFix',
        logo: Wrench,
        plan: rol === 'tecnico' ? 'Panel técnico' : 'Portal cliente',
      },
    ],
    navGroups,
  }
}
