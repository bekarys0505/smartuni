import { Link } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/HomePage.css';

function HomePage() {
  return (
    <div className="smartuni-landing">
      <section className="landing-hero">
        <Header />

        <div className="landing-container hero-container">
          <div className="hero-copy">
            <div className="hero-eyebrow">
              SMARTUNI · UNIVERSITY PLATFORM
            </div>

            <h1>
              Университеттегі оқу
              <span> бір жүйеде.</span>
            </h1>

            <p>
              Пәндер, тапсырмалар, бағалар, күнтізбе және оқу прогресі —
              күнделікті оқу барысын басқаруға арналған бір цифрлық орта.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="hero-primary-button">
                SmartUni-ді бастау
              </Link>

              <a href="#platform" className="hero-secondary-link">
                Платформаны көру <span>↓</span>
              </a>
            </div>
          </div>

          <div className="hero-product">
            <div className="product-window">
              <div className="product-topbar">
                <div className="product-brand">
                  <span className="product-brand-mark">S</span>
                  <span>SmartUni</span>
                </div>

                <div className="product-topbar-right">
                  <span className="product-date">28 қыркүйек, 2026</span>
                  <div className="product-avatar">S</div>
                </div>
              </div>

              <div className="product-body">
                <aside className="product-sidebar">
                  <div className="sidebar-label">ОҚУ</div>

                  <div className="sidebar-item sidebar-item-active">
                    <span>Басты бет</span>
                  </div>

                  <div className="sidebar-item">
                    <span>Пәндер</span>
                  </div>

                  <div className="sidebar-item">
                    <span>Тапсырмалар</span>
                  </div>

                  <div className="sidebar-item">
                    <span>Күнтізбе</span>
                  </div>

                  <div className="sidebar-item">
                    <span>Бағалар</span>
                  </div>

                  <div className="sidebar-spacer" />

                  <div className="sidebar-item">
                    <span>Профиль</span>
                  </div>
                </aside>

                <main className="product-main">
                  <div className="dashboard-heading">
                    <div>
                      <span className="dashboard-overline">БАСТЫ БЕТ</span>
                      <h2>Сәлем!</h2>
                      <p>Бүгінгі оқу барысың осында.</p>
                    </div>

                    <div className="dashboard-day">
                      <strong>Дүйсенбі</strong>
                      <span>Бүгін</span>
                    </div>
                  </div>

                  <div className="dashboard-overview">
                    <div className="overview-progress">
                      <div className="overview-heading">
                        <span>Оқу прогресі</span>
                        <strong>78%</strong>
                      </div>

                      <div className="progress-track">
                        <div className="progress-fill" />
                      </div>

                      <span className="overview-caption">
                        Осы семестрдегі жалпы нәтиже
                      </span>
                    </div>

                    <div className="overview-stat">
                      <span>Белсенді пәндер</span>
                      <strong>4</strong>
                    </div>

                    <div className="overview-stat">
                      <span>Тапсырмалар</span>
                      <strong>3</strong>
                    </div>
                  </div>

                  <div className="dashboard-section-title">
                    <div>
                      <span>ПӘНДЕР</span>
                      <h3>Оқу пәндері</h3>
                    </div>

                    <a href="#features">Барлығын көру</a>
                  </div>

                  <div className="subjects-grid">
                    <div className="subject-card">
                      <span className="subject-number">01</span>
                      <div>
                        <strong>Математика</strong>
                        <small>6 тапсырма</small>
                      </div>
                    </div>

                    <div className="subject-card">
                      <span className="subject-number">02</span>
                      <div>
                        <strong>Информатика</strong>
                        <small>4 тапсырма</small>
                      </div>
                    </div>

                    <div className="subject-card">
                      <span className="subject-number">03</span>
                      <div>
                        <strong>Физика</strong>
                        <small>3 тапсырма</small>
                      </div>
                    </div>

                    <div className="subject-card">
                      <span className="subject-number">04</span>
                      <div>
                        <strong>Ағылшын тілі</strong>
                        <small>5 тапсырма</small>
                      </div>
                    </div>
                  </div>

                  <div className="next-class">
                    <div>
                      <span className="next-class-label">КЕЛЕСІ САБАҚ</span>
                      <strong>Информатика</strong>
                      <small>Бүгін · 14:00</small>
                    </div>

                    <span className="next-class-arrow">→</span>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section platform-section" id="platform">
        <div className="landing-container">
          <div className="section-intro">
            <span className="section-label">БІР ОРТА</span>
            <h2>
              Оқу барысын
              <br />
              <span>ретке келтір.</span>
            </h2>
            <p>
              SmartUni университеттегі күнделікті оқу процесін бір жерге
              жинақтап, маңызды ақпаратқа тез қол жеткізуге мүмкіндік береді.
            </p>
          </div>

          <div className="platform-grid">
            <div className="platform-card platform-card-large">
              <div className="platform-card-top">
                <span>01</span>
                <span>ПӘНДЕР</span>
              </div>

              <h3>Барлық пәнің бір жерде.</h3>

              <p>
                Әр пән бойынша тапсырмалар, материалдар және оқу барысы
                бөлек-бөлек емес, бір жүйеде сақталады.
              </p>

              <div className="fake-course-list">
                <div>
                  <span>Математика</span>
                  <strong>82%</strong>
                </div>
                <div>
                  <span>Информатика</span>
                  <strong>91%</strong>
                </div>
                <div>
                  <span>Физика</span>
                  <strong>74%</strong>
                </div>
              </div>
            </div>

            <div className="platform-card platform-card-dark">
              <div className="platform-card-top">
                <span>02</span>
                <span>ПРОГРЕСС</span>
              </div>

              <h3>Нәтижеңді бақыла.</h3>

              <p>
                Бағаларың мен тапсырмаларыңның орындалуын бір жерден бақыла.
              </p>

              <div className="mini-progress">
                <div className="mini-progress-line">
                  <span>Жалпы нәтиже</span>
                  <strong>85</strong>
                </div>
                <div className="mini-progress-track">
                  <div />
                </div>
              </div>
            </div>

            <div className="platform-card">
              <div className="platform-card-top">
                <span>03</span>
                <span>КҮНТІЗБЕ</span>
              </div>

              <h3>Бүгін не бар?</h3>

              <p>
                Сабақтар мен тапсырмаларды күнтізбе арқылы алдын ала жоспарла.
              </p>

              <div className="calendar-preview">
                <div>
                  <span>28</span>
                  <small>ҚЫР</small>
                </div>
                <div>
                  <strong>Информатика</strong>
                  <small>14:00</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section features-section" id="features">
        <div className="landing-container">
          <div className="section-heading-wide">
            <div>
              <span className="section-label">МҮМКІНДІКТЕР</span>
              <h2>Күнделікті оқу үшін<br />қажетті құралдар.</h2>
            </div>

            <p>
              Артық функциялар емес. Университеттегі оқу процесіне күн сайын
              керек негізгі құралдар.
            </p>
          </div>

          <div className="feature-list">
            <article className="feature-row">
              <div className="feature-index">01</div>

              <div className="feature-content">
                <h3>Электронды күнделік</h3>
                <p>
                  Бағаларды, пәндерді және оқу нәтижесін бір жерден бақыла.
                  Қай пәндегі нәтижең қандай екенін бірден көр.
                </p>
              </div>

              <div className="feature-visual grade-visual">
                <div className="grade-row">
                  <span>Математика</span>
                  <strong>92</strong>
                </div>
                <div className="grade-row">
                  <span>Физика</span>
                  <strong>86</strong>
                </div>
                <div className="grade-row">
                  <span>Информатика</span>
                  <strong>94</strong>
                </div>
              </div>
            </article>

            <article className="feature-row feature-row-reverse">
              <div className="feature-index">02</div>

              <div className="feature-content">
                <h3>Тапсырмалар</h3>
                <p>
                  Орындалуы тиіс тапсырмаларды бақыла. Мерзімдерді өткізіп
                  алма және оқу жоспарын ретімен орында.
                </p>
              </div>

              <div className="feature-visual task-visual">
                <div className="task-line task-done">
                  <span>Зертханалық жұмыс</span>
                  <small>Орындалды</small>
                </div>
                <div className="task-line">
                  <span>Практикалық жұмыс</span>
                  <small>Ертең</small>
                </div>
                <div className="task-line">
                  <span>Бақылау жұмысы</span>
                  <small>30 қыркүйек</small>
                </div>
              </div>
            </article>

            <article className="feature-row">
              <div className="feature-index">03</div>

              <div className="feature-content">
                <h3>Күнтізбе</h3>
                <p>
                  Сабақтарды, тапсырмаларды және маңызды оқу күндерін бір
                  күнтізбеден көр.
                </p>
              </div>

              <div className="feature-visual schedule-visual">
                <div className="schedule-date">
                  <strong>28</strong>
                  <span>ҚЫРКҮЙЕК</span>
                </div>

                <div className="schedule-event">
                  <span>14:00</span>
                  <strong>Информатика</strong>
                  <small>Дәріс · 204 аудитория</small>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-section roles-section" id="how-it-works">
        <div className="landing-container">
          <div className="roles-heading">
            <span className="section-label">КІМ ҮШІН?</span>
            <h2>Бір платформа.<br />Әртүрлі рөл.</h2>
          </div>

          <div className="roles-grid">
            <article className="role-card">
              <div className="role-card-number">01</div>

              <div>
                <span className="role-label">СТУДЕНТ</span>
                <h3>Оқуыңды өзің басқар.</h3>
                <p>
                  Пәндеріңді, тапсырмаларыңды, бағаларыңды және оқу
                  прогресіңді бір жерден бақыла.
                </p>
              </div>

              <Link to="/register">Студент ретінде бастау →</Link>
            </article>

            <article className="role-card role-card-dark">
              <div className="role-card-number">02</div>

              <div>
                <span className="role-label">ОҚЫТУШЫ</span>
                <h3>Оқу процесін басқар.</h3>
                <p>
                  Топтармен жұмыс істе, тапсырмалар бер, бағаларды енгіз және
                  студенттердің оқу барысын бақыла.
                </p>
              </div>

              <Link to="/register">Платформаны көру →</Link>
            </article>
          </div>
        </div>
      </section>

      <section className="premium-section" id="premium">
        <div className="landing-container">
          <div className="premium-inner">
            <div>
              <span className="premium-label">SMARTUNI PREMIUM</span>
              <h2>Оқу тәжірибесін<br />келесі деңгейге шығар.</h2>
            </div>

            <div className="premium-content">
              <p>
                Қосымша мүмкіндіктер мен кеңейтілген құралдар арқылы
                SmartUni-ді толық пайдалан.
              </p>

              <Link to="/register" className="premium-button">
                Premium мүмкіндіктері
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="landing-container">
          <div className="final-cta-inner">
            <span className="section-label">SMARTUNI</span>

            <h2>
              Оқуыңды бір жүйеге
              <br />
              <span>жинақта.</span>
            </h2>

            <p>
              Университеттегі күнделікті оқу процесін қарапайым әрі түсінікті
              басқар.
            </p>

            <Link to="/register" className="final-button">
              Тегін бастау
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          <div className="footer-brand">
            <span className="landing-logo-mark">S</span>
            <span>SmartUni</span>
          </div>

          <span>Университетке арналған цифрлық оқу платформасы.</span>

          <span>© 2026 SmartUni</span>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;