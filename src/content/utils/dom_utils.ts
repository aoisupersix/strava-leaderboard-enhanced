import { LeaderboardRecord } from '../../models/leaderboard_record'

/**
 * Utility class for DOM manipulation and data extraction from Strava leaderboard tables
 */
export class DOMUtils {
    /**
     * Converts time string in MM:SS format to total seconds
     * @param timeStr - Time string in format "MM:SS"
     * @returns Total seconds as number
     */
    static parseTimeToSeconds(timeStr: string): number {
        const match = timeStr.match(/(\d+):(\d+)/)
        if (match) {
            const minutes = parseInt(match[1])
            const seconds = parseInt(match[2])
            return minutes * 60 + seconds
        }
        return 0
    }

    /**
     * Parses a table row and extracts leaderboard data
     * @param row - HTML table row element
     * @param index - Row index for logging purposes
     * @returns LeaderboardRecord object or null if parsing fails
     */
    static parseTableRow(
        row: HTMLTableRowElement,
        index: number
    ): LeaderboardRecord | null {
        const cells = row.querySelectorAll('td')

        // Handle different table structures more flexibly
        if (cells.length < 3) {
            return null
        }

        // Extract rank (special handling for 1st place with avatar)
        let rank: number
        const rankCell = cells[0]
        const rankText = rankCell.textContent?.trim() || ''

        // Check if rank cell contains avatar (indicating rank 1) - enhanced detection
        const hasAvatar =
            rankCell.querySelector('.avatar') !== null ||
            rankCell.querySelector('img') !== null ||
            rankCell.querySelector('[class*="avatar"]') !== null ||
            rankCell.querySelector('[src*="avatar"]') !== null ||
            rankCell.querySelector('[src*="profile"]') !== null

        if (rankText === '' || hasAvatar) {
            // If no text but has avatar, it's rank 1
            // If no text and no avatar, derive from index
            rank = hasAvatar ? 1 : index + 1
        } else {
            rank = parseInt(rankText) || index + 1
        }

        // Extract name - be more flexible about where the name appears
        let name = ''
        let nameCell = cells[1]

        // Try to find name in athlete cell or any cell with a link
        for (let i = 0; i < Math.min(cells.length, 3); i++) {
            const cell = cells[i]
            const nameLink = cell.querySelector('a[href*="/athletes/"]')
            if (nameLink) {
                name = nameLink.textContent?.trim() || ''
                nameCell = cell
                break
            }
        }

        // Fallback to cell text content if no athlete link found
        if (!name) {
            name = nameCell.textContent?.trim() || ''
        }

        // For shorter tables (like filtered results), provide defaults
        const date =
            cells.length > 2
                ? cells[2].querySelector('a')?.textContent?.trim() ||
                  cells[2].textContent?.trim() ||
                  ''
                : ''

        // Extract speed (look for speed pattern in various cells)
        let speed = 0
        for (let i = 2; i < Math.min(cells.length, 6); i++) {
            const cellText = cells[i].textContent?.trim() || ''
            // More flexible speed patterns
            const speedMatch =
                cellText.match(/(\d+\.?\d*)\s*(km\/h|mph|kph)/i) ||
                cellText.match(/(\d+\.?\d*)\s*km/) ||
                cellText.match(/(\d+\.?\d*)\s*mph/i)
            if (speedMatch) {
                speed = parseFloat(speedMatch[1])
                break
            }
        }

        // Extract heart rate (look for heart rate pattern)
        let heartRate: number | null = null
        for (let i = 2; i < Math.min(cells.length, 6); i++) {
            const cellText = cells[i].textContent?.trim() || ''
            // More flexible heart rate patterns
            const heartRateMatch =
                cellText.match(/(\d+)\s*(bpm|♥)/i) ||
                cellText.match(/(\d+)\s*bpm/i) ||
                cellText.match(/♥\s*(\d+)/i)
            if (heartRateMatch) {
                heartRate = parseInt(heartRateMatch[1])
                break
            }
        }

        // Extract power (look for power pattern)
        let power: number | null = null
        for (let i = 2; i < Math.min(cells.length, 6); i++) {
            const cellText = cells[i].textContent?.trim() || ''
            // More flexible power patterns
            const powerMatch =
                cellText.match(/(\d+)\s*(w|watts)/i) ||
                cellText.match(/(\d+)\s*W\b/) ||
                cellText.match(/(\d+)\s*watts/i)
            if (powerMatch) {
                power = parseInt(powerMatch[1])
                break
            }
        }

        // Extract time (look for time pattern in last few cells)
        let time = ''
        let timeInSeconds = 0
        for (let i = Math.max(2, cells.length - 3); i < cells.length; i++) {
            const cellText = cells[i].textContent?.trim() || ''
            const timeMatch = cellText.match(/(\d+):(\d+)/)
            if (timeMatch) {
                time = cellText
                timeInSeconds = this.parseTimeToSeconds(cellText)
                break
            }
        }

        // Extract average climbing speed with flexible matching
        let averageClimbingSpeed = 0
        for (let i = 2; i < Math.min(cells.length, 8); i++) {
            const cellText = cells[i].textContent?.trim() || ''
            // More flexible climbing speed patterns
            const climbingSpeedMatch =
                cellText.match(/(\d+,?\d*\.?\d*)\s*(m\/min|vam)/i) ||
                cellText.match(/(\d+,?\d*\.?\d*)\s*VAM/i) ||
                cellText.match(/(\d+,?\d*\.?\d*)\s*m\/min/i) ||
                cellText.match(/VAM[:\s]*(\d+,?\d*\.?\d*)/i)
            if (climbingSpeedMatch) {
                averageClimbingSpeed = parseFloat(
                    climbingSpeedMatch[1].replace(',', '')
                )
                break
            }
        }

        // If no pattern match found, try Cell 6 (common position for VAM in Strava)
        if (averageClimbingSpeed === 0 && cells.length > 6) {
            const cell6Text = cells[6].textContent?.trim() || ''
            // Check if Cell 6 contains a numeric value (VAM is often just a number)
            const cell6Number = cell6Text.match(/(\d+,?\d*\.?\d*)/)
            if (
                cell6Number &&
                !cell6Text.includes('km') &&
                !cell6Text.includes('時') &&
                !cell6Text.includes(':')
            ) {
                const potentialVAM = parseFloat(cell6Number[1].replace(',', ''))
                // VAM values are typically in range 500-2000+ for cycling
                if (potentialVAM > 100 && potentialVAM < 5000) {
                    averageClimbingSpeed = potentialVAM
                }
            }
        }

        return {
            rank,
            name,
            date,
            speed,
            heartRate,
            averageClimbingSpeed,
            power,
            time,
            timeInSeconds,
            element: row as HTMLElement,
        }
    }

