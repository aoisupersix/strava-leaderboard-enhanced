import { LeaderboardRecord } from '../../models'
import { DOMUtils } from '../utils/dom_utils'

export class PageLoader {
    private isLoadingAllPages: boolean = false
    private loadAllPagesButton: HTMLButtonElement | null = null
    private csvExportButton: HTMLButtonElement | null = null
    private allPagesData: LeaderboardRecord[] = []
    private loadingAborted: boolean = false

    constructor(private table: HTMLTableElement) {
        this.addLoadAllPagesButton()
    }

    // Cleanup method to remove buttons and reset state
    public cleanup(): void {
        this.removeAllExistingButtons()
        this.allPagesData = []
        this.loadingAborted = false
        this.isLoadingAllPages = false
    }

    private addLoadAllPagesButton(): void {
        // Remove ALL existing buttons (not just the one we track)
        this.removeAllExistingButtons()

        // Check if pagination exists - if not, only show CSV button
        const pagination = document.querySelector('.pagination')

        if (!pagination) {
            // Create container and CSV button even without pagination
            this.createButtonContainer()
            this.createCsvExportButton()
            return
        }

        // Check if there are multiple pages
        const totalPages = DOMUtils.getTotalPages()

        if (totalPages <= 1) {
            // Create container and CSV button even with single page
            this.createButtonContainer()
            this.createCsvExportButton()
            return
        }

        // Create both buttons when multiple pages exist
        this.createAndInsertButton()
        this.createCsvExportButton()
    }

    private removeAllExistingButtons(): void {
        // Remove tracked button
        if (this.loadAllPagesButton) {
            this.loadAllPagesButton.remove()
            this.loadAllPagesButton = null
        }

        // Remove CSV export button
        if (this.csvExportButton) {
            this.csvExportButton.remove()
            this.csvExportButton = null
        }

        // Remove all buttons with our class and the container
        const existingButtons = document.querySelectorAll(
            '.load-all-pages-btn, .csv-export-btn'
        )
        existingButtons.forEach((button) => button.remove())

        // Remove button container
        const existingContainer = document.querySelector(
            '.page-loader-button-container'
        )
        if (existingContainer) {
            existingContainer.remove()
        }
    }

    private createButtonContainer(): void {
        // ボタンコンテナを作成
        const buttonContainer = document.createElement('div')
        buttonContainer.className = 'page-loader-button-container'
        buttonContainer.style.display = 'flex'
        buttonContainer.style.gap = '10px'
        buttonContainer.style.margin = '10px 0'
        buttonContainer.style.alignItems = 'center'

        // Always place button container directly above the table
        this.table.parentNode?.insertBefore(buttonContainer, this.table)
    }

    private createAndInsertButton(): void {
        // コンテナが存在しない場合は作成
        let buttonContainer = document.querySelector(
            '.page-loader-button-container'
        ) as HTMLElement
        if (!buttonContainer) {
            this.createButtonContainer()
            buttonContainer = document.querySelector(
                '.page-loader-button-container'
            ) as HTMLElement
        }

        this.loadAllPagesButton = document.createElement('button')
        this.loadAllPagesButton.textContent = '全ページ読み込み'
        this.loadAllPagesButton.className = 'btn btn-primary load-all-pages-btn'
        this.loadAllPagesButton.style.margin = '0'
        this.loadAllPagesButton.style.padding = '8px 16px'
        this.loadAllPagesButton.style.backgroundColor = '#fc4c02'
        this.loadAllPagesButton.style.color = 'white'
        this.loadAllPagesButton.style.border = 'none'
        this.loadAllPagesButton.style.borderRadius = '4px'
        this.loadAllPagesButton.style.cursor = 'pointer'
        this.loadAllPagesButton.style.fontWeight = 'bold'
        this.loadAllPagesButton.style.display = 'inline-block'
        this.loadAllPagesButton.style.width = 'fit-content'

        this.addButtonStyles()

        this.loadAllPagesButton.addEventListener('click', () => {
            this.loadAllPages()
        })

        // ボタンをコンテナに追加
        if (buttonContainer) {
            buttonContainer.appendChild(this.loadAllPagesButton)
        }
    }

