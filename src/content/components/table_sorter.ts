import { LeaderboardRecord, SortConfig } from '../../models'

export class TableSorter {
    private table: HTMLTableElement | null = null
    private tbody: HTMLTableSectionElement | null = null
    private currentSort: SortConfig = { column: -1, direction: 'asc' }
    private currentSortColumn: number | null = null
    private isAscending: boolean = true
    private columnVisibility: Record<string, boolean> = {}
    private columnControlPanel: HTMLElement | null = null
    private columns: string[] = []

    constructor(table: HTMLTableElement) {
        this.table = table
        this.tbody = table.querySelector('tbody')
        this.currentSortColumn = null
        this.isAscending = true

        // 動的に列情報を取得
        this.initializeColumns()
        this.initializeColumnVisibility()

        this.createColumnControlPanel()
        this.setupSortingHeaders()
        this.addSortingStyles()
        this.addColumnControlStyles()
    }

    /**
     * テーブルヘッダーから列名を取得して初期化
     */
    private initializeColumns(): void {
        const thead = this.table?.querySelector('thead')
        if (!thead) return

        const headerRow = thead.querySelector('tr')
        if (!headerRow) return

        const headers = headerRow.querySelectorAll('th')
        this.columns = Array.from(headers).map(
            (th) => th.textContent?.trim() || ''
        )
    }

    /**
     * 列の表示・非表示設定を初期化（全て表示）
     */
    private initializeColumnVisibility(): void {
        this.columnVisibility = {}
        this.columns.forEach((columnName) => {
            this.columnVisibility[columnName] = true
        })
    }

    // Add styles for column control panel
    private addColumnControlStyles(): void {
        // Check if styles already exist
        if (document.getElementById('column-control-styles')) {
            return
        }

        const style = document.createElement('style')
        style.id = 'column-control-styles'
        style.textContent = `
            .column-control-panel {
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-bottom: 10px;
                margin-top: 15px;
                font-family: inherit;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .column-control-header {
                padding: 10px 15px;
                background: #f8f9fa;
                border-bottom: 1px solid #ddd;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
                font-weight: 500;
            }

            .column-control-header:hover {
                background: #e9ecef;
            }

            .column-control-toggle {
                background: none;
                border: none;
                font-size: 14px;
                cursor: pointer;
                padding: 0;
                color: #666;
            }

            .column-control-content {
                display: none;
                padding: 15px;
            }

            .column-control-content.expanded {
                display: block;
            }

            .column-control-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 8px;
                margin-bottom: 15px;
            }

            .column-control-grid label {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 14px;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 3px;
                transition: background-color 0.2s;
            }

            .column-control-grid label:hover {
                background: #f0f0f0;
            }

            .column-control-grid input[type="checkbox"] {
                margin: 0;
            }

            .column-control-actions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .column-control-actions button {
                padding: 6px 12px;
                border: 1px solid #ddd;
                background: #fff;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;
            }

            .column-control-actions button:hover {
                background: #f8f9fa;
                border-color: #999;
            }

            .column-control-all {
                background: #28a745 !important;
                color: white !important;
                border-color: #28a745 !important;
            }

            .column-control-all:hover {
                background: #218838 !important;
                border-color: #1e7e34 !important;
            }

            .column-control-none {
                background: #dc3545 !important;
                color: white !important;
                border-color: #dc3545 !important;
            }

            .column-control-none:hover {
                background: #c82333 !important;
                border-color: #bd2130 !important;
            }
        `
        document.head.appendChild(style)
    }