    /**
     * Finds pagination element on the page
     * @returns Pagination element or null if not found
     */
    static findPagination(): Element | null {
        const paginationSelectors = [
            '.pagination',
            'nav[role="navigation"]',
            'ul[role="navigation"]',
            '.pagination-wrapper',
            '.leaderboard-pagination',
            'nav ul',
            '.pager',
        ]

        for (const selector of paginationSelectors) {
            const pagination = document.querySelector(selector)
            if (pagination) {
                return pagination
            }
        }
        return null
    }

    /**
     * Calculates total number of pages from pagination links
     * @returns Total number of pages
     */
    static getTotalPages(): number {
        const paginationSelectors = [
            '.pagination',
            'nav[role="navigation"]',
            'ul[role="navigation"]',
            '.pagination-wrapper',
            '.leaderboard-pagination',
            'nav ul',
        ]

        let maxPage = 1

        for (const selector of paginationSelectors) {
            const pagination = document.querySelector(selector)
            if (!pagination) continue

            // Search for links containing page= parameter
            const pageLinks = pagination.querySelectorAll('a[href*="page="]')

            pageLinks.forEach((link) => {
                const href = link.getAttribute('href')
                if (href) {
                    const pageMatch = href.match(/page=(\d+)/)
                    if (pageMatch) {
                        const pageNum = parseInt(pageMatch[1])
                        if (pageNum > maxPage) {
                            maxPage = pageNum
                        }
                    }
                }
            })

            // Also search in text content for maximum page number
            const paginationText = pagination.textContent || ''
            const pageNumbers = paginationText.match(/\d+/g)
            if (pageNumbers) {
                pageNumbers.forEach((numStr) => {
                    const num = parseInt(numStr)
                    if (num > maxPage && num < 1000) {
                        maxPage = num
                    }
                })
            }

            if (maxPage > 1) break
        }

        // If no page links found, search entire document
        if (maxPage === 1) {
            const allPageLinks = document.querySelectorAll('a[href*="page="]')

            allPageLinks.forEach((link) => {
                const href = link.getAttribute('href')
                if (href) {
                    const pageMatch = href.match(/page=(\d+)/)
                    if (pageMatch) {
                        const pageNum = parseInt(pageMatch[1])
                        if (pageNum > maxPage) {
                            maxPage = pageNum
                        }
                    }
                }
            })
        }

        return maxPage
    }

