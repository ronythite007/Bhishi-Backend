export default function HomePage() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: 24 }}>
      <img
        src="/logo.png"
        alt="Chitti Bhishi logo"
        width={96}
        height={96}
        style={{ display: "block", marginBottom: 16 }}
      />
      <h1>Chitti Bhishi Next.js API</h1>
      <p>Use API routes:</p>
      <ul>
        <li>/api/health</li>
        <li>/api/funds</li>
      </ul>
    </main>
  );
}
