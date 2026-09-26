function Hero() {
  return (
    <section className="hero">
      <div className="container hero-content">
        <div className="hero-text">
          <div className="university-badge">
            🎓 Шоқан Уәлиханов атындағы Көкшетау университеті
          </div>

          <h1>
            Оқуыңның барлығы —
            <span> бір жерде.</span>
          </h1>

          <p>
            Лекция, тапсырма, тест, күнтізбе, баға және оқу
            прогресі — барлығы бір SmartUni платформасында.
          </p>

          <div className="hero-actions">
            <button className="primary-button hero-button">
              SmartUni-ге кіру
            </button>

            <button className="secondary-button hero-button">
              Танысу
            </button>
          </div>

          <div className="hero-info">
            <div>
              <strong>1</strong>
              <span>платформа</span>
            </div>

            <div>
              <strong>6+</strong>
              <span>негізгі мүмкіндік</span>
            </div>

            <div>
              <strong>24/7</strong>
              <span>қолжетімділік</span>
            </div>
          </div>
        </div>

        <div className="hero-card">
          <div className="dashboard-preview">
            <div className="preview-header">
              <div>
                <small>Сәлем, студент 👋</small>
                <h3>Оқу барысы</h3>
              </div>

              <div className="avatar">
                С
              </div>
            </div>

            <div className="progress-card">
              <div className="progress-info">
                <span>Жалпы прогресс</span>
                <strong>78%</strong>
              </div>

              <div className="progress-bar">
                <div className="progress-value" />
              </div>
            </div>

            <div className="preview-grid">
              <div className="mini-card">
                <span>📚</span>
                <strong>Пәндер</strong>
                <small>4 пән</small>
              </div>

              <div className="mini-card">
                <span>📝</span>
                <strong>Тапсырмалар</strong>
                <small>3 белсенді</small>
              </div>

              <div className="mini-card">
                <span>📅</span>
                <strong>Күнтізбе</strong>
                <small>Бүгін 2 сабақ</small>
              </div>

              <div className="mini-card">
                <span>📊</span>
                <strong>Бағалар</strong>
                <small>85 орташа</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;