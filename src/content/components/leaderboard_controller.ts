import { LeaderboardRecord } from '../../models'
import { DOMUtils } from '../utils/dom_utils'
import { TableSorter } from './table_sorter'
import { PageLoader } from './page_loader'

export class LeaderboardController {
    private table: HTMLTableElement | null = null
    private tbody: HTMLTableSectionElement | null = null
    private originalData: LeaderboardRecord[] = []
    private tableSorter: TableSorter | null = null
    private pageLoader: PageLoader | null = null

    constructor() {
        this.init()
    }

    private init(): void {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () =>
                this.setupLeaderboard()
            )
        } else {
            this.setupLeaderboard()
        }

        // Monitor dynamic content changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    const addedNodes = Array.from(mutation.addedNodes)

                    // Check for leaderboard table updates
                    if (
                        addedNodes.some(
                            (node) =>
                                node.nodeType === Node.ELEMENT_NODE &&
                                (node as Element).querySelector(
                                    '.table-leaderboard'
                                )
                        )
                    ) {
                        setTimeout(() => this.setupLeaderboard(), 100)
                    }

                    // Check for content updates that might indicate filter changes
                    if (
                        addedNodes.some(
                            (node) =>
                                node.nodeType === Node.ELEMENT_NODE &&
                                ((node as Element).classList.contains(
                                    'table-leaderboard'
                                ) ||
                                    (node as Element).querySelector(
                                        '.table-leaderboard tbody'
                                    ) ||
                                    (node as Element).classList.contains(
                                        'leaderboard'
                                    ))
                        )
                    ) {
                        setTimeout(() => {
                            this.reinitializeAfterContentChange()
                        }, 200)
                    }

                    // Handle pagination added later
                    if (
                        addedNodes.some(
                            (node) =>
                                node.nodeType === Node.ELEMENT_NODE &&
                                ((node as Element).querySelector(
                                    '.pagination'
                                ) ||
                                    (node as Element).querySelector(
                                        'nav[role="navigation"]'
                                    ) ||
                                    (node as Element).querySelector(
                                        'a[href*="page="]'
                                    ))
                        )
                    ) {
                        setTimeout(() => {
                            // Only create PageLoader if table exists and PageLoader doesn't exist yet
                            if (this.table && !this.pageLoader) {
                                this.pageLoader = new PageLoader(this.table)
                                this.setupPageLoaderEvents()
                            }
                        }, 200)
                    }
                }
            })
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        })

        // Retry setup after delay
        setTimeout(() => {
            if (!this.table) {
                this.setupLeaderboard()
            }
        }, 1000)
    }

    private setupLeaderboard(): void {
        this.table = document.querySelector(
            '.table-leaderboard'
        ) as HTMLTableElement
        if (!this.table) {
            return
        }

        this.tbody = this.table.querySelector('tbody')
        if (!this.tbody) {
            return
        }

        // Cleanup existing components if they exist
        if (this.tableSorter) {
            this.tableSorter.cleanup()
            this.tableSorter = null
        }

        if (this.pageLoader) {
            this.pageLoader.cleanup()
            this.pageLoader = null
        }

        this.parseTableData()
        this.tableSorter = new TableSorter(this.table)
        this.pageLoader = new PageLoader(this.table)

        this.setupTableSorterEvents()
        this.setupPageLoaderEvents()

        // Initial render to add analysis columns to current table
        if (this.tableSorter && this.originalData.length > 0) {
            this.tableSorter.renderTable(this.originalData)
        }
    }

    private parseTableData(): void {
        const rows = this.tbody?.querySelectorAll('tr') || []
        this.originalData = []

        rows.forEach((row, index) => {
            const data = DOMUtils.parseTableRow(
                row as HTMLTableRowElement,
                index
            )
            if (data) {
                this.originalData.push(data)
            }
        })
    }

    private setupTableSorterEvents(): void {
        if (!this.tableSorter) return

        // Override sortByColumn to handle data rendering
        const originalSortByColumn = this.tableSorter.sortByColumn.bind(
            this.tableSorter
        )
        this.tableSorter.sortByColumn = (columnIndex: number) => {
            originalSortByColumn(columnIndex)
            this.renderSortedData()
        }
    }

    private setupPageLoaderEvents(): void {
        if (!this.pageLoader) return

        // The PageLoader handles its own events internally
        // We just need to re-render when all pages are loaded
    }

    private renderSortedData(): void {
        if (!this.tableSorter) return

        const dataToSort = this.pageLoader?.hasAllPagesData()
            ? this.pageLoader.getAllPagesData()
            : this.originalData

        const sortedData = this.tableSorter.sortData(dataToSort)
        this.tableSorter.renderTable(sortedData)
    }

    public async loadAllPagesAndSort(): Promise<void> {
        if (!this.pageLoader || !this.tableSorter) return

        const allData = await this.pageLoader.loadAllPages()
        if (allData.length > 0) {
            const sortedData = this.tableSorter.sortData(allData)
            this.tableSorter.renderTable(sortedData)
        }
    }

    private reinitializeAfterContentChange(): void {
        // Reset components when content changes (e.g., filter applied)
        this.table = document.querySelector(
            '.table-leaderboard'
        ) as HTMLTableElement
        if (!this.table) return

        this.tbody = this.table.querySelector('tbody')
        if (!this.tbody) return

        // Cleanup existing components before creating new ones
        if (this.tableSorter) {
            this.tableSorter.cleanup()
            this.tableSorter = null
        }

        if (this.pageLoader) {
            this.pageLoader.cleanup()
            this.pageLoader = null
        }

        // Clear previous data
        this.originalData = []

        // Recreate components to ensure they work with the new filter state
        this.parseTableData()

        // Always create new instances to ensure fresh state
        this.tableSorter = new TableSorter(this.table)
        this.setupTableSorterEvents()

        this.pageLoader = new PageLoader(this.table)
        this.setupPageLoaderEvents()

        // Initial render to add analysis columns to current table
        if (this.tableSorter && this.originalData.length > 0) {
            this.tableSorter.renderTable(this.originalData)
        }
    }
}
