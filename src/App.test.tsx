import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

beforeEach(() => {
  window.localStorage.clear()
})

describe('App', () => {
  it('renders the initial trip dashboard and sample itinerary', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: '週末箱根リフレッシュ旅行' })).toBeInTheDocument()
    expect(screen.getByText('箱根')).toBeInTheDocument()
    expect(screen.getByText('ロマンスカーで新宿を出発')).toBeInTheDocument()
  })

  it('adds a new itinerary item', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('heading', { name: '週末箱根リフレッシュ旅行' })

    await user.type(screen.getByLabelText('タイトル'), '美術館に立ち寄る')
    await user.type(screen.getByLabelText('日時'), '2026-10-01T10:30')
    await user.type(screen.getByLabelText('場所'), '彫刻の森美術館')
    await user.selectOptions(screen.getByLabelText('カテゴリ'), '観光')
    await user.type(screen.getByLabelText('メモ'), 'チケットを事前購入する')
    await user.clear(screen.getByLabelText('リマインダー（分前）'))
    await user.type(screen.getByLabelText('リマインダー（分前）'), '20')
    await user.click(screen.getByRole('button', { name: '予定を保存' }))

    expect(await screen.findByText('美術館に立ち寄る')).toBeInTheDocument()
    expect(screen.getByText('旅程を追加しました。')).toBeInTheDocument()
  })

  it('deletes an itinerary item after confirmation', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('heading', { name: '週末箱根リフレッシュ旅行' })

    const item = screen.getByText('湖畔でご当地ランチ').closest('.timeline-content')
    expect(item).not.toBeNull()

    await user.click(within(item as HTMLElement).getByRole('button', { name: '削除する' }))
    await user.click(screen.getByRole('button', { name: '削除を確定' }))

    await waitFor(() => {
      expect(screen.queryByText('湖畔でご当地ランチ')).not.toBeInTheDocument()
    })
  })

  it('shows a deterministic mock AI response', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('heading', { name: '週末箱根リフレッシュ旅行' })

    await user.clear(screen.getByLabelText('行き先'))
    await user.type(screen.getByLabelText('行き先'), '京都')
    await user.clear(screen.getByLabelText('質問'))
    await user.type(screen.getByLabelText('質問'), '静かなホテルを中心にしたいです。')
    await user.click(screen.getByRole('button', { name: 'モック提案を作成' }))

    expect(await screen.findByRole('heading', { name: '京都向けのモック旅行プラン' })).toBeInTheDocument()

    const response = screen.getByLabelText('モックAI回答')
    expect(within(response).getByText(/温泉宿を拠点にすると/)).toBeInTheDocument()
    expect(within(response).getByText(/ご当地ランチ/)).toBeInTheDocument()
    expect(within(response).getByText(/UI確認用のモックモード/)).toBeInTheDocument()
  })
})
