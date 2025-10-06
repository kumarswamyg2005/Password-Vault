import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {'content-type':'application/json'},
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('encSalt', data.encSalt);
      localStorage.setItem('encIterations', String(data.encIterations));
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST', headers: {'content-type':'application/json'},
        body: JSON.stringify({ email, password })
      });
      if (loginRes.ok) {
        const j = await loginRes.json();
        localStorage.setItem('authToken', j.token);
        localStorage.setItem('encSalt', j.encSalt);
        localStorage.setItem('encIterations', String(j.encIterations));
        router.push('/');
      } else {
        alert('signup succeeded but automatic login failed');
      }
    } else {
      const err = await res.json();
      alert('error: ' + JSON.stringify(err));
    }
  }

  return (
    <div style={{maxWidth:600, margin:'40px auto'}}>
      <h2>Sign up</h2>
      <form onSubmit={submit}>
        <label>Email<br/><input value={email} onChange={e=>setEmail(e.target.value)} /></label><br/>
        <label>Password<br/><input value={password} onChange={e=>setPassword(e.target.value)} type="password" /></label><br/>
        <button type="submit">Create account</button>
      </form>
    </div>
  );
}