    /**
     * Gets current page URL parameters to preserve filters
     * @returns URLSearchParams object with current filters
     */
    static getCurrentPageFilters(): URLSearchParams {
        // Get all current URL parameters to preserve filters
        const currentUrl = new URL(window.location.href)
        return currentUrl.searchParams
    }

    /**
     * Builds URL for specific page while preserving current filters
     * @param page - Page number to navigate to
     * @returns Complete URL with filters preserved
     */
    static buildPageUrl(page: number): string {
        // Create URL for specific page while preserving all current filters
        const currentUrl = new URL(window.location.href)
        currentUrl.searchParams.set('page', page.toString())
        return currentUrl.toString()
    }

    /**
     * Detects currently active filter on the page
     * @returns Object containing filter type and value, or null if none detected
     */
    static detectCurrentFilter(): {
        filterType: string
        filterValue: string
    } | null {
        // First, try to detect using the active-filters element
        const activeFiltersElement = document.querySelector(
            '[data-role="active-filters"]'
        )
        if (activeFiltersElement) {
            const filterText = activeFiltersElement.textContent?.trim() || ''
            if (filterText) {
                return {
                    filterType: 'active-filters',
                    filterValue: filterText,
                }
            }
        }

        // Fallback to previous detection methods
        const possibleSelectors = [
            '.btn-group .btn.active',
            '.nav-pills .nav-link.active',
            '.tab-content .active',
            '.filter-buttons .active',
            '[data-filter].active',
            '.leaderboard-filters .active',
        ]

        for (const selector of possibleSelectors) {
            const activeButton = document.querySelector(selector)
            if (activeButton) {
                const text = activeButton.textContent?.trim() || ''
                const dataFilter = activeButton.getAttribute('data-filter')
                const href = activeButton.getAttribute('href')

                return {
                    filterType: dataFilter || 'text',
                    filterValue: dataFilter || text || href || '',
                }
            }
        }

        return null
    }

    /**
     * Extracts filter parameters from active filter links on the page
     * @returns Object containing filter parameters or null if none found
     */
    static extractFilterParamsFromPage(): Record<string, string> | null {
        // First, try to extract parameters from current pagination links
        // Pagination links contain the most accurate filter state
        const pagination = document.querySelector('.pagination')
        if (pagination) {
            const pageLinks = pagination.querySelectorAll(
                'a[href*="leaderboard"]'
            )
            if (pageLinks.length > 0) {
                const firstLink = pageLinks[0] as HTMLAnchorElement
                const href = firstLink.href
                const paginationParams = this.parseUrlParams(href)

                // Compare with current URL params to see if there are differences
                const currentParams = this.parseUrlParams(window.location.href)

                // Check if pagination params have filter info that's different from current URL
                if (
                    paginationParams.filter &&
                    currentParams.filter &&
                    paginationParams.filter !== currentParams.filter
                ) {
                    return paginationParams
                }

                // Merge both, but prioritize pagination params for filter-specific fields
                const mergedParams = { ...currentParams, ...paginationParams }
                return mergedParams
            }
        }

        // Second, try to extract parameters from current URL
        if (window.location.pathname.includes('/leaderboard')) {
            const currentParams = this.parseUrlParams(window.location.href)
            if (Object.keys(currentParams).length > 0) {
                return currentParams
            }
        }

        // Look for active filter link or currently applied filter
        const activeFilters = [
            // Active filter button or link
            '.filter-link.active',
            '.btn.active[data-filter]',
            '.nav-link.active[data-filter]',
            // Look for any element with active class and data attributes
            '[data-filter].active',
            '[data-value].active',
            // Check for selected/current state indicators
            '.selected[data-filter]',
            '.current[data-filter]',
        ]

        for (const selector of activeFilters) {
            const activeElement = document.querySelector(selector)
            if (activeElement) {
                const href = activeElement.getAttribute('href')
                if (href) {
                    return this.parseUrlParams(href)
                }
            }
        }

        // If no active element found, try to find filter links and match with current state
        const filterLinks = document.querySelectorAll(
            '.filter-link[href*="leaderboard"]'
        )
        for (const link of filterLinks) {
            const linkElement = link as HTMLAnchorElement
            const href = linkElement.href
            const text = linkElement.textContent?.trim() || ''

            // Check if this link matches current filter state
            const currentFilter = this.detectCurrentFilter()
            if (currentFilter && text === currentFilter.filterValue) {
                return this.parseUrlParams(href)
            }
        }

        return null
    }

