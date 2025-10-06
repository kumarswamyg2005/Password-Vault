import { useEffect, useState, useMemo } from "react";
import {
  deriveKeyFromPassword,
  encryptJson,
  decryptJson,
} from "../utils/cryptoClient";
import { generatePassword } from "../utils/passwordGen";
import { useRouter } from "next/router";

type VaultItem = {
  _id: string;
  ciphertext: string;
  iv: string;
  createdAt: string;
  updatedAt?: string;
};

export default function Vault() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [salt, setSalt] = useState<string | null>(null);
  const [iterations, setIterations] = useState<number | null>(null);
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [password, setPassword] = useState("");
  const [items, setItems] = useState<VaultItem[]>([]);
  const [decrypted, setDecrypted] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [copyCleared, setCopyCleared] = useState(false);
  const [genOpts, setGenOpts] = useState({
    length: 16,
    lower: true,
    upper: true,
    numbers: true,
    symbols: true,
    excludeLookAlikes: true,
  });
  const [generated, setGenerated] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("authToken");
    const s = localStorage.getItem("encSalt");
    const it = Number(localStorage.getItem("encIterations") || "0");
    setToken(t);
    setSalt(s);
    setIterations(it || null);
    if (!t) router.push("/login");
  }, []);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (!salt || !iterations) return alert("missing salt/iterations");
    const k = await deriveKeyFromPassword(password, salt, iterations);
    setKey(k);
    const res = await fetch("/api/vault", {
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    });
    if (!res.ok) return alert("failed to load vault");
    const arr: VaultItem[] = await res.json();
    setItems(arr);
    const decs: Record<string, any> = {};
    for (const it of arr) {
      try {
        decs[it._id] = await decryptJson(k, it.ciphertext, it.iv);
      } catch (err) {
        decs[it._id] = { error: "decrypt failed" };
      }
    }
    setDecrypted(decs);
  }

  async function saveItem(
    data: {
      title: string;
      username: string;
      password: string;
      url: string;
      notes: string;
    },
    id?: string
  ) {
    if (!key) return alert("unlock first");
    const enc = await encryptJson(key, data);

    let res;
    if (id) {
      res = await fetch(`/api/vault/${id}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(enc),
      });
    } else {
      res = await fetch(`/api/vault`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(enc),
      });
    }
    if (!res.ok) return alert("save failed");
    const updated = await res.json();
    setItems((prev) =>
      id ? prev.map((it) => (it._id === id ? updated : it)) : [updated, ...prev]
    );
    setDecrypted((prev) => ({ ...prev, [updated._id]: data }));
  }

  async function addItem() {
    const title = prompt("Title") || "";
    const username = prompt("Username") || "";
    const pwd =
      prompt("Password (leave blank to generate)") ||
      generatePassword(16, genOpts);
    const url = prompt("URL") || "";
    const notes = prompt("Notes") || "";
    await saveItem({ title, username, password: pwd, url, notes });
  }

  async function editItem(id: string) {
    const cur = decrypted[id];
    if (!cur) return alert("cannot edit (no decrypted value)");
    const title = prompt("Title", cur.title) || cur.title;
    const username = prompt("Username", cur.username) || cur.username;
    const passwordVal = prompt("Password", cur.password) || cur.password;
    const url = prompt("URL", cur.url) || cur.url;
    const notes = prompt("Notes", cur.notes) || cur.notes;
    await saveItem({ title, username, password: passwordVal, url, notes }, id);
  }

  async function delItem(id: string) {
    if (!confirm("Delete?")) return;
    const res = await fetch(`/api/vault/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    });
    if (res.status === 204) {
      setItems((prev) => prev.filter((it) => it._id !== id));
      const copy = { ...decrypted };
      delete copy[id];
      setDecrypted(copy);
    } else alert("delete failed");
  }

  function doGenerate() {
    const s = generatePassword(genOpts.length, genOpts);
    setGenerated(s);
    navigator.clipboard.writeText(s);
    setCopyCleared(false);
    setTimeout(() => {
      setGenerated(""); // clear the displayed password
      setCopyCleared(true); // show message that password is cleared
    }, 15000);
  }

  const shown = useMemo(() => {
    if (!search) return items;
    return items.filter((it) => {
      const d = decrypted[it._id];
      if (!d) return false;
      const q = search.toLowerCase();
      return (
        (d.title && d.title.toLowerCase().includes(q)) ||
        (d.username && d.username.toLowerCase().includes(q)) ||
        (d.url && d.url.toLowerCase().includes(q))
      );
    });
  }, [items, decrypted, search]);

  return (
    <div style={{ maxWidth: 960, margin: "20px auto", padding: 20 }}>
      <h1>Password Vault (MVP)</h1>
      {!key ? (
        <form onSubmit={unlock}>
          <p>
            Enter your password to unlock your vault (client-side decryption)
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your login password"
          />
          <button type="submit">Unlock</button>
        </form>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <button onClick={addItem}>+ Add item</button>
            <button
              onClick={() => {
                localStorage.removeItem("authToken");
                router.push("/login");
              }}
            >
              Logout
            </button>
            <input
              style={{ marginLeft: "auto" }}
              placeholder="Search title/username/url"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <section style={{ marginTop: 20 }}>
            <h3>Password generator</h3>
            <div>
              <label>
                Length:{" "}
                <input
                  type="range"
                  min={8}
                  max={64}
                  value={genOpts.length}
                  onChange={(e) =>
                    setGenOpts((s) => ({
                      ...s,
                      length: Number(e.target.value),
                    }))
                  }
                />{" "}
                {genOpts.length}
              </label>
              <br />
              <label>
                <input
                  type="checkbox"
                  checked={genOpts.lower}
                  onChange={(e) =>
                    setGenOpts((s) => ({ ...s, lower: e.target.checked }))
                  }
                />{" "}
                Lowercase
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={genOpts.upper}
                  onChange={(e) =>
                    setGenOpts((s) => ({ ...s, upper: e.target.checked }))
                  }
                />{" "}
                Uppercase
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={genOpts.numbers}
                  onChange={(e) =>
                    setGenOpts((s) => ({ ...s, numbers: e.target.checked }))
                  }
                />{" "}
                Numbers
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={genOpts.symbols}
                  onChange={(e) =>
                    setGenOpts((s) => ({ ...s, symbols: e.target.checked }))
                  }
                />{" "}
                Symbols
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={genOpts.excludeLookAlikes}
                  onChange={(e) =>
                    setGenOpts((s) => ({
                      ...s,
                      excludeLookAlikes: e.target.checked,
                    }))
                  }
                />{" "}
                Exclude lookalikes
              </label>
              <br />
              <button onClick={doGenerate}>
                Generate & Copy (15s auto-clear)
              </button>
              {generated && (
                <div>
                  <strong>{generated}</strong> (copied)
                </div>
              )}
              {copyCleared && (
                <div style={{ color: "gray" }}>Clipboard cleared</div>
              )}
            </div>
          </section>

          <section style={{ marginTop: 20 }}>
            <h3>Vault ({shown.length})</h3>
            {shown.map((it) => {
              const d = decrypted[it._id];
              return (
                <div
                  key={it._id}
                  style={{
                    border: "1px solid #ddd",
                    padding: 10,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: "flex" }}>
                    <div style={{ flex: 1 }}>
                      <strong>{d?.title || "Encrypted item"}</strong>
                      <br />
                      <small>{d?.username}</small>
                      <p style={{ marginTop: 8 }}>{d?.url}</p>
                    </div>
                    <div>
                      <button
                        onClick={() => {
                          if (d?.password) {
                            navigator.clipboard.writeText(d.password); // works immediately
                            alert(
                              "Copied! Clipboard cannot be auto-cleared due to browser security."
                            );
                          }
                        }}
                      >
                        Copy pwd
                      </button>
                      <button onClick={() => editItem(it._id)}>Edit</button>
                      <button onClick={() => delItem(it._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