    // Create column control panel for toggling column visibility
    private createColumnControlPanel(): void {
        // Create control panel container
        this.columnControlPanel = document.createElement('div')
        this.columnControlPanel.className = 'column-control-panel'

        // 動的に列のチェックボックスを生成
        const columnCheckboxes = this.columns
            .map((columnName, index) => {
                const isChecked = this.columnVisibility[columnName]
                    ? 'checked'
                    : ''
                return `<label><input type="checkbox" data-column="${columnName}" data-index="${index}" ${isChecked}> ${columnName}</label>`
            })
            .join('')

        this.columnControlPanel.innerHTML = `
            <div class="column-control-header">
                <span>列の表示・非表示</span>
                <button class="column-control-toggle">▼</button>
            </div>
            <div class="column-control-content">
                <div class="column-control-grid">
                    ${columnCheckboxes}
                </div>
                <div class="column-control-actions">
                    <button class="column-control-all">全て選択</button>
                    <button class="column-control-none">全て解除</button>
                </div>
            </div>
        `

        // Add event listeners
        this.addColumnControlListeners()

        // Insert before the table
        const parentNode = this.table?.parentNode
        if (parentNode) {
            parentNode.insertBefore(this.columnControlPanel, this.table)
        }
    }

    // Add event listeners for column control panel
    private addColumnControlListeners(): void {
        if (!this.columnControlPanel) return

        // Toggle panel visibility - both header and toggle button
        const header = this.columnControlPanel.querySelector(
            '.column-control-header'
        )
        const toggleButton = this.columnControlPanel.querySelector(
            '.column-control-toggle'
        )
        const content = this.columnControlPanel.querySelector(
            '.column-control-content'
        )

        const togglePanel = () => {
            if (content && toggleButton) {
                const isExpanded = content.classList.contains('expanded')
                content.classList.toggle('expanded', !isExpanded)
                toggleButton.textContent = isExpanded ? '▼' : '▲'
            }
        }

        // Make entire header clickable
        if (header) {
            header.addEventListener('click', togglePanel)
        }

        // Column checkbox listeners
        const checkboxes = this.columnControlPanel.querySelectorAll(
            'input[type="checkbox"]'
        )
        checkboxes.forEach((checkbox) => {
            checkbox.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement
                const columnName = target.dataset.column
                if (columnName) {
                    this.columnVisibility[columnName] = target.checked
                    this.updateColumnVisibility()
                }
            })
        })

        // Action button listeners
        const allButton = this.columnControlPanel.querySelector(
            '.column-control-all'
        )
        const noneButton = this.columnControlPanel.querySelector(
            '.column-control-none'
        )

        if (allButton) {
            allButton.addEventListener('click', () => {
                this.columns.forEach((columnName) => {
                    this.columnVisibility[columnName] = true
                })
                this.updateCheckboxes()
                this.updateColumnVisibility()
            })
        }

        if (noneButton) {
            noneButton.addEventListener('click', () => {
                this.columns.forEach((columnName) => {
                    this.columnVisibility[columnName] = false
                })
                this.updateCheckboxes()
                this.updateColumnVisibility()
            })
        }
    }

    // Update checkbox states to match current columnVisibility
    private updateCheckboxes(): void {
        if (!this.columnControlPanel) return

        const checkboxes = this.columnControlPanel.querySelectorAll(
            'input[type="checkbox"]'
        )
        checkboxes.forEach((checkbox) => {
            const input = checkbox as HTMLInputElement
            const columnName = input.dataset.column
            if (columnName) {
                input.checked = this.columnVisibility[columnName] || false
            }
        })
    }

    // Update table column visibility based on current settings
    private updateColumnVisibility(): void {
        if (!this.table) return

        // Hide/show header columns
        const thead = this.table.querySelector('thead')
        if (thead) {
            const headerRow = thead.querySelector('tr')
            if (headerRow) {
                const headers = headerRow.querySelectorAll('th')
                this.columns.forEach((columnName, index) => {
                    const header = headers[index]
                    if (header) {
                        const isVisible =
                            this.columnVisibility[columnName] || false
                        header.style.display = isVisible ? '' : 'none'
                    }
                })
            }
        }

        // Hide/show body columns
        const tbody = this.table.querySelector('tbody')
        if (tbody) {
            const rows = tbody.querySelectorAll('tr')
            rows.forEach((row) => {
                const cells = row.querySelectorAll('td')
                this.columns.forEach((columnName, index) => {
                    const cell = cells[index]
                    if (cell) {
                        const isVisible =
                            this.columnVisibility[columnName] || false
                        cell.style.display = isVisible ? '' : 'none'
                    }
                })
            })
        }
    }

    // Cleanup method to remove sort indicators and event listeners
    public cleanup(): void {
        if (!this.table) return

        // Remove column control panel
        if (this.columnControlPanel) {
            this.columnControlPanel.remove()
            this.columnControlPanel = null
        }

        const thead = this.table.querySelector('thead')
        if (!thead) return

        const headerRow = thead.querySelector('tr')
        if (!headerRow) return

        const headers = headerRow.querySelectorAll('th')
        headers.forEach((header) => {
            // Remove sort indicators
            const indicator = header.querySelector('.sort-indicator')
            if (indicator) {
                indicator.remove()
            }

            // Reset header styles
            const headerElement = header as HTMLElement
            headerElement.style.cursor = ''
            headerElement.style.userSelect = ''
            headerElement.style.position = ''

            // Clone the element to remove all event listeners
            const newHeader = headerElement.cloneNode(true) as HTMLElement
            headerElement.parentNode?.replaceChild(newHeader, headerElement)
        })

        // Remove custom styles
        const existingStyle = document.getElementById('leaderboard-sort-styles')
        if (existingStyle) {
            existingStyle.remove()
        }

        const columnControlStyle = document.getElementById(
            'column-control-styles'
        )
        if (columnControlStyle) {
            columnControlStyle.remove()
        }
    }

    private setupSortingHeaders(): void {
        const thead = this.table?.querySelector('thead')
        if (!thead) return

        const headerRow = thead.querySelector('tr')
        if (!headerRow) return

        const headers = headerRow.querySelectorAll('th')

        // 全ての列にソート機能を追加
        this.columns.forEach((columnName, index) => {
            if (headers[index]) {
                const header = headers[index] as HTMLElement
                header.style.cursor = 'pointer'
                header.style.userSelect = 'none'
                header.style.position = 'relative'

                // Add sort indicator
                const indicator = document.createElement('span')
                indicator.className = 'sort-indicator'
                indicator.style.marginLeft = '5px'
                indicator.style.opacity = '0.5'
                indicator.textContent = '↕'
                header.appendChild(indicator)

                header.addEventListener('click', () => this.sortByColumn(index))
            }
        })
    }

    private addSortingStyles(): void {
        if (document.getElementById('table-sorter-styles')) return

        const style = document.createElement('style')
        style.id = 'table-sorter-styles'
        style.textContent = `
            .table-leaderboard th.sortable:hover {
                background-color: rgba(0, 123, 255, 0.1);
            }

            .table-leaderboard th.sort-asc .sort-indicator {
                opacity: 1;
                color: #007bff;
            }

            .table-leaderboard th.sort-desc .sort-indicator {
                opacity: 1;
                color: #007bff;
            }

            .table-leaderboard th.sort-asc .sort-indicator::before {
                content: '↑';
            }

            .table-leaderboard th.sort-desc .sort-indicator::before {
                content: '↓';
            }

            .table-leaderboard th.sort-asc .sort-indicator,
            .table-leaderboard th.sort-desc .sort-indicator {
                font-weight: bold;
            }
        `
        document.head.appendChild(style)
    }

    public sortByColumn(columnIndex: number): void {
        if (this.currentSort.column === columnIndex) {
            this.currentSort.direction =
                this.currentSort.direction === 'asc' ? 'desc' : 'asc'
        } else {
            this.currentSort.column = columnIndex
            this.currentSort.direction = 'asc'
        }

        this.updateHeaderStyles()
    }

    /**
     * セルの値から適切な比較値を取得
     */
    private getCellValue(
        row: HTMLTableRowElement,
        columnIndex: number
    ): string | number | Date {
        const cell = row.cells[columnIndex]
        if (!cell) return ''

        const text = cell.textContent?.trim() || ''

        // ランク列（0列目）の特別処理 - アバター検出
        if (columnIndex === 0) {
            // アバターがある場合は1位として扱う
            const hasAvatar =
                cell.querySelector('.avatar') !== null ||
                cell.querySelector('img') !== null ||
                cell.querySelector('[class*="avatar"]') !== null ||
                cell.querySelector('[src*="avatar"]') !== null ||
                cell.querySelector('[src*="profile"]') !== null

            if (hasAvatar) {
                return 1
            }

            // テキストがある場合は数値として処理
            if (text && text !== '-') {
                const rankValue = parseInt(text)
                if (!isNaN(rankValue)) return rankValue
            }

            // テキストもアバターもない場合は、行のインデックスから推定
            const tbody = row.closest('tbody')
            if (tbody) {
                const rows = tbody.querySelectorAll('tr')
                const rowIndex = Array.from(rows).indexOf(row)
                return rowIndex + 1
            }
        }

        // 空の値の場合
        if (!text || text === '-' || text === '') return ''

        // 数値判定（整数または小数点）
        const numericMatch = text.match(/^[\d,]+\.?\d*/)
        if (numericMatch) {
            const numericValue = parseFloat(numericMatch[0].replace(/,/g, ''))
            if (!isNaN(numericValue)) return numericValue
        }

        // 日付判定（年月日形式）
        const dateMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
        if (dateMatch) {
            const [, year, month, day] = dateMatch
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        }

        // 時間形式判定（mm:ss または h:mm:ss）
        const timeMatch = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
        if (timeMatch) {
            const [, hours, minutes, seconds = '0'] = timeMatch
            return (
                parseInt(hours) * 3600 +
                parseInt(minutes) * 60 +
                parseInt(seconds)
            )
        }

        // その他は文字列として扱う
        return text.toLowerCase()
    }

    public sortData(data: LeaderboardRecord[]): LeaderboardRecord[] {
        if (this.currentSort.column === -1) return data

        return [...data].sort((a, b) => {
            const aValue = this.getCellValue(
                a.element as HTMLTableRowElement,
                this.currentSort.column
            )
            const bValue = this.getCellValue(
                b.element as HTMLTableRowElement,
                this.currentSort.column
            )

            let result = 0

            // 空の値は最後に配置
            if (aValue === '' && bValue === '') return 0
            if (aValue === '') return 1
            if (bValue === '') return -1

            // 型が同じ場合の比較
            if (typeof aValue === typeof bValue) {
                if (aValue < bValue) result = -1
                else if (aValue > bValue) result = 1
                else result = 0
            } else {
                // 型が違う場合は文字列比較
                const aStr = String(aValue)
                const bStr = String(bValue)
                result = aStr.localeCompare(bStr)
            }

            return this.currentSort.direction === 'desc' ? -result : result
        })
    }

    public renderTable(data: LeaderboardRecord[]): void {
        if (!this.tbody) return

        const fragment = document.createDocumentFragment()
        data.forEach((entry) => {
            // Clone the row element
            const row = entry.element.cloneNode(true) as HTMLTableRowElement
            fragment.appendChild(row)
        })

        this.tbody.innerHTML = ''
        this.tbody.appendChild(fragment)

        // Apply column visibility settings
        this.updateColumnVisibility()
    }

    private updateHeaderStyles(): void {
        const thead = this.table?.querySelector('thead')
        if (!thead) return

        const headers = thead.querySelectorAll('th')
        headers.forEach((header, index) => {
            header.classList.remove('sort-asc', 'sort-desc')
            if (index === this.currentSort.column) {
                header.classList.add(`sort-${this.currentSort.direction}`)
            }
        })
    }

    public getCurrentSort(): SortConfig {
        return { ...this.currentSort }
    }
}
