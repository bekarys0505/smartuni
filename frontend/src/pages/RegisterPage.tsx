function RegisterPage() {
  return (
    <main className="auth-page register-page">
      <div className="register-container">
        <div className="register-intro">
          <a href="/" className="logo">
            <span className="logo-mark">S</span>
            <span className="logo-text">SmartUni</span>
          </a>

          <span className="register-badge">
            SMARTUNI СТУДЕНТ
          </span>

          <h1>
            SmartUni-ге
            <br />
            қош келдің!
          </h1>

          <p>
            Оқу процесіңді бір жерден басқар.
            Пәндеріңді, тапсырмаларыңды, бағаларыңды
            және оқу прогресіңді бақыла.
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
            <p>
              Студент ретінде тіркелу үшін мәліметтеріңді енгіз
            </p>
          </div>

          <form className="register-form">
            <div className="form-section-title">
              Жеке мәліметтер
            </div>

            <div className="form-grid">
              <label>
                Аты-жөні
                <input
                  type="text"
                  placeholder="Аты-жөніңді енгіз"
                />
              </label>

              <label>
                Телефон
                <input
                  type="tel"
                  placeholder="+7 (___) ___-__-__"
                />
              </label>
            </div>

            <label>
              Email
              <input
                type="email"
                placeholder="example@mail.com"
              />
            </label>

            <div className="form-grid">
              <label>
                Құпиясөз
                <input
                  type="password"
                  placeholder="Құпиясөз жаса"
                />
              </label>

              <label>
                Құпиясөзді қайтала
                <input
                  type="password"
                  placeholder="Қайта енгіз"
                />
              </label>
            </div>

            <div className="form-section-title">
              Оқу туралы
            </div>

            <label>
              Университет
              <select defaultValue="">
                <option value="" disabled>
                  Университетті таңда
                </option>
                <option>
                  Шоқан Уәлиханов атындағы Көкшетау университеті
                </option>
              </select>
            </label>

            <div className="form-grid">
              <label>
                Факультет
                <select defaultValue="">
                  <option value="" disabled>
                    Факультетті таңда
                  </option>
                  <option>
                    Физика-математика факультеті
                  </option>
                  <option>
                    Экономика факультеті
                  </option>
                  <option>
                    Педагогика факультеті
                  </option>
                </select>
              </label>

              <label>
                Курс
                <select defaultValue="">
                  <option value="" disabled>
                    Курсты таңда
                  </option>
                  <option>1 курс</option>
                  <option>2 курс</option>
                  <option>3 курс</option>
                  <option>4 курс</option>
                </select>
              </label>
            </div>

            <label>
              Мамандық
              <select defaultValue="">
                <option value="" disabled>
                  Мамандықты таңда
                </option>
                <option>
                  Ақпараттық-коммуникациялық технологиялар
                </option>
                <option>
                  Информатика
                </option>
                <option>
                  Математика
                </option>
                <option>
                  Физика
                </option>
              </select>
            </label>

            <div className="form-section-title">
              Негізгі пәндер
            </div>

            <p className="form-hint">
              Оқу барысында жиі қолданатын негізгі 1–2 пәнді таңда.
            </p>

            <div className="subject-selection">
              <label className="subject-option">
                <input type="checkbox" />
                <span>Бағдарламалау</span>
              </label>

              <label className="subject-option">
                <input type="checkbox" />
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
                Тіркелу топқа автоматты түрде қоспайды.
                Таңдаған тобыңа қосылу үшін оқытушыға
                арнайы өтініш жіберіледі.
              </p>
            </div>

            <label className="terms">
              <input type="checkbox" />
              <span>
                Мен SmartUni пайдалану ережелерімен
                келісемін
              </span>
            </label>

            <button
              type="submit"
              className="primary-button register-submit"
            >
              Аккаунт құру
            </button>
          </form>

          <p className="register-link">
            Аккаунтың бар ма?{" "}
            <a href="/login">Жүйеге кіру</a>
          </p>
        </div>
      </div>
    </main>
  );
}

export default RegisterPage;