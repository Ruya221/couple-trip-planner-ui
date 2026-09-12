import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { buildMockAiPlan, createDemoPlannerData, mockReminderExamples } from './mockData'
import { loadPlannerData, resetPlannerData, savePlannerData, sortItinerary } from './storage'
import type { Category, ItineraryItem, MockAiPlan, MockReminder, PlannerData } from './types'

const categories: Category[] = ['観光', '食事', 'ホテル', '移動']

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `item-${Date.now()}-${Math.random().toString(16).slice(2)}`

const formatDateRange = (startDate: string, endDate: string) => {
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })

  return `${formatter.format(new Date(startDate))} 〜 ${formatter.format(new Date(endDate))}`
}

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

const createEmptyForm = () => ({
  title: '',
  dateTime: '',
  location: '',
  category: '観光' as Category,
  notes: '',
  reminderMinutes: '30',
})

const buildDynamicReminders = (itinerary: ItineraryItem[]): MockReminder[] => {
  const now = Date.now()

  return itinerary
    .map((item) => {
      const reminderAt = new Date(item.dateTime).getTime() - item.reminderMinutes * 60 * 1000
      const diffMinutes = Math.round((reminderAt - now) / 60000)

      if (diffMinutes < -180 || diffMinutes > 180) {
        return null
      }

      return {
        id: `dynamic-${item.id}`,
        title: item.title,
        detail: `${item.location} / ${item.category}`,
        timingLabel: diffMinutes <= 0 ? 'まもなく' : `あと${diffMinutes}分`,
        kind: diffMinutes <= 0 ? 'due' : 'upcoming',
      } satisfies MockReminder
    })
    .filter((item): item is MockReminder => item !== null)
}

