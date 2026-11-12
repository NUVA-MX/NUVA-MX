import { revalidatePath } from 'next/cache';

/** Pages that render encargo content (Merch and the Promocionales carousel) plus the admin screens. */
export function refresh(): void {
  revalidatePath('/encargo');
  revalidatePath('/existencia');
  revalidatePath('/admin/encargo');
  revalidatePath('/admin/proyectos');
}