    /**
     * CSV出力ボタンを作成して追加
     */
    private createCsvExportButton(): void {
        // コンテナが存在しない場合は作成
        let buttonContainer = document.querySelector(
            '.page-loader-button-container'
        ) as HTMLElement
        if (!buttonContainer) {
            this.createButtonContainer()
            buttonContainer = document.querySelector(
                '.page-loader-button-container'
            ) as HTMLElement
        }

        this.csvExportButton = document.createElement('button')
        this.csvExportButton.textContent = 'CSV出力'
        this.csvExportButton.className = 'btn btn-secondary csv-export-btn'
        this.csvExportButton.style.margin = '0'
        this.csvExportButton.style.padding = '8px 16px'
        this.csvExportButton.style.backgroundColor = '#28a745'
        this.csvExportButton.style.color = 'white'
        this.csvExportButton.style.border = 'none'
        this.csvExportButton.style.borderRadius = '4px'
        this.csvExportButton.style.cursor = 'pointer'
        this.csvExportButton.style.fontWeight = 'bold'
        this.csvExportButton.style.display = 'inline-block'
        this.csvExportButton.style.width = 'fit-content'

        this.csvExportButton.addEventListener('click', () => {
            this.exportToCSVDirectly()
        })

        // CSV出力ボタンをコンテナに追加
        if (buttonContainer) {
            buttonContainer.appendChild(this.csvExportButton)
        }
    }

    /**
     * テーブル内容を変更せずに直接CSV出力を実行
     */
    private exportToCSVDirectly(): void {
        // CSV出力を実行（テーブル内容は変更しない）
        this.exportToCSV()
    }

    /**
     * 全データを読み込んでからCSV出力を実行
     */
    private async exportToCSVWithFullData(): Promise<void> {
        // 全ページデータがない場合は先に全ページ読み込みを実行
        if (!this.hasAllPagesData()) {
            const totalPages = DOMUtils.getTotalPages()
            if (totalPages > 1) {
                // ボタンを無効化
                if (this.csvExportButton) {
                    this.csvExportButton.textContent = '全データ読み込み中...'
                    this.csvExportButton.disabled = true
                }

                try {
                    await this.loadAllPages()
                } catch (error) {
                    console.error('CSV出力: 全ページ読み込みエラー', error)
                    alert('全ページの読み込み中にエラーが発生しました。')
                    return
                } finally {
                    // ボタンを元に戻す
                    if (this.csvExportButton) {
                        this.csvExportButton.textContent = 'CSV出力'
                        this.csvExportButton.disabled = false
                    }
                }
            }
        }

        // CSV出力を実行
        this.exportToCSV()
    }

    /**
     * テーブルデータをCSV形式で出力
     */
    private exportToCSV(): void {
        let dataToExport: LeaderboardRecord[] = []

        // 全ページデータがある場合はそれを使用、なければ現在のページのデータを使用
        if (this.hasAllPagesData()) {
            dataToExport = this.allPagesData
        } else {
            // 現在のページのデータを取得
            const tbody = this.table.querySelector('tbody')
            if (tbody) {
                const rows = tbody.querySelectorAll('tr')
                rows.forEach((row, index) => {
                    const data = DOMUtils.parseTableRow(
                        row as HTMLTableRowElement,
                        index
                    )
                    if (data) {
                        dataToExport.push(data)
                    }
                })
            }
        }

        if (dataToExport.length === 0) {
            alert(
                '出力するデータがありません。全ページ読み込みを実行してからお試しください。'
            )
            return
        }

        // テーブルヘッダーから動的に列名を取得
        const headers = this.getTableHeaders()

        // CSVデータを作成
        const csvRows = [headers.join(',')]

        dataToExport.forEach((record) => {
            const row = this.formatRecordForCSV(record)
            csvRows.push(row.join(','))
        })

        // CSVファイルを作成してダウンロード
        const csvContent = csvRows.join('\n')
        const blob = new Blob(['\uFEFF' + csvContent], {
            type: 'text/csv;charset=utf-8;',
        })

        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)

