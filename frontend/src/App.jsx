import './index.css'
import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Newspaper,
  Waves,
} from 'lucide-react'
import { createChart, ColorType, LineSeries } from 'lightweight-charts'

const API = 'http://127.0.0.1:8000'

function MetricCard({ label, value, detail }) {
  return (
    <div className="metric-card">
      <p>{label}</p>
      <h2>{value}</h2>
      <small>{detail}</small>
    </div>
  )
}

function PriceChart({ data }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const element = containerRef.current

    if (!element || !data || data.length === 0) {
      return
    }

    const chart = createChart(element, {
      width: element.clientWidth || 600,
      height: 300,
      layout: {
        background: {
          type: ColorType.Solid,
          color: '#101827',
        },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      rightPriceScale: {
        borderColor: '#263449',
      },
      timeScale: {
        borderColor: '#263449',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    const series = chart.addSeries(LineSeries, {
      color: '#38bdf8',
      lineWidth: 2,
    })

    series.setData(data)
    chart.timeScale().fitContent()

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
        })
      }
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
    }
  }, [data])

  return <div className="chart" ref={containerRef} />
}

export default function App() {
  const [market, setMarket] = useState(null)
  const [news, setNews] = useState([])
  const [forecast, setForecast] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        const [marketRes, newsRes, forecastRes] = await Promise.all([
          fetch(`${API}/api/snapshot`),
          fetch(`${API}/api/news`),
          fetch(`${API}/api/forecast`),
        ])

        if (!marketRes.ok || !newsRes.ok || !forecastRes.ok) {
          throw new Error('The API returned an error.')
        }

        const [marketData, newsData, forecastData] = await Promise.all([
          marketRes.json(),
          newsRes.json(),
          forecastRes.json(),
        ])

        if (!active) return

        // The backend returns the market data inside marketData.market.
        setMarket(marketData.market ?? marketData)
        setNews(newsData.items ?? newsData.news ?? [])
        setForecast(forecastData)
        setError('')
      } catch (err) {
        if (active) {
          setError(
            'Cannot connect to the API. Ensure the backend is running on port 8000.'
          )
        }
      }
    }

    loadDashboard()
    const timer = window.setInterval(loadDashboard, 4000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  // Convert the backend's timestamp into chart-compatible time values.
  const chartData = useState(() => [])[0]

  const displayChartData = (() => {
    const history = market?.price_history

    if (Array.isArray(history) && history.length > 0) {
      return history
        .map((item) => {
          const rawTime = item.time ?? item.timestamp
          const time = typeof rawTime === 'number'
            ? rawTime
            : Math.floor(new Date(rawTime).getTime() / 1000)

          return {
            time,
            value: Number(item.price ?? item.value),
          }
        })
        .filter(
          (item) =>
            Number.isFinite(item.time) &&
            Number.isFinite(item.value)
        )
        .sort((a, b) => a.time - b.time)
    }

    // The starter API provides an order-book snapshot rather than
    // historical prices, so show a clearly illustrative price point.
    if (market?.mid_price != null) {
      return [
        {
          time: Math.floor(Date.now() / 1000) - 60,
          value: Number(market.mid_price),
        },
        {
          time: Math.floor(Date.now() / 1000),
          value: Number(market.mid_price),
        },
      ]
    }

    return []
  })()

  const sentimentScore = news.reduce((total, item) => {
    const label = String(item.sentiment?.label ?? '').toLowerCase()

    if (label === 'positive') return total + 1
    if (label === 'negative') return total - 1
    return total
  }, 0)

  const sentiment =
    sentimentScore > 0
      ? 'Positive'
      : sentimentScore < 0
        ? 'Negative'
        : 'Mixed / Neutral'

  const price = market?.last_price ?? market?.mid_price
  const predictedPrice =
    forecast?.predicted_mid_price ??
    forecast?.prediction ??
    forecast?.predicted_price

  return (
    <div className="layout">
      <aside>
        <div className="brand">
          <Waves size={25} />
          <span>QuantFormer</span>
        </div>

        <p className="sidebar-label">WORKSPACE</p>

        <div className="nav-item active">
          <Activity size={18} />
          Market Overview
        </div>

        <div className="sidebar-note">
          <span className="status-dot" /> Mock data mode
          <p>Illustrative research dashboard</p>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <small className="eyebrow">
              QUANTITATIVE RESEARCH / DASHBOARD
            </small>
            <h1>Market Intelligence</h1>
            <p>Order book, news sentiment and model forecast in one view.</p>
          </div>

          <div className="live-badge">
            <span className="status-dot" /> LIVE DEMO
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <section className="ticker">
          <div>
            <small>INSTRUMENT</small>
            <h2>{market?.symbol ?? 'AAPL'}</h2>
          </div>

          <div>
            <small>LAST PRICE</small>
            <h2>
              {price != null && Number.isFinite(Number(price))
                ? `$${Number(price).toFixed(2)}`
                : '—'}
            </h2>
          </div>

          <div>
            <small>MARKET STATUS</small>
            <h2>Simulation</h2>
          </div>
        </section>

        <section className="metrics">
          <MetricCard
            label="MID PRICE"
            value={
              market?.mid_price != null
                ? Number(market.mid_price).toFixed(3)
                : '—'
            }
            detail="Best bid/ask midpoint"
          />

          <MetricCard
            label="BID-ASK SPREAD"
            value={
              market?.spread != null
                ? Number(market.spread).toFixed(3)
                : '—'
            }
            detail="Top-of-book spread"
          />

          <MetricCard
            label="BOOK IMBALANCE"
            value={
              market?.order_book_imbalance != null
                ? `${(Number(market.order_book_imbalance) * 100).toFixed(1)}%`
                : '—'
            }
            detail="Bid depth vs ask depth"
          />

          <MetricCard
            label="NEWS SENTIMENT"
            value={news.length > 0 ? sentiment : '—'}
            detail="Headline sentiment adapter"
          />
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Price history</h2>
              <p>Illustrative midpoint feed</p>
            </div>
            <TrendingUp size={20} />
          </div>

          {displayChartData.length > 0 ? (
            <PriceChart data={displayChartData} />
          ) : (
            <p className="muted">Waiting for market data...</p>
          )}
        </section>

        <section className="lower-grid">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>News &amp; sentiment</h2>
                <p>Recent headline signals</p>
              </div>
              <Newspaper size={20} />
            </div>

            {news.length === 0 ? (
              <p className="muted">Waiting for news data...</p>
            ) : (
              news.map((item, index) => (
                <article className="news-item" key={item.id ?? index}>
                  <div>
                    <span className="news-dot" />
                    <strong>
                      {item.sentiment?.label ?? 'neutral'}
                    </strong>
                  </div>

                  <p>
                    {item.headline ?? item.title ?? 'Market news item'}
                  </p>

                  <small>{item.source ?? 'Demo feed'}</small>
                </article>
              ))
            )}
          </div>

          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>Model forecast</h2>
                <p>Baseline prediction preview</p>
              </div>
              <TrendingDown size={20} />
            </div>

            <div className="forecast-value">
              {predictedPrice != null
                ? `$${Number(predictedPrice).toFixed(2)}`
                : '—'}
            </div>

            <p className="muted">
              Forecast horizon: {forecast?.horizon ?? 'demo'}
            </p>

            {forecast?.predicted_change_pct != null && (
              <p className="muted">
                Estimated change:{' '}
                {Number(forecast.predicted_change_pct).toFixed(4)}%
              </p>
            )}

            <div className="notice">
              This is an illustrative rule-based baseline, not a trained
              Temporal Fusion Transformer (TFT) model. Mock data only;
              not investment advice.
            </div>
          </div>
        </section>

        <footer>
          QuantFormer · Multimodal Order Book &amp; Sentiment Research · Demo
          build
        </footer>
      </main>
    </div>
  )
}