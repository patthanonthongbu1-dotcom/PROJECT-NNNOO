import { cookies } from 'next/headers'
import { SiteShell } from '@/components/SiteShell'
import { EditModeProvider } from '@/components/edit/EditModeProvider'
import { isAdmin } from '@/lib/auth'
import { EDIT_MODE_COOKIE } from '@/lib/edit-mode'

export default async function SiteLayout({ children }: LayoutProps<'/'>) {
  const canEdit = await isAdmin()

  // The cookie read has to stay behind `canEdit`. With no Supabase project
  // configured `isAdmin()` answers false without touching cookies at all,
  // which is what lets the demo site keep prerendering.
  const editing =
    canEdit && (await cookies()).get(EDIT_MODE_COOKIE)?.value === '1'

  return (
    <EditModeProvider canEdit={canEdit} initialEditing={editing}>
      <SiteShell>{children}</SiteShell>
    </EditModeProvider>
  )
}