        // ファイル名を生成（セグメント名と日時を含む）
        const segmentName =
            document.title.split(' - ')[0] || 'strava-leaderboard'
        const timestamp = new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/[:-]/g, '')
        const filename = `${segmentName}_${timestamp}.csv`

        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        // 成功メッセージを表示
        this.showCsvExportSuccess(dataToExport.length, filename)
    }

    /**
     * テーブルヘッダーから列名を取得
     */
    private getTableHeaders(): string[] {
        const thead = this.table?.querySelector('thead')
        if (!thead) {
            // フォールバック用のデフォルトヘッダー
            return [
                '順位',
                '名前',
                '日付',
                'スピード',
                '心拍数',
                '平均上昇速度',
                'パワー',
                'タイム',
            ]
        }

        const headerRow = thead.querySelector('tr')
        if (!headerRow) {
            return [
                '順位',
                '名前',
                '日付',
                'スピード',
                '心拍数',
                '平均上昇速度',
                'パワー',
                'タイム',
            ]
        }

        const headers = headerRow.querySelectorAll('th')
        return Array.from(headers)
            .map((th) => {
                const text = th.textContent?.trim() || ''
                // ソートインジケーター「↕」を除去
                return text.replace(/↕/g, '').trim()
            })
            .filter((header) => header !== '') // 空のヘッダーは除外
    }

    /**
     * レコードをCSV行形式にフォーマット
     */
    private formatRecordForCSV(record: LeaderboardRecord): string[] {
        const values: (string | number)[] = [
            record.rank,
            record.name,
            record.date,
            record.speed,
            record.heartRate || '',
            record.averageClimbingSpeed,
            record.power || '',
            record.time,
        ]

        // CSV形式に適した文字列処理
        return values.map((value) => {
            if (value === null || value === undefined) {
                return ''
            }

            const stringValue = String(value)

            // カンマ、引用符、改行が含まれている場合は引用符で囲む
            if (
                stringValue.includes(',') ||
                stringValue.includes('"') ||
                stringValue.includes('\n')
            ) {
                // 内部の引用符をエスケープ
                const escapedValue = stringValue.replace(/"/g, '""')
                return `"${escapedValue}"`
            }

            return stringValue
        })
    }

    /**
     * CSV出力成功メッセージを表示
     */
    private showCsvExportSuccess(recordCount: number, filename: string): void {
        const successDiv = document.createElement('div')
        successDiv.style.position = 'fixed'
        successDiv.style.top = '20px'
        successDiv.style.right = '20px'
        successDiv.style.backgroundColor = '#28a745'
        successDiv.style.color = 'white'
        successDiv.style.padding = '15px 20px'
        successDiv.style.borderRadius = '8px'
        successDiv.style.zIndex = '10001'
        successDiv.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'
        successDiv.style.animation = 'slideInRight 0.3s ease-out'

        successDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">✅</span>
                <div>
                    <div style="font-weight: bold; margin-bottom: 5px;">CSV出力完了</div>
                    <div style="font-size: 14px;">${recordCount}件のデータを出力しました</div>
                    <div style="font-size: 12px; opacity: 0.9;">${filename}</div>
                </div>
            </div>
        `

        document.body.appendChild(successDiv)

        // 3秒後に自動で消去
        setTimeout(() => {
            successDiv.style.animation = 'slideOutRight 0.3s ease-in'
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.remove()
                }
            }, 300)
        }, 3000)
    }

    private addButtonStyles(): void {
        if (document.getElementById('page-loader-styles')) return

        const style = document.createElement('style')
        style.id = 'page-loader-styles'
        style.textContent = `
            .load-all-pages-btn:hover {
                background-color: #e63e00 !important;
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }

            .load-all-pages-btn:disabled {
                background-color: #ccc !important;
                cursor: not-allowed !important;
                transform: none !important;
                box-shadow: none !important;
            }

            .csv-export-btn:hover {
                background-color: #218838 !important;
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }

            .csv-export-btn:disabled {
                background-color: #ccc !important;
                cursor: not-allowed !important;
                transform: none !important;
                box-shadow: none !important;
            }

            .loaded-data-info {
                animation: slideIn 0.3s ease-out;
                transition: opacity 0.3s ease, transform 0.3s ease;
            }

            .load-progress {
                animation: fadeIn 0.3s ease-out;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }

            .cancel-btn:hover {
                background-color: #c82333 !important;
            }

            .close-btn:hover {
                color: #333 !important;
                background-color: rgba(0,0,0,0.1);
                border-radius: 50%;
            }
        `
        document.head.appendChild(style)
    }

    public async loadAllPages(): Promise<LeaderboardRecord[]> {
        if (this.isLoadingAllPages) {
            return this.allPagesData
        }

        this.isLoadingAllPages = true
        this.loadingAborted = false

        // Check if pagination exists - if not, no need to load additional pages
        const totalPages = DOMUtils.getTotalPages()

        if (totalPages <= 1) {
            // Only current page exists
            const tbody = this.table.querySelector('tbody')
            if (tbody) {
                const rows = tbody.querySelectorAll('tr')
                this.allPagesData = []
                rows.forEach((row, index) => {
                    const data = DOMUtils.parseTableRow(
                        row as HTMLTableRowElement,
                        index
                    )
                    if (data) {
                        this.allPagesData.push(data)
                    }
                })
            }
            this.showLoadedDataInfo()
            return this.allPagesData
        }

        this.isLoadingAllPages = true
        this.loadingAborted = false

        if (this.loadAllPagesButton) {
            this.loadAllPagesButton.textContent = '読み込み中...'
            this.loadAllPagesButton.disabled = true
        }

        try {
            const progressDiv = this.createProgressIndicator()

            // Parse current page data
            const tbody = this.table.querySelector('tbody')
            if (tbody) {
                const rows = tbody.querySelectorAll('tr')
                this.allPagesData = []
                rows.forEach((row, index) => {
                    const data = DOMUtils.parseTableRow(
                        row as HTMLTableRowElement,
                        index
                    )
                    if (data) {
                        this.allPagesData.push(data)
                    }
                })
            }

            // Load additional pages
            for (let page = 2; page <= totalPages; page++) {
                // Check if cancelled
                if (this.loadingAborted) {
                    progressDiv.remove()
                    return this.allPagesData
                }

                this.updateProgress(progressDiv, page - 1, totalPages - 1)

                const pageData = await this.loadPageData(page)

                if (pageData.length > 0) {
                    this.allPagesData.push(...pageData)
                }

                // Avoid server overload
                await new Promise((resolve) => setTimeout(resolve, 500))
            }

            // Add all loaded data to the table
            this.appendAllDataToTable()

            this.hideOriginalPagination()
            progressDiv.remove()
            this.showLoadedDataInfo()

            return this.allPagesData
        } catch (error) {
            console.error('Error during page loading:', error)
            alert('全ページの読み込み中にエラーが発生しました。')
            return []
        } finally {
            this.isLoadingAllPages = false
            this.loadingAborted = false
            if (this.loadAllPagesButton) {
                this.loadAllPagesButton.textContent = '全ページ読み込み'
                this.loadAllPagesButton.disabled = false
            }
        }
    }

    private createProgressIndicator(): HTMLElement {
        const progressDiv = document.createElement('div')
        progressDiv.className = 'load-progress'
        progressDiv.style.position = 'fixed'
        progressDiv.style.top = '50%'
        progressDiv.style.left = '50%'
        progressDiv.style.transform = 'translate(-50%, -50%)'
        progressDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'
        progressDiv.style.color = 'white'
        progressDiv.style.padding = '20px'
        progressDiv.style.borderRadius = '8px'
        progressDiv.style.zIndex = '10000'
        progressDiv.style.textAlign = 'center'
        progressDiv.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)'
        progressDiv.innerHTML = `
            <div style="font-size: 16px; margin-bottom: 15px;">全ページを読み込み中...</div>
            <div class="progress-bar" style="margin: 10px 0; width: 300px; height: 20px; background: #333; border-radius: 10px;">
                <div class="progress-fill" style="width: 0%; height: 100%; background: #fc4c02; border-radius: 10px; transition: width 0.3s;"></div>
            </div>
            <div class="progress-text" style="margin-bottom: 15px;">0 / 0</div>
            <button class="cancel-btn" style="
                background: #dc3545;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            ">キャンセル</button>
        `

        // Add cancel functionality
        const cancelBtn = progressDiv.querySelector(
            '.cancel-btn'
        ) as HTMLButtonElement
        cancelBtn.addEventListener('click', () => {
            this.loadingAborted = true
            this.isLoadingAllPages = false
            progressDiv.remove()

            if (this.loadAllPagesButton) {
                this.loadAllPagesButton.textContent = '全ページ読み込み'
                this.loadAllPagesButton.disabled = false
            }
        })

        document.body.appendChild(progressDiv)
        return progressDiv
    }

    private updateProgress(
        progressDiv: HTMLElement,
        current: number,
        total: number
    ): void {
        const progressFill = progressDiv.querySelector(
            '.progress-fill'
        ) as HTMLElement
        const progressText = progressDiv.querySelector(
            '.progress-text'
        ) as HTMLElement

        if (progressFill && progressText) {
            const percentage = total > 0 ? (current / total) * 100 : 0
            progressFill.style.width = `${percentage}%`
            progressText.textContent = `${current} / ${total}`
        }
    }

    private async loadPageData(page: number): Promise<LeaderboardRecord[]> {
        return new Promise((resolve) => {
            // Try GET request first (more standard for pagination)
            this.loadPageDataGET(page).then((getResult) => {
                if (getResult.length > 0) {
                    resolve(getResult)
                    return
                }

                // Fallback to POST if GET doesn't work
                const requestConfig = DOMUtils.buildFilteredPageRequest(page)

                fetch(requestConfig.url, {
                    method: requestConfig.method,
                    body: requestConfig.body,
                    headers: requestConfig.headers,
                    credentials: 'same-origin',
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`)
                        }
                        return response.text()
                    })
                    .then((html) => {
                        const parser = new DOMParser()
                        const doc = parser.parseFromString(html, 'text/html')
                        const pageData = this.parsePageData(doc)
                        resolve(pageData)
                    })
                    .catch((error) => {
                        console.warn(
                            `POST request failed for page ${page}:`,
                            error
                        )
                        resolve([])
                    })
            })
        })
    }

    private async loadPageDataGET(page: number): Promise<LeaderboardRecord[]> {
        return new Promise((resolve) => {
            // Build GET URL with current filter parameters
            // Make sure we're using the leaderboard endpoint
            const currentUrl = new URL(window.location.href)

            // Ensure we're using the leaderboard path
            if (!currentUrl.pathname.includes('/leaderboard')) {
                // If current URL doesn't include leaderboard, construct it
                const pathParts = currentUrl.pathname.split('/')
                if (pathParts.length >= 3 && pathParts[1] === 'segments') {
                    currentUrl.pathname = `/segments/${pathParts[2]}/leaderboard`
                }
            }

            // Get current filter info to extract URL parameters
            const filterInfo = DOMUtils.getFilterRequestData()

            // Clear existing search params and set page
            currentUrl.search = ''
            currentUrl.searchParams.set('page', page.toString())

            // Always add partial=true for pagination requests (matches manual pagination behavior)
            currentUrl.searchParams.set('partial', 'true')

            // Add all parameters from filter info (these now include pagination parameters)
            Object.keys(filterInfo.formData || {}).forEach((key) => {
                const value = filterInfo.formData[key]
                if (value && key !== 'page') {
                    // Only add allowed parameters to avoid conflicts like athlete[dateofbirth(3i)]
                    const allowedParams = [
                        'club_id',
                        'filter',
                        'per_page',
                        'partial',
                        'date_range',
                        'age_group',
                        'weight_class',
                    ]

                    if (allowedParams.includes(key)) {
                        currentUrl.searchParams.set(key, value)
                    }
                }
            })

            // Copy existing search parameters from current URL that might be important
            // (fallback in case filter extraction missed something)
            const originalUrl = new URL(window.location.href)
            const importantParams = [
                'club_id',
                'per_page',
                'filter',
                'partial',
                'date_range',
                'age_group',
                'weight_class',
            ]
            importantParams.forEach((param) => {
                const value = originalUrl.searchParams.get(param)
                if (value && !currentUrl.searchParams.has(param)) {
                    currentUrl.searchParams.set(param, value)
                }
            })

            fetch(currentUrl.toString(), {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Cache-Control': 'no-cache',
                },
                credentials: 'same-origin',
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`)
                    }
                    return response.text()
                })
                .then((html) => {
                    const parser = new DOMParser()
                    const doc = parser.parseFromString(html, 'text/html')
                    const pageData = this.parsePageData(doc)
                    resolve(pageData)
                })
                .catch((error) => {
                    console.warn(`GET request failed for page ${page}:`, error)
                    resolve([])
                })
        })
    }

    private parsePageData(doc: Document): LeaderboardRecord[] {
        const data: LeaderboardRecord[] = []

        const tbody = doc.querySelector('.table-leaderboard tbody')

        if (!tbody) {
            // No tbody found - return empty data
            return data
        }

        const rows = tbody.querySelectorAll('tr')

        rows.forEach((row, index) => {
            const parsedData = DOMUtils.parseTableRow(
                row as HTMLTableRowElement,
                index
            )

            if (parsedData) {
                // Create new element for display
                const newRow = row.cloneNode(true) as HTMLElement
                data.push({
                    ...parsedData,
                    element: newRow,
                })
            }
        })

        return data
    }

    private appendAllDataToTable(): void {
        const tbody = this.table.querySelector('tbody')
        if (!tbody) {
            return
        }

        // Clear the table first
        tbody.innerHTML = ''

        this.allPagesData.forEach((entry) => {
            if (entry.element) {
                const clonedElement = entry.element.cloneNode(
                    true
                ) as HTMLElement
                tbody.appendChild(clonedElement)
            }
        })
    }

    private showLoadedDataInfo(): void {
        // Remove any existing info div
        const existingInfo = document.querySelector('.loaded-data-info')
        if (existingInfo) {
            existingInfo.remove()
        }

        const infoDiv = document.createElement('div')
        infoDiv.className = 'loaded-data-info'
        infoDiv.style.position = 'fixed'
        infoDiv.style.top = '20px'
        infoDiv.style.right = '20px'
        infoDiv.style.backgroundColor = '#28a745'
        infoDiv.style.color = 'white'
        infoDiv.style.padding = '15px 20px'
        infoDiv.style.borderRadius = '8px'
        infoDiv.style.zIndex = '10001'
        infoDiv.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'
        infoDiv.style.animation = 'slideInRight 0.3s ease-out'
        infoDiv.style.maxWidth = '350px'

        infoDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">✅</span>
                <div>
                    <div style="font-weight: bold; margin-bottom: 5px;">全ページ読み込み完了</div>
                    <div style="font-size: 14px;">${this.allPagesData.length}件のエントリーを読み込みました</div>
                    <div style="font-size: 12px; opacity: 0.9;">※ ソート機能で全データを並び替えできます</div>
                </div>
            </div>
        `

        document.body.appendChild(infoDiv)

        // 5秒後に自動で消去
        setTimeout(() => {
            infoDiv.style.animation = 'slideOutRight 0.3s ease-in'
            setTimeout(() => {
                if (infoDiv.parentNode) {
                    infoDiv.remove()
                }
            }, 300)
        }, 5000)
    }

    private hideOriginalPagination(): void {
        const pagination = document.querySelector('.pagination')
        if (pagination) {
            ;(pagination as HTMLElement).style.display = 'none'
        }
    }

    public getAllPagesData(): LeaderboardRecord[] {
        return this.allPagesData
    }

    public hasAllPagesData(): boolean {
        return this.allPagesData.length > 0
    }
}
