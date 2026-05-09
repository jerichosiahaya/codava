import { apiBase } from '../lib';

export default function Signin() {
  return (
    <div className="container">
      <h1>Codava</h1>
      <p className="empty">Strava for coders. Sign in to track your coding time.</p>
      <p style={{ marginTop: '2rem' }}>
        <a href={`${apiBase()}/auth/github/start`} className="button">
          Sign in with GitHub
        </a>
      </p>
    </div>
  );
}
