import React, { useEffect, useRef, useState } from 'react'

const FEATURES = [
  {
    icon: '🎮',
    title: 'かんたん設定',
    desc: 'JSONを書くだけでどんなカードゲームも再現できる。ゾーン・ルール・カード属性すべて自由自在。',
    color: '#4ECDC4',
  },
  {
    icon: '📋',
    title: '自由なルール',
    desc: 'デッキ枚数・コピー上限・ゾーン種類をカスタマイズ。あなただけのゲームを設計しよう。',
    color: '#FF6B6B',
  },
  {
    icon: '👥',
    title: 'マルチウィンドウ',
    desc: 'ボードと手札を別ウィンドウで管理。本格的な二人対戦をリアルタイムで楽しめる。',
    color: '#C3B1E1',
  },
]

const CATALOG = [
  { name: 'カードバトル', count: 40, color: '#FFE66D', emoji: '⚔️' },
  { name: 'デッキシミュ', count: 60, color: '#A8E6CF', emoji: '🃏' },
  { name: 'トレカ管理', count: 20, color: '#87CEEB', emoji: '📦' },
  { name: 'ボードゲーム', count: 32, color: '#FFAB91', emoji: '🎲' },
]

const PROGRESS_ITEMS = [
  { label: 'カードライブラリ', pct: 85, color: '#FF6B6B' },
  { label: 'デッキ構築', pct: 60, color: '#4ECDC4' },
  { label: 'ゲーム設定', pct: 40, color: '#FFE66D' },
]

const TESTIMONIALS = [
  {
    text: 'カードゲーム制作の夢が実現しました。JSON 1ファイルでゲームを完全再現できます。',
    name: '田中 太郎',
    role: 'ゲームデザイナー',
    avatar: '🧑‍💻',
    bg: '#A8E6CF',
  },
  {
    text: 'デュエルマスターズのシミュレーターを自分で作れた。友達と一緒にプレイ中！',
    name: '鈴木 花子',
    role: 'TCGファン',
    avatar: '👩‍🎨',
    bg: '#FFE66D',
  },
  {
    text: 'デッキビルダーが直感的で使いやすい。カード検索機能が特に気に入っています。',
    name: '佐藤 健',
    role: 'コレクター',
    avatar: '🧔',
    bg: '#87CEEB',
  },
]

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [progressVisible, setProgressVisible] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial(i => (i + 1) % TESTIMONIALS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-visible', 'true')
          }
        })
      },
      { threshold: 0.12 }
    )
    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!progressRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setProgressVisible(true) },
      { threshold: 0.3 }
    )
    observer.observe(progressRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="landing-root">
      {/* ── Nav ── */}
      <nav className={`landing-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <span className="landing-logo">🎴 TCG Simulator</span>
          <div className="landing-nav-links">
            <a href="/" className="clay-btn-ghost">ゲームを開く</a>
            <a href="/deck.html" className="clay-btn-sm">デッキを作る</a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-content" data-animate>
          <div className="hero-badge">🎮 無料・インストール不要のTCGシミュレーター</div>
          <h1 className="hero-title">
            あなただけの<br />
            <span className="hero-title-accent">カードゲーム</span>を<br />
            作ろう
          </h1>
          <p className="hero-sub">
            JSONを書くだけで、どんなゲームも再現できる。<br />
            デッキを組んで、友達と対戦しよう。
          </p>
          <div className="hero-ctas">
            <a href="/" className="clay-btn-primary">ゲームを始める →</a>
            <a href="/deck.html" className="clay-btn-secondary">デッキを作る</a>
          </div>
        </div>
        <div className="hero-deco" aria-hidden="true">
          <div className="floating-card fc1">⚔️<small>バトル</small></div>
          <div className="floating-card fc2">🃏<small>カード</small></div>
          <div className="floating-card fc3">🏆<small>勝利</small></div>
          <div className="floating-card fc4">✨</div>
        </div>
      </section>

      {/* ── Features ── */}
      <div className="features-outer">
        <h2 className="section-title" data-animate>なぜ TCG Simulator？</h2>
        <p className="section-sub" data-animate>あらゆるカードゲームを、ブラウザ上で再現できる</p>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="clay-card feature-card"
              data-animate
              style={{
                background: f.color,
                animationDelay: `${i * 0.15}s`,
              } as React.CSSProperties}
            >
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Catalog ── */}
      <section className="catalog-section">
        <div className="catalog-header">
          <h2 className="section-title" data-animate>ゲームテンプレート</h2>
          <p className="section-sub" data-animate>人気の形式をすぐに始められる</p>
        </div>
        <div className="catalog-scroll">
          {CATALOG.map((c, i) => (
            <div
              key={c.name}
              className="catalog-card"
              data-animate
              style={{ background: c.color, animationDelay: `${i * 0.1}s` }}
            >
              <div className="catalog-emoji">{c.emoji}</div>
              <h3 className="catalog-name">{c.name}</h3>
              <div className="catalog-badge">{c.count}枚対応</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Progress ── */}
      <section className="section" ref={progressRef}>
        <h2 className="section-title" data-animate>デッキ構築 デモ</h2>
        <p className="section-sub" data-animate>直感的なUIでデッキを組み上げよう</p>
        <div className="progress-list">
          {PROGRESS_ITEMS.map((p, i) => (
            <div
              key={p.label}
              className="progress-item"
              data-animate
              style={{ animationDelay: `${i * 0.15}s` } as React.CSSProperties}
            >
              <div className="progress-label">
                <span>{p.label}</span>
                <span className="progress-pct">{p.pct}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-bar"
                  style={{
                    width: progressVisible ? `${p.pct}%` : '0%',
                    background: p.color,
                    transitionDelay: progressVisible ? `${i * 0.2}s` : '0s',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="testimonial-section">
        <h2 className="section-title" data-animate>プレイヤーの声</h2>
        <div className="testimonial-wrapper">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className={`testimonial-card clay-card${i === activeTestimonial ? ' active' : ''}`}
              style={{ background: t.bg }}
            >
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.avatar}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="testimonial-dots">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              className={`dot${i === activeTestimonial ? ' active' : ''}`}
              onClick={() => setActiveTestimonial(i)}
              aria-label={`証言 ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-inner" data-animate>
          <h2 className="cta-title">今すぐゲームを始めよう</h2>
          <p className="cta-sub">無料・インストール不要。ブラウザで今すぐ遊べる。</p>
          <a href="/" className="clay-btn-primary cta-btn">ゲームを開く →</a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <span>🎴 TCG Simulator</span>
          <span className="footer-muted">オープンソース カードゲームシミュレーター</span>
        </div>
      </footer>
    </div>
  )
}
