/**
 * Interface for sorting configuration
 */
export interface SortConfig {
    /** Column index to sort by */
    column: number
    /** Sort direction */
    direction: 'asc' | 'desc'
}