function App() {
  const [planner, setPlanner] = useState<PlannerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [storageMessage, setStorageMessage] = useState<string | null>(null)
  const [formValues, setFormValues] = useState(createEmptyForm)
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'unsupported',
  )
  const [aiDestination, setAiDestination] = useState('箱根')
  const [aiQuestion, setAiQuestion] = useState('2日間で温泉と観光をバランスよく回りたいです。')
  const [aiMessage, setAiMessage] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPlan, setAiPlan] = useState<MockAiPlan | null>(null)
  const aiTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      try {
        setPlanner(loadPlannerData())
      } catch {
        setStorageMessage('保存データの読み込みに失敗したため、デモ用サンプルデータに戻しました。')
        setPlanner(createDemoPlannerData())
      } finally {
        setLoading(false)
      }
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [])

  useEffect(() => {
    if (!loading && planner) {
      savePlannerData(planner)
    }
  }, [planner, loading])

  useEffect(() => () => {
    if (aiTimerRef.current !== null) {
      window.clearTimeout(aiTimerRef.current)
    }
  }, [])

  const reminders = useMemo(() => {
    if (!planner) {
      return mockReminderExamples
    }

    const dynamicReminders = buildDynamicReminders(planner.itinerary)
    return [...dynamicReminders, ...mockReminderExamples].slice(0, 4)
  }, [planner])

  if (loading || !planner) {
    return (
      <main className="app-shell loading-shell">
        <section className="card status-card" aria-live="polite">
          <p className="eyebrow">デモを準備中</p>
          <h1>Couple Trip Planner UI Demo</h1>
          <p>localStorage から旅程を読み込んでいます。</p>
        </section>
      </main>
    )
  }

  const handleAddItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formValues.title.trim() || !formValues.dateTime || !formValues.location.trim()) {
      setFormMessage('タイトル・日時・場所は必須です。')
      return
    }

    const nextItem: ItineraryItem = {
      id: createId(),
      title: formValues.title.trim(),
      dateTime: formValues.dateTime,
      location: formValues.location.trim(),
      category: formValues.category,
      notes: formValues.notes.trim(),
      reminderMinutes: Number(formValues.reminderMinutes) || 0,
    }

    setPlanner((current) =>
      current
        ? {
            ...current,
            itinerary: sortItinerary([...current.itinerary, nextItem]),
          }
        : current,
    )
    setFormValues(createEmptyForm())
    setFormMessage('旅程を追加しました。')
  }

  const handleDeleteItem = (itemId: string) => {
    setPlanner((current) =>
      current
        ? {
            ...current,
            itinerary: current.itinerary.filter((item) => item.id !== itemId),
          }
        : current,
    )
    setPendingDeleteId(null)
    setFormMessage('旅程を削除しました。')
  }

  const handleRequestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported')
      setNotificationMessage('このブラウザでは通知APIを利用できないため、アプリ内通知だけを表示します。')
      return
    }

    const permission = await window.Notification.requestPermission()
    setNotificationPermission(permission)
    setNotificationMessage(
      permission === 'granted'
        ? 'ブラウザ通知を許可しました。デモ通知ボタンで挙動を確認できます。'
        : '通知が許可されなかったため、アプリ内通知の表示に切り替えます。',
    )
  }

  const handleDemoReminder = () => {
    const message = 'まもなく「温泉旅館にチェックイン」のリマインダーです。'

    if (typeof window !== 'undefined' && 'Notification' in window && notificationPermission === 'granted') {
      new window.Notification('Couple Trip Planner', {
        body: message,
      })
    }

    setNotificationMessage(message)
  }

  const handleAiSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!aiDestination.trim()) {
      setAiMessage('行き先を入力してください。')
      setAiPlan(null)
      return
    }

    setAiMessage(null)
    setAiLoading(true)

    if (aiTimerRef.current !== null) {
      window.clearTimeout(aiTimerRef.current)
    }

    aiTimerRef.current = window.setTimeout(() => {
      setAiPlan(buildMockAiPlan(aiDestination, aiQuestion))
      setAiLoading(false)
      aiTimerRef.current = null
    }, 150)
  }

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">UI-only mock demo</p>
          <h1>Couple Trip Planner</h1>
          <p className="subtitle">Android ブラウザとデスクトップで確認できる、公開UIデモです。</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setPlanner(resetPlannerData())
            setStorageMessage('localStorage を初期化して、サンプルデータを再読み込みしました。')
            setFormMessage(null)
          }}
        >
          デモを初期化
        </button>
      </header>

      <main className="app-shell">
        <section className="hero-grid" id="dashboard">
          <article className="card trip-card" aria-labelledby="trip-summary-heading">
            <div className="card-header">
              <div>
                <p className="eyebrow">旅行サマリー</p>
                <h2 id="trip-summary-heading">{planner.trip.title}</h2>
              </div>
              <span className="status-pill">{planner.trip.status}</span>
            </div>
            <dl className="summary-grid">
              <div>
                <dt>行き先</dt>
                <dd>{planner.trip.destination}</dd>
              </div>
              <div>
                <dt>日程</dt>
                <dd>{formatDateRange(planner.trip.startDate, planner.trip.endDate)}</dd>
              </div>
              <div>
                <dt>旅程件数</dt>
                <dd>{planner.itinerary.length}件</dd>
              </div>
              <div>
                <dt>進捗</dt>
                <dd>{planner.trip.progress}%</dd>
              </div>
            </dl>
            <div className="progress-block" aria-label="旅行準備の進捗">
              <div className="progress-bar">
                <span style={{ width: `${planner.trip.progress}%` }}></span>
              </div>
              <p>宿・移動・食事の主要メモまで登録済みです。</p>
            </div>
          </article>

          <article className="card reminder-card" id="reminders" aria-labelledby="reminder-heading">
            <div className="card-header stacked-mobile">
              <div>
                <p className="eyebrow">リマインダー</p>
                <h2 id="reminder-heading">通知とアプリ内フォールバック</h2>
              </div>
              <div className="button-row wrap-mobile">
                <button type="button" className="secondary-button" onClick={handleRequestNotifications}>
                  通知を許可
                </button>
                <button type="button" className="primary-button" onClick={handleDemoReminder}>
                  デモ通知を表示
                </button>
              </div>
            </div>
            <p className="helper-text">
              通知状態：
              <strong>
                {notificationPermission === 'granted'
                  ? '許可済み'
                  : notificationPermission === 'denied'
                    ? '拒否済み'
                    : notificationPermission === 'unsupported'
                      ? '未対応'
                      : '未確認'}
              </strong>
            </p>
            <ul className="reminder-list">
              {reminders.map((reminder) => (
                <li key={reminder.id} className={`reminder-item reminder-${reminder.kind}`}>
                  <div>
                    <p className="reminder-time">{reminder.timingLabel}</p>
                    <h3>{reminder.title}</h3>
                    <p>{reminder.detail}</p>
                  </div>
                  <span className="mini-pill">{reminder.kind === 'due' ? '期限超過/直前' : '今後の予定'}</span>
                </li>
              ))}
            </ul>
            {notificationMessage ? (
              <p className="inline-message" role="status">
                {notificationMessage}
              </p>
            ) : null}
          </article>
        </section>

        {(storageMessage || formMessage) && (
          <section className="inline-alerts" aria-live="polite">
            {storageMessage ? (
              <p className="inline-message warning" role="alert">
                {storageMessage}
              </p>
            ) : null}
            {formMessage ? (
              <p className="inline-message" role="status">
                {formMessage}
              </p>
            ) : null}
          </section>
        )}

        <section className="content-grid">
          <article className="card" id="itinerary" aria-labelledby="itinerary-heading">
            <div className="card-header">
              <div>
                <p className="eyebrow">旅程タイムライン</p>
                <h2 id="itinerary-heading">予定一覧</h2>
              </div>
              <span className="mini-pill">localStorage 保存</span>
            </div>

            {planner.itinerary.length === 0 ? (
              <div className="empty-state" role="status">
                <h3>まだ旅程がありません</h3>
                <p>右側のフォームから予定を追加すると、ここに時系列で表示されます。</p>
              </div>
            ) : (
              <ol className="timeline-list">
                {planner.itinerary.map((item) => {
                  const isConfirming = pendingDeleteId === item.id

                  return (
                    <li key={item.id} className="timeline-item">
                      <div className="timeline-marker" aria-hidden="true"></div>
                      <div className="timeline-content">
                        <div className="item-header">
                          <div>
                            <p className="item-time">{formatDateTime(item.dateTime)}</p>
                            <h3>{item.title}</h3>
                          </div>
                          <span className="mini-pill">{item.category}</span>
                        </div>
                        <p className="item-location">{item.location}</p>
                        <p className="item-notes">{item.notes || 'メモは未入力です。'}</p>
                        <p className="item-reminder">{item.reminderMinutes}分前に通知</p>
                        {isConfirming ? (
                          <div className="confirm-box" role="alertdialog" aria-label={`${item.title} を削除しますか`}>
                            <p>この予定を削除しますか？</p>
                            <div className="button-row">
                              <button type="button" className="danger-button" onClick={() => handleDeleteItem(item.id)}>
                                削除を確定
                              </button>
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => setPendingDeleteId(null)}
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => setPendingDeleteId(item.id)}
                          >
                            削除する
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </article>

          <div className="stack-column">
            <article className="card" id="add-item" aria-labelledby="add-item-heading">
              <div className="card-header">
                <div>
                  <p className="eyebrow">予定追加</p>
                  <h2 id="add-item-heading">旅程を追加</h2>
                </div>
              </div>
              <form className="form-grid" onSubmit={handleAddItem}>
                <label>
                  タイトル
                  <input
                    name="title"
                    value={formValues.title}
                    onChange={(event) => setFormValues((current) => ({ ...current, title: event.target.value }))}
                  />
                </label>
                <label>
                  日時
                  <input
                    type="datetime-local"
                    name="dateTime"
                    value={formValues.dateTime}
                    onChange={(event) => setFormValues((current) => ({ ...current, dateTime: event.target.value }))}
                  />
                </label>
                <label>
                  場所
                  <input
                    name="location"
                    value={formValues.location}
                    onChange={(event) => setFormValues((current) => ({ ...current, location: event.target.value }))}
                  />
                </label>
                <label>
                  カテゴリ
                  <select
                    name="category"
                    value={formValues.category}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        category: event.target.value as Category,
                      }))
                    }
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  リマインダー（分前）
                  <input
                    type="number"
                    min="0"
                    step="5"
                    name="reminderMinutes"
                    value={formValues.reminderMinutes}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        reminderMinutes: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="full-width">
                  メモ
                  <textarea
                    name="notes"
                    rows={4}
                    value={formValues.notes}
                    onChange={(event) => setFormValues((current) => ({ ...current, notes: event.target.value }))}
                  />
                </label>
                <button type="submit" className="primary-button full-width">
                  予定を保存
                </button>
              </form>
            </article>

            <article className="card" id="ai-panel" aria-labelledby="ai-heading">
              <div className="card-header stacked-mobile">
                <div>
                  <p className="eyebrow">AIプランニング</p>
                  <h2 id="ai-heading">旅行相談チャット（モック）</h2>
                </div>
                <span className="status-pill subtle">モックモード</span>
              </div>
              <form className="form-grid" onSubmit={handleAiSubmit}>
                <label>
                  行き先
                  <input value={aiDestination} onChange={(event) => setAiDestination(event.target.value)} />
                </label>
                <label className="full-width">
                  質問
                  <textarea rows={3} value={aiQuestion} onChange={(event) => setAiQuestion(event.target.value)} />
                </label>
                <button type="submit" className="primary-button full-width" disabled={aiLoading}>
                  {aiLoading ? '提案を作成中...' : 'モック提案を作成'}
                </button>
              </form>
              {aiMessage ? (
                <p className="inline-message warning" role="alert">
                  {aiMessage}
                </p>
              ) : null}
              {aiLoading ? (
                <div className="empty-state compact" role="status">
                  <h3>提案を読み込み中</h3>
                  <p>デモ用の固定ロジックでホテル・観光・食事・日程をまとめています。</p>
                </div>
              ) : aiPlan ? (
                <section className="ai-response" aria-label="モックAI回答">
                  <h3>{aiPlan.headline}</h3>
                  <dl>
                    <div>
                      <dt>ホテル候補</dt>
                      <dd>{aiPlan.hotelSuggestion}</dd>
                    </div>
                    <div>
                      <dt>観光候補</dt>
                      <dd>{aiPlan.sightseeingSuggestion}</dd>
                    </div>
                    <div>
                      <dt>食事候補</dt>
                      <dd>{aiPlan.foodSuggestion}</dd>
                    </div>
                    <div>
                      <dt>日程提案</dt>
                      <dd>{aiPlan.scheduleSuggestion}</dd>
                    </div>
                  </dl>
                  <p className="helper-text strong">{aiPlan.note}</p>
                </section>
              ) : (
                <div className="empty-state compact" role="status">
                  <h3>まだ提案はありません</h3>
                  <p>行き先と質問を入力すると、固定ロジックのモック回答を表示します。</p>
                </div>
              )}
            </article>

            <article className="card status-card" id="timetree" aria-labelledby="timetree-heading">
              <div className="card-header">
                <div>
                  <p className="eyebrow">連携状況</p>
                  <h2 id="timetree-heading">TimeTree</h2>
                </div>
                <span className="status-pill subtle">未設定</span>
              </div>
              <p>
                このUI専用デモでは TimeTree のアクセストークンや外部API設定を扱いません。連携カードは見た目確認専用で、常に未設定として表示されます。
              </p>
              <button type="button" className="secondary-button" disabled>
                UIデモでは設定できません
              </button>
            </article>
          </div>
        </section>
      </main>

      <nav className="bottom-nav" aria-label="セクションナビゲーション">
        <a href="#dashboard">概要</a>
        <a href="#itinerary">旅程</a>
        <a href="#add-item">追加</a>
        <a href="#ai-panel">AI</a>
        <a href="#timetree">連携</a>
      </nav>
    </>
  )
}

export default App
