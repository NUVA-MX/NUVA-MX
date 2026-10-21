// Creates or updates (password reset) an admin user.
// Usage: npm run admin:create -- --email you@example.com
// The password is prompted hidden; for non-interactive use, pass ADMIN_PASSWORD in the environment.
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { adminUsers, sessions } from '../src/lib/db/schema';
import { BCRYPT_COST, MIN_PASSWORD_LENGTH, isEmailAllowed, normalizeEmail } from '../src/lib/auth/emails';
import { createPool, requireDatabaseUrl } from './_env';

function argValue(flag: string): string | undefined {
  const args = process.argv.slice(2);
  const i = args.indexOf(flag);
  if (i >= 0) return args[i + 1];
  const inline = args.find((a) => a.startsWith(`${flag}=`));
  return inline?.slice(flag.length + 1);
}

function fail(message: string): never {
  console.error(`[admin:create] ${message}`);
  process.exit(1);
}

/** Reads a line without echoing it to the terminal. */
function promptHidden(question: string): Promise<string> {
  if (!process.stdin.isTTY) {
    fail('No hay terminal interactiva. Usa ADMIN_PASSWORD=… para modo no interactivo.');
  }
  let muted = false;
  const output = new Writable({
    write(chunk, _encoding, callback) {
      if (!muted) process.stdout.write(chunk);
      callback();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
    muted = true;
  });
}

async function main() {
  const rawEmail = argValue('--email');
  if (!rawEmail) fail('Falta --email. Ejemplo: npm run admin:create -- --email tu@correo.com');
  const email = normalizeEmail(rawEmail);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('El correo no es válido.');
  if (!isEmailAllowed(email, process.env.ADMIN_EMAILS)) {
    fail('Ese correo no está en ADMIN_EMAILS. Agrégalo primero (en Vercel y en .env.local).');
  }

  const url = requireDatabaseUrl('admin:create');

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    password = await promptHidden('Contraseña (mínimo 12 caracteres): ');
    const confirm = await promptHidden('Repite la contraseña: ');
    if (password !== confirm) fail('Las contraseñas no coinciden.');
  }
  if (password.length < MIN_PASSWORD_LENGTH) fail(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const pool = createPool(url);
  try {
    const db = drizzle(pool);
    const [user] = await db
      .insert(adminUsers)
      .values({ email, passwordHash })
      .onConflictDoUpdate({
        target: adminUsers.email,
        set: { passwordHash, failedAttempts: 0, lockedUntil: null },
      })
      .returning({ id: adminUsers.id });
    // A password reset closes open sessions.
    await db.delete(sessions).where(eq(sessions.userId, user.id));
    console.log(`[admin:create] Listo: ${email} puede iniciar sesión en /admin/login.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[admin:create] Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