    /**
     * Parses URL parameters from href
     * @param url - URL string to parse
     * @returns Object containing parsed parameters
     */
    static parseUrlParams(url: string): Record<string, string> {
        try {
            const urlObj = new URL(url, window.location.origin)
            const params: Record<string, string> = {}

            // List of allowed parameters for leaderboard requests
            const allowedParams = [
                'club_id',
                'filter',
                'per_page',
                'partial',
                // Add other known valid parameters if needed
            ]

            urlObj.searchParams.forEach((value, key) => {
                // Skip page parameter as it will be set dynamically
                // Only include allowed parameters to avoid conflicts
                if (key !== 'page' && allowedParams.includes(key)) {
                    params[key] = value
                }
            })

            return params
        } catch {
            return {}
        }
    }

    /**
     * Gets filter request data for making filtered requests
     * @returns Object containing current filter and form data
     */
    static getFilterRequestData(): {
        currentFilter: { filterType: string; filterValue: string } | null
        formData: Record<string, string>
    } {
        // Get current filter using the active-filters element
        const currentFilter = this.detectCurrentFilter()

        let formData: Record<string, string> = {}

        // Extract parameters from active filter links on the page
        const filterParams = this.extractFilterParamsFromPage()
        if (filterParams) {
            formData = { ...formData, ...filterParams }
        }

        // Look for any form data or hidden inputs that might contain filter information
        const forms = document.querySelectorAll('form')
        forms.forEach((form) => {
            const inputs = form.querySelectorAll(
                'input[type="hidden"], input[name*="filter"], input[name*="view"], input[name*="segment"]'
            )
            inputs.forEach((input) => {
                const inputElement = input as HTMLInputElement
                if (inputElement.name && inputElement.value) {
                    formData[inputElement.name] = inputElement.value
                }
            })
        })

        // Look for data attributes on the leaderboard container and related elements
        const leaderboardContainer = document
            .querySelector('.table-leaderboard')
            ?.closest(
                '[data-react-class], [data-filter], [data-segment-id], [data-view]'
            )
        if (leaderboardContainer) {
            const attributes = leaderboardContainer.attributes
            for (let i = 0; i < attributes.length; i++) {
                const attr = attributes[i]
                if (attr.name.startsWith('data-')) {
                    formData[attr.name.replace('data-', '')] = attr.value
                }
            }
        }

        // Try to extract segment ID from URL
        const urlMatch = window.location.pathname.match(/\/segments\/(\d+)/)
        if (urlMatch) {
            formData['segment_id'] = urlMatch[1]
        }

        // Map filter text to expected parameter values (fallback method)
        if (currentFilter && currentFilter.filterValue && !filterParams) {
            const filterValue = currentFilter.filterValue.toLowerCase()
            if (filterValue.includes('my') || filterValue.includes('結果')) {
                formData['filter'] = 'my_results'
            } else if (
                filterValue.includes('フォロー') ||
                filterValue.includes('follow')
            ) {
                formData['filter'] = 'following'
            } else if (
                filterValue.includes('今年') ||
                filterValue.includes('current')
            ) {
                formData['filter'] = 'current_year'
            } else if (
                filterValue.includes('全期間') ||
                filterValue.includes('overall')
            ) {
                formData['filter'] = 'overall'
            }
        }

        return {
            currentFilter,
            formData,
        }
    }

    /**
     * Builds filtered page request configuration
     * @param page - Page number to request
     * @returns Request configuration object
     */
    static buildFilteredPageRequest(page: number): {
        url: string
        method: string
        body?: FormData
        headers: Record<string, string>
    } {
        const filterInfo = this.getFilterRequestData()

        // Ensure we're using the leaderboard endpoint
        let baseUrl = window.location.origin + window.location.pathname
        if (!window.location.pathname.includes('/leaderboard')) {
            // If current URL doesn't include leaderboard, construct it
            const pathParts = window.location.pathname.split('/')
            if (pathParts.length >= 3 && pathParts[1] === 'segments') {
                baseUrl = `${window.location.origin}/segments/${pathParts[2]}/leaderboard`
            }
        }

        // Build form data for POST request
        const formData = new FormData()
        formData.append('page', page.toString())

        // Add all detected form data
        Object.keys(filterInfo.formData).forEach((key) => {
            if (filterInfo.formData[key]) {
                formData.append(key, filterInfo.formData[key])
            }
        })

        // Common headers for Strava AJAX requests
        const headers: Record<string, string> = {
            'X-Requested-With': 'XMLHttpRequest',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Cache-Control': 'no-cache',
        }

        // Add CSRF token if available
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content')
        if (csrfToken) {
            formData.append('authenticity_token', csrfToken)
            headers['X-CSRF-Token'] = csrfToken
        }

        return {
            url: baseUrl,
            method: 'POST',
            body: formData,
            headers,
        }
    }
}
