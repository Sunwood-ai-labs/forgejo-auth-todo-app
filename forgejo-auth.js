/**
 * Forgejo API認証クラス
 * Forgejo APIを使用してユーザー認証とAPI呼び出しを管理
 * シンプルなOAuth2対応
 */
class ForgejoAuth {
    constructor() {
        this.baseUrl = null;
        this.token = null;
        this.userInfo = null;
        this.isInitialized = false;
        
        // OAuth2設定
        this.oauthClientId = null;
        this.redirectUri = `${window.location.origin}${window.location.pathname}`;
    }

    /**
     * 認証システムを初期化
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // 保存された認証情報を復元
            const savedAuth = this.loadSavedAuth();
            if (savedAuth.token && savedAuth.baseUrl) {
                await this.loginWithToken(savedAuth.token, savedAuth.baseUrl, false);
            }
        } catch (error) {
            console.log('保存された認証情報が無効です:', error.message);
            this.clearSavedAuth();
        } finally {
            this.isInitialized = true;
        }
    }

    /**
     * APIトークンでログイン
     * @param {string} apiToken - Forgejo APIトークン
     * @param {string} baseUrl - Forgejo インスタンスのURL
     * @param {boolean} saveAuth - 認証情報を保存するかどうか
     * @returns {Promise<Object>} ユーザー情報
     */
    async loginWithToken(apiToken, baseUrl, saveAuth = true) {
        // URLを正規化（末尾のスラッシュを削除）
        this.baseUrl = baseUrl.replace(/\/$/, '');
        
        try {
            // APIトークンの有効性を確認
            const response = await fetch(`${this.baseUrl}/api/v1/user`, {
                method: 'GET',
                headers: {
                    'Authorization': `token ${apiToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`認証に失敗しました (${response.status}): ${errorText || 'Unknown error'}`);
            }

            // ユーザー情報を取得
            this.userInfo = await response.json();
            this.token = apiToken;
            
            // 認証情報を保存
            if (saveAuth) {
                this.saveAuth();
            }
            
            console.log('ログイン成功:', this.userInfo.login);
            return this.userInfo;
            
        } catch (error) {
            // ネットワークエラーまたはその他のエラーの処理
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error(`Forgejoサーバーに接続できません。URLを確認してください: ${this.baseUrl}`);
            }
            throw error;
        }
    }

    /**
     * 認証済みAPIリクエストを実行
     * @param {string} endpoint - APIエンドポイント
     * @param {Object} options - fetchオプション
     * @returns {Promise<any>} APIレスポンス
     */
    async apiRequest(endpoint, options = {}) {
        if (!this.isAuthenticated()) {
            throw new Error('認証が必要です');
        }

        const url = `${this.baseUrl}/api/v1${endpoint}`;
        
        // トークンかBasic認証かを判定
        const isBasicAuth = this.token && this.token.includes(':');
        const authHeader = isBasicAuth ? `Basic ${this.token}` : `token ${this.token}`;
        
        const requestOptions = {
            ...options,
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API エラー (${response.status}): ${errorText || 'Unknown error'}`);
            }

            // レスポンスが空の場合（204 No Contentなど）は、nullを返す
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return null;
            
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error(`Forgejoサーバーに接続できません: ${url}`);
            }
            throw error;
        }
    }

    /**
     * ユーザーのリポジトリ一覧を取得
     * @param {number} page - ページ番号
     * @param {number} limit - 1ページあたりの件数
     * @returns {Promise<Array>} リポジトリ一覧
     */
    async getUserRepos(page = 1, limit = 50) {
        return this.apiRequest(`/user/repos?page=${page}&limit=${limit}`);
    }

    /**
     * ユーザーのイシュー一覧を取得
     * @param {string} state - イシューの状態 (open, closed, all)
     * @param {number} page - ページ番号
     * @param {number} limit - 1ページあたりの件数
     * @returns {Promise<Array>} イシュー一覧
     */
    async getUserIssues(state = 'open', page = 1, limit = 50) {
        return this.apiRequest(`/user/issues?state=${state}&page=${page}&limit=${limit}`);
    }

    /**
     * 特定のリポジトリのイシュー一覧を取得
     * @param {string} owner - リポジトリオーナー
     * @param {string} repo - リポジトリ名
     * @param {string} state - イシューの状態
     * @returns {Promise<Array>} イシュー一覧
     */
    async getRepoIssues(owner, repo, state = 'open') {
        return this.apiRequest(`/repos/${owner}/${repo}/issues?state=${state}`);
    }

