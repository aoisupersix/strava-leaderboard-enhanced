/**
 * Interface representing a single leaderboard entry
 */
export interface LeaderboardRecord {
    /** Rank position in the leaderboard */
    rank: number

    /** Athlete name */
    name: string

    /** Date of the activity */
    date: string

    /** Speed in km/h */
    speed: number

    /** Heart rate in BPM (optional) */
    heartRate: number | null

    /** Average climbing speed */
    averageClimbingSpeed: number

    /** Power in watts (optional) */
    power: number | null

    /** Time as string (formatted display) */
    time: string

    /** Time in seconds for calculations */
    timeInSeconds: number

    /** Reference to the original HTML element */
    element: HTMLElement
}
