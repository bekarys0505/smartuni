
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || 'Email немесе пароль қате',
        );
      }

      localStorage.setItem(
        'accessToken',
        data.accessToken,
      );

      localStorage.setItem(
        'smartuniUser',
        JSON.stringify(data.user),
      );

      navigate('/student/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Жүйеге кіру кезінде қате орын алды');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <a href="/" className="logo">
            <span className="logo-mark">S</span>
            <span className="logo-text">SmartUni</span>
          </a>

          <h1>Оқуыңа қайта орал</h1>

          <p>
            Пәндеріңе, тапсырмаларыңа және оқу прогресіңе
            бір жерден қол жеткіз.
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Жүйеге кіру</h2>
            <p>SmartUni аккаунтыңа кір</p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleLogin}
          >
            <label>
              Email

              <input
                type="email"
                placeholder="example@mail.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />
            </label>

            <label>
              Құпиясөз

              <input
                type="password"
                placeholder="Құпиясөзіңді енгіз"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />
            </label>

            <div className="auth-options">
              <label className="remember">
                <input type="checkbox" />
                <span>Мені есте сақта</span>
              </label>

              <button
                type="button"
                className="forgot-button"
              >
                Құпиясөзді ұмыттың ба?
              </button>
            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="primary-button auth-submit"
              disabled={loading}
            >
              {loading ? 'Кіру орындалуда...' : 'Кіру'}
            </button>
          </form>

          <div className="auth-divider">
            <span>немесе</span>
          </div>

          <p className="register-link">
            Аккаунтың жоқ па?{' '}

            <button
              type="button"
              onClick={() => navigate('/register')}
            >
              Тіркелу
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;