    /**
     * 新しいイシューを作成
     * @param {string} owner - リポジトリオーナー
     * @param {string} repo - リポジトリ名
     * @param {Object} issueData - イシューデータ
     * @returns {Promise<Object>} 作成されたイシュー
     */
    async createIssue(owner, repo, issueData) {
        return this.apiRequest(`/repos/${owner}/${repo}/issues`, {
            method: 'POST',
            body: JSON.stringify(issueData)
        });
    }

    /**
     * イシューを更新
     * @param {string} owner - リポジトリオーナー
     * @param {string} repo - リポジトリ名
     * @param {number} issueNumber - イシュー番号
     * @param {Object} updateData - 更新データ
     * @returns {Promise<Object>} 更新されたイシュー
     */
    async updateIssue(owner, repo, issueNumber, updateData) {
        return this.apiRequest(`/repos/${owner}/${repo}/issues/${issueNumber}`, {
            method: 'PATCH',
            body: JSON.stringify(updateData)
        });
    }

    /**
     * ユーザーの組織一覧を取得
     * @returns {Promise<Array>} 組織一覧
     */
    async getUserOrgs() {
        return this.apiRequest('/user/orgs');
    }

    /**
     * 認証情報をローカルストレージに保存
     */
    saveAuth() {
        try {
            const authData = {
                token: this.token,
                baseUrl: this.baseUrl,
                userInfo: this.userInfo,
                timestamp: Date.now()
            };
            localStorage.setItem('forgejo_auth', JSON.stringify(authData));
        } catch (error) {
            console.warn('認証情報の保存に失敗しました:', error);
        }
    }

    /**
     * 保存された認証情報を読み込み
     * @returns {Object} 認証情報
     */
    loadSavedAuth() {
        try {
            const authData = localStorage.getItem('forgejo_auth');
            if (authData) {
                const parsed = JSON.parse(authData);
                
                // 7日以上古い認証情報は無効とする
                const maxAge = 7 * 24 * 60 * 60 * 1000; // 7日間（ミリ秒）
                if (Date.now() - parsed.timestamp > maxAge) {
                    this.clearSavedAuth();
                    throw new Error('認証情報が期限切れです');
                }
                
                return parsed;
            }
        } catch (error) {
            console.warn('認証情報の読み込みに失敗しました:', error);
            this.clearSavedAuth();
        }
        return {};
    }

    /**
     * 保存された認証情報をクリア
     */
    clearSavedAuth() {
        try {
            localStorage.removeItem('forgejo_auth');
        } catch (error) {
            console.warn('認証情報のクリアに失敗しました:', error);
        }
    }

    /**
     * ログアウト
     */
    logout() {
        this.token = null;
        this.userInfo = null;
        this.baseUrl = null;
        this.clearSavedAuth();
        console.log('ログアウトしました');
    }

    /**
     * 認証状態を確認
     * @returns {boolean} 認証済みかどうか
     */
    isAuthenticated() {
        return this.token !== null && this.userInfo !== null && this.baseUrl !== null;
    }

    /**
     * ユーザー情報を取得
     * @returns {Object|null} ユーザー情報
     */
    getUserInfo() {
        return this.userInfo;
    }

    /**
     * ベースURLを取得
     * @returns {string|null} ベースURL
     */
    getBaseUrl() {
        return this.baseUrl;
    }

    /**
     * APIトークンを取得（デバッグ用）
     * @returns {string|null} APIトークン
     */
    getToken() {
        return this.token;
    }

    /**
     * 接続テスト
     * @param {string} baseUrl - テストするURL
     * @returns {Promise<boolean>} 接続できるかどうか
     */
    async testConnection(baseUrl) {
        const normalizedUrl = baseUrl.replace(/\/$/, '');
        try {
            const response = await fetch(`${normalizedUrl}/api/v1/version`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Forgejoサーバーのバージョン情報を取得
     * @returns {Promise<Object>} バージョン情報
     */
    async getServerVersion() {
        if (!this.baseUrl) {
            throw new Error('ベースURLが設定されていません');
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/version`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`バージョン情報の取得に失敗しました: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.warn('バージョン情報の取得に失敗しました:', error);
            throw error;
        }
    }
}

// グローバルインスタンスを作成してエクスポート
const forgejoAuth = new ForgejoAuth();
