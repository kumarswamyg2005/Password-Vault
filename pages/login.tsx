import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      const j = await res.json();
      localStorage.setItem('authToken', j.token);
      localStorage.setItem('encSalt', j.encSalt);
      localStorage.setItem('encIterations', String(j.encIterations));
      router.push('/');
    } else {
      alert('login failed');
    }
  }

  return (
    <div style={{maxWidth:600, margin:'40px auto'}}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <label>Email<br/><input value={email} onChange={e=>setEmail(e.target.value)} /></label><br/>
        <label>Password<br/><input value={password} onChange={e=>setPassword(e.target.value)} type="password" /></label><br/>
        <button type="submit">Log in</button>
      </form>
    </div>
  );
}
