function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <a href="/" className="logo">
          <span className="logo-mark">S</span>
          <span className="logo-text">SmartUni</span>
        </a>

        <nav className="nav">
          <a href="#features">Мүмкіндіктер</a>
          <a href="#how-it-works">Қалай жұмыс істейді?</a>
          <a href="#premium">Premium</a>
        </nav>

        <div className="header-actions">
          <a href="/login" className="login-button">
  Кіру
</a>

          <a href="/register" className="primary-button">
  Тіркелу
</a>
        </div>
      </div>
    </header>
  );
}

export default Header;