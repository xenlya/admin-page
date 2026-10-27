'use client';
import { signIn } from 'next-auth/react';
export default function Login() { return <main className="shell narrow"><div className="panel"><div className="eyebrow">
    Restricted access</div><h1>SE / Registrar Office</h1><p>Sign in with your authorised university Microsoft account to access administrative attendance previews.
        </p><button onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}>Sign in with Microsoft</button><p className="muted">Access is restricted to explicitly approved staff accounts. Student accounts are not permitted.</p></div></main>; }
