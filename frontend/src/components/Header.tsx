import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="landing-header">
      <div className="landing-container landing-header-inner">
        <Link to="/" className="landing-logo">
          <span className="landing-logo-mark">S</span>
          <span className="landing-logo-name">SmartUni</span>
        </Link>

        <nav className="landing-nav">
          <a href="#platform">Платформа</a>
          <a href="#features">Мүмкіндіктер</a>
          <a href="#how-it-works">Қалай жұмыс істейді?</a>
          <a href="#premium">Premium</a>
        </nav>

        <div className="landing-header-actions">
          <Link to="/login" className="landing-login">
            Кіру
          </Link>

          <Link to="/register" className="landing-header-cta">
            Тіркелу
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;