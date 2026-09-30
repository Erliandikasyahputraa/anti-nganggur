import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskFilterToolbar } from '../TaskFilterToolbar'

describe('TaskFilterToolbar Component', () => {
  const mockCounts = {
    all: 10,
    today: 3,
    upcoming: 5,
    completed: 2,
  }

  it('renders all filter tabs with correct labels and counts', () => {
    render(<TaskFilterToolbar activeFilter="all" onFilterChange={vi.fn()} counts={mockCounts} />)

    expect(screen.getByTestId('filter-tab-all')).toHaveTextContent('Semua')
    expect(screen.getByTestId('filter-count-all')).toHaveTextContent('10')

    expect(screen.getByTestId('filter-tab-today')).toHaveTextContent('Hari Ini')
    expect(screen.getByTestId('filter-count-today')).toHaveTextContent('3')

    expect(screen.getByTestId('filter-tab-upcoming')).toHaveTextContent('Mendatang')
    expect(screen.getByTestId('filter-count-upcoming')).toHaveTextContent('5')

    expect(screen.getByTestId('filter-tab-completed')).toHaveTextContent('Selesai')
    expect(screen.getByTestId('filter-count-completed')).toHaveTextContent('2')
  })

  it('calls onFilterChange when a filter tab is clicked', () => {
    const handleFilterChange = vi.fn()
    render(
      <TaskFilterToolbar
        activeFilter="all"
        onFilterChange={handleFilterChange}
        counts={mockCounts}
      />
    )

    fireEvent.click(screen.getByTestId('filter-tab-today'))
    expect(handleFilterChange).toHaveBeenCalledWith('today')

    fireEvent.click(screen.getByTestId('filter-tab-upcoming'))
    expect(handleFilterChange).toHaveBeenCalledWith('upcoming')

    fireEvent.click(screen.getByTestId('filter-tab-completed'))
    expect(handleFilterChange).toHaveBeenCalledWith('completed')

    fireEvent.click(screen.getByTestId('filter-tab-all'))
    expect(handleFilterChange).toHaveBeenCalledWith('all')
  })

  it('enforces min-h-[44px] touch target on all filter tabs to satisfy P2-B hardening', () => {
    render(<TaskFilterToolbar activeFilter="today" onFilterChange={vi.fn()} counts={mockCounts} />)

    const tabs = [
      screen.getByTestId('filter-tab-all'),
      screen.getByTestId('filter-tab-today'),
      screen.getByTestId('filter-tab-upcoming'),
      screen.getByTestId('filter-tab-completed'),
    ]

    for (const tab of tabs) {
      expect(tab.className).toContain('min-h-[44px]')
      expect(tab.className).toContain('touch-manipulation')
    }
  })
})
