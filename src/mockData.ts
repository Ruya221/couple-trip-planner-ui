import type { ItineraryItem, MockAiPlan, MockReminder, PlannerData } from './types'

const pad = (value: number) => String(value).padStart(2, '0')

const toDateOnly = (date: Date) => {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  return `${year}-${month}-${day}`
}

const toIsoAt = (baseDate: Date, dayOffset: number, hours: number, minutes: number) => {
  const date = new Date(baseDate)
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

const createItem = (
  id: string,
  title: string,
  dateTime: string,
  location: string,
  category: ItineraryItem['category'],
  notes: string,
  reminderMinutes: number,
): ItineraryItem => ({
  id,
  title,
  dateTime,
  location,
  category,
  notes,
  reminderMinutes,
})

export const createDemoPlannerData = (now: Date = new Date()): PlannerData => {
  const tripStart = new Date(now)
  tripStart.setDate(tripStart.getDate() + 14)
  tripStart.setHours(0, 0, 0, 0)

  return {
    trip: {
      title: '週末箱根リフレッシュ旅行',
      destination: '箱根',
      startDate: toDateOnly(tripStart),
      endDate: toDateOnly(new Date(tripStart.getTime() + 2 * 24 * 60 * 60 * 1000)),
      status: '準備中',
      progress: 68,
    },
    itinerary: [
      createItem(
        'demo-transport',
        'ロマンスカーで新宿を出発',
        toIsoAt(tripStart, 0, 8, 30),
        '新宿駅',
        '移動',
        '乗車前に特急券とモバイルSuicaを確認',
        60,
      ),
      createItem(
        'demo-sightseeing',
        '箱根神社を散策',
        toIsoAt(tripStart, 0, 11, 0),
        '箱根神社',
        '観光',
        '鳥居で写真を撮る時間を確保',
        30,
      ),
      createItem(
        'demo-meal',
        '湖畔でご当地ランチ',
        toIsoAt(tripStart, 0, 13, 0),
        '芦ノ湖エリア',
        '食事',
        '混雑しやすいので早めに到着',
        45,
      ),
      createItem(
        'demo-hotel',
        '温泉旅館にチェックイン',
        toIsoAt(tripStart, 0, 16, 0),
        '箱根湯本',
        'ホテル',
        '夕食の時間と貸切風呂の予約を確認',
        90,
      ),
    ],
  }
}

export const mockReminderExamples: MockReminder[] = [
  {
    id: 'due-example',
    title: '乗車券のQRコード確認',
    detail: 'デモ用の期限超過サンプルです。出発前の持ち物チェックを想定しています。',
    timingLabel: '今すぐ',
    kind: 'due',
  },
  {
    id: 'upcoming-example',
    title: '旅館への到着連絡',
    detail: 'デモ用の予定サンプルです。到着の30分前に通知する想定です。',
    timingLabel: '30分後',
    kind: 'upcoming',
  },
]

export const buildMockAiPlan = (destination: string, question: string): MockAiPlan => {
  const trimmedDestination = destination.trim() || '行き先未設定'
  const trimmedQuestion = question.trim()

  return {
    headline: `${trimmedDestination}向けのモック旅行プラン`,
    hotelSuggestion: `${trimmedDestination}では、駅や主要観光地へ移動しやすい温泉宿を拠点にすると、荷物を置いてから動きやすくなります。`,
    sightseeingSuggestion: `午前は定番スポットを1〜2件、午後は写真映えする散策エリアやカフェを組み合わせると、無理のない観光導線になります。`,
    foodSuggestion: `ご当地ランチを中心に、夜は落ち着いた和食、翌朝は軽めのカフェ朝食にすると、カップルでゆっくり過ごしやすいです。`,
    scheduleSuggestion: `1日目は移動 → 観光 → ホテル、2日目は朝散歩 → 人気スポット → 早めの帰路、という流れを基準に調整するのがおすすめです。${trimmedQuestion ? `「${trimmedQuestion}」を踏まえて休憩を多めに入れる前提です。` : ''}`,
    note: 'このパネルはUI確認用のモックモードです。外部AIやネットワーク通信は行いません。',
  }
}
