import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const hardcodedPassword = "demo123"; // <-- your single password

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === hardcodedPassword) {
      localStorage.setItem("authToken", "demo"); // dummy token
      router.push("/vault");
    } else {
      alert("Wrong password!");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", textAlign: "center" }}>
      <h1>Password Vault Demo</h1>
      <form onSubmit={handleLogin}>
        <input
          type="password"
          placeholder="Enter demo password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 8, width: "100%", marginBottom: 10 }}
        />
        <button type="submit" style={{ padding: 8, width: "100%" }}>
          Login
        </button>
      </form>
      <p>
        Use password: <strong>{hardcodedPassword}</strong>
      </p>
    </div>
  );
}
