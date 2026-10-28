import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';

interface UniversityItem {
  id: string;
  name: string;
  shortName: string | null;
}

interface FacultyItem {
  id: string;
  name: string;
  universityId: string;
}

interface MajorItem {
  id: string;
  name: string;
  facultyId: string;
}

function RegisterPage() {
  const navigate = useNavigate();

  // Жеке деректер state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Оқу деректері state
  const [universityId, setUniversityId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [majorId, setMajorId] = useState('');
  const [course, setCourse] = useState<number>(1);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Анықтамалық тізімдер
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [faculties, setFaculties] = useState<FacultyItem[]>([]);
  const [majors, setMajors] = useState<MajorItem[]>([]);

  // UI күйлері
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Университеттер тізімін жүктеу
  useEffect(() => {
    async function loadUniversities() {
      try {
        setDataLoading(true);
        const data = await api.get<UniversityItem[]>('/api/public/universities', { skipAuth: true });
        setUniversities(data);
      } catch (err) {
        console.error(err);
      } finally {
        setDataLoading(false);
      }
    }

    loadUniversities();
  }, []);

  // 2. Университет өзгергенде факультеттерді жүктеу
  useEffect(() => {
    if (!universityId) {
      setFaculties([]);
      setFacultyId('');
      setMajors([]);
      setMajorId('');
      return;
    }

    async function loadFaculties() {
      try {
        const data = await api.get<FacultyItem[]>(
          `/api/public/universities/${universityId}/faculties`,
          { skipAuth: true },
        );
        setFaculties(data);
        setFacultyId('');
        setMajors([]);
        setMajorId('');
      } catch (err) {
        console.error(err);
      }
    }

    loadFaculties();
  }, [universityId]);

  // 3. Факультет өзгергенде мамандықтарды жүктеу
  useEffect(() => {
    if (!facultyId) {
      setMajors([]);
      setMajorId('');
      return;
    }

    async function loadMajors() {
      try {
        const data = await api.get<MajorItem[]>(
          `/api/public/faculties/${facultyId}/majors`,
          { skipAuth: true },
        );
        setMajors(data);
        setMajorId('');
      } catch (err) {
        console.error(err);
      }
    }

    loadMajors();
  }, [facultyId]);

  // Тіркелу өңдеушісі
  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    // Тексерулер
    if (!termsAccepted) {
      setError('SmartUni пайдалану ережелерімен келісуіңіз қажет');
      return;
    }

    if (password !== confirmPassword) {
      setError('Құпиясөздер бір-біріне сәйкес келмейді');
      return;
    }

    // Пароль күрделілігін тексеру (кемінде 8 таңба, 1 бас әріп, 1 кіші әріп, 1 сан)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        'Құпиясөз кемінде 8 таңбадан тұруы және кем дегенде 1 бас әріп, 1 кіші әріп және 1 саннан құралуы керек',
      );
      return;
    }

    if (!universityId || !facultyId || !majorId) {
      setError('Университетті, факультетті және мамандықты толық таңдаңыз');
      return;
    }

    setLoading(true);

    try {
      await api.post(
        '/api/auth/register',
        {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
          universityId,
          facultyId,
          majorId,
          course: Number(course),
        },
        { skipAuth: true },
      );

      setSuccess(
        'Тіркелу сәтті аяқталды! Жүйеге кіру бетіне бағытталуда...',
      );

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Тіркелу кезінде белгісіз қате орын алды');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page register-page">
      <div className="register-container">
        <div className="register-intro">
          <Link to="/" className="logo">
            <span className="logo-mark">S</span>
            <span className="logo-text">SmartUni</span>
          </Link>

          <span className="register-badge">SMARTUNI СТУДЕНТ</span>

          <h1>
            SmartUni-ге
            <br />
            қош келдің!
          </h1>

          <p>
            Оқу процесіңді бір жерден басқар. Пәндеріңді, тапсырмаларыңды,
            бағаларыңды және оқу прогресіңді бақыла.
          </p>

          <div className="register-benefits">
            <div>
              <span>✓</span>
              <p>Барлық оқу материалдары бір жерде</p>
            </div>

            <div>
              <span>✓</span>
              <p>Тапсырма мен тесттерді бақылау</p>
            </div>

            <div>
              <span>✓</span>
              <p>Оқу прогресін ыңғайлы бақылау</p>
            </div>
          </div>
        </div>

        <div className="auth-card register-card">
          <div className="auth-card-header">
            <h2>Аккаунт құру</h2>
            <p>Студент ретінде тіркелу үшін мәліметтеріңді енгіз</p>
          </div>

          <form className="register-form" onSubmit={handleRegister}>
            <div className="form-section-title">Жеке мәліметтер</div>

            <div className="form-grid">
              <label>
                Аты-жөні
                <input
                  type="text"
                  placeholder="Аты-жөніңді енгіз"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </label>

              <label>
                Телефон
                <input
                  type="tel"
                  placeholder="+77011234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </label>
            </div>

            <label>
              Email
              <input
                type="email"
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <div className="form-grid">
              <label>
                Құпиясөз
                <input
                  type="password"
                  placeholder="Кемінде 8 таңба, A-z, 0-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              <label>
                Құпиясөзді қайтала
                <input
                  type="password"
                  placeholder="Қайта енгіз"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="form-section-title">Оқу туралы</div>

            <label>
              Университет
              <select
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                required
                disabled={dataLoading}
              >
                <option value="" disabled>
                  {dataLoading
                    ? 'Университеттер жүктелуде...'
                    : 'Университетті таңда'}
                </option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-grid">
              <label>
                Факультет
                <select
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  required
                  disabled={!universityId || faculties.length === 0}
                >
                  <option value="" disabled>
                    {!universityId
                      ? 'Алдымен университетті таңдаңыз'
                      : faculties.length === 0
                        ? 'Факультеттер табылмады'
                        : 'Факультетті таңда'}
                  </option>
                  {faculties.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Курс
                <select
                  value={course}
                  onChange={(e) => setCourse(Number(e.target.value))}
                  required
                >
                  <option value={1}>1 курс</option>
                  <option value={2}>2 курс</option>
                  <option value={3}>3 курс</option>
                  <option value={4}>4 курс</option>
                </select>
              </label>
            </div>

            <label>
              Мамандық
              <select
                value={majorId}
                onChange={(e) => setMajorId(e.target.value)}
                required
                disabled={!facultyId || majors.length === 0}
              >
                <option value="" disabled>
                  {!facultyId
                    ? 'Алдымен факультетті таңдаңыз'
                    : majors.length === 0
                      ? 'Мамандықтар табылмады'
                      : 'Мамандықты таңда'}
                </option>
                {majors.map((maj) => (
                  <option key={maj.id} value={maj.id}>
                    {maj.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-section-title">Негізгі пәндер</div>

            <p className="form-hint">
              Оқу барысында жиі қолданатын негізгі 1–2 пәнді таңдаңыз.
            </p>

            <div className="subject-selection">
              <label className="subject-option">
                <input type="checkbox" defaultChecked />
                <span>Бағдарламалау</span>
              </label>

              <label className="subject-option">
                <input type="checkbox" defaultChecked />
                <span>Деректер базасы</span>
              </label>

              <label className="subject-option">
                <input type="checkbox" />
                <span>Веб-технологиялар</span>
              </label>

              <label className="subject-option">
                <input type="checkbox" />
                <span>Математика</span>
              </label>
            </div>

            <div className="form-notice">
              <span>💡</span>
              <p>
                Тіркелу топқа автоматты түрде қоспайды. Таңдаған тобыңа қосылу
                үшін оқытушыға арнайы өтініш жіберіледі.
              </p>
            </div>

            <label className="terms">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                required
              />
              <span>Мен SmartUni пайдалану ережелерімен келісемін</span>
            </label>

            {error && <div className="auth-error">{error}</div>}

            {success && (
              <div
                className="auth-success"
                style={{
                  padding: '12px 16px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '10px',
                  color: '#15803d',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              className="primary-button register-submit"
              disabled={loading}
            >
              {loading ? 'Жүктелуде...' : 'Аккаунт құру'}
            </button>
          </form>

          <p className="register-link">
            Аккаунтың бар ма? <Link to="/login">Жүйеге кіру</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default RegisterPage;