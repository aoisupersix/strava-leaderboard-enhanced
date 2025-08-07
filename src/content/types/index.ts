export interface LeaderboardRecord {
    rank: number
    name: string
    date: string
    speed: number
    heartRate: number | null
    averageClimbingSpeed: number
    power: number | null
    time: string
    timeInSeconds: number
    element: HTMLElement
}

export interface SortConfig {
    column: number
    direction: 'asc' | 'desc'
}

export interface PaginationConfig {
    totalPages: number
    currentPage: number
}
