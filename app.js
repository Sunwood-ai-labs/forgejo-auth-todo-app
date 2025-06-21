/**
 * Forgejo認証TODOアプリケーション
 * メインアプリケーションファイル
 */

// アプリケーション状態
let isInitializing = true;

/**
 * アプリケーションの初期化
 */
async function initializeApp() {
    console.log('アプリケーションを初期化中...');
    
    try {
        // ローディング画面を表示
        showLoading();
        
        // Forgejo認証システムを初期化
        await forgejoAuth.initialize();
        
        // OAuth2コールバック処理をスキップ（シンプル認証のみ）
        
        // 認証状態をチェック
        if (forgejoAuth.isAuthenticated()) {
            console.log('ユーザーは認証済みです');
            await showDashboard();
        } else {
            console.log('ユーザーは未認証です');
            showLoginForm();
        }
        
    } catch (error) {
        console.error('アプリケーションの初期化に失敗しました:', error);
        showError('アプリケーションの初期化に失敗しました: ' + error.message);
        showLoginForm();
    } finally {
        hideLoading();
        isInitializing = false;
    }
}

/**
 * ローディング画面を表示
 */
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'flex';
    }
}

/**
 * ローディング画面を非表示
 */
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

/**
 * ログインフォームを表示
 */
function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const dashboard = document.getElementById('dashboard');
    
    if (loginForm) {
        loginForm.style.display = 'flex';
        loginForm.classList.add('fade-in');
    }
    
    if (dashboard) {
        dashboard.style.display = 'none';
    }
    
    // フォーカスをURLフィールドに設定
    setTimeout(() => {
        const urlInput = document.getElementById('forgejoUrl');
        if (urlInput && !urlInput.value) {
            urlInput.focus();
        }
    }, 100);
}

/**
 * ダッシュボードを表示
 */
async function showDashboard() {
    const loginForm = document.getElementById('loginForm');
    const dashboard = document.getElementById('dashboard');
    
    if (loginForm) {
        loginForm.style.display = 'none';
    }
    
    if (dashboard) {
        dashboard.style.display = 'block';
        dashboard.classList.add('fade-in');
    }
    
    // ユーザー情報を表示
    const userInfo = forgejoAuth.getUserInfo();
    if (userInfo) {
        updateUserDisplay(userInfo);
    }
    
    // TODOアプリを初期化
    if (!todoApp.initialized) {
        todoApp.initialize();
    }
    
    // Forgejoサーバー情報を取得（オプション）
    try {
        const serverVersion = await forgejoAuth.getServerVersion();
        console.log('Forgejoサーバー情報:', serverVersion);
    } catch (error) {
        console.warn('サーバー情報の取得に失敗しました:', error);
    }
}

/**
 * ユーザー表示を更新
 * @param {Object} userInfo - ユーザー情報
 */
function updateUserDisplay(userInfo) {
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userName) {
        userName.textContent = userInfo.full_name || userInfo.login || 'Unknown User';
    }
    
    if (userAvatar && userInfo.avatar_url) {
        userAvatar.src = userInfo.avatar_url;
        userAvatar.alt = userInfo.login || 'User Avatar';
        
        // アバター読み込みエラーハンドリング
        userAvatar.onerror = function() {
            this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.login || 'User')}&background=667eea&color=fff`;
        };
    }
}

/**
 * ログイン処理
 * @param {Event} event - フォーム送信イベント
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const urlInput = document.getElementById('forgejoUrl');
    const tokenInput = document.getElementById('tokenInput');
    const loginBtn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('loginError');
    
    const forgejoUrl = urlInput.value.trim();
    const apiToken = tokenInput.value.trim();
    
    // バリデーション
    if (!forgejoUrl) {
        showError('Forgejo URLを入力してください');
        return;
    }
    
    if (!apiToken) {
        showError('APIトークンを入力してください');
        return;
    }
    
    // URLの形式チェック
    try {
        new URL(forgejoUrl);
    } catch (error) {
        showError('有効なURLを入力してください');
        return;
    }
    
    // エラーメッセージをクリア
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    
    // ログインボタンを無効化
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ログイン中...';
    }
    
    try {
        // 接続テスト
        const canConnect = await forgejoAuth.testConnection(forgejoUrl);
        if (!canConnect) {
            throw new Error('Forgejoサーバーに接続できません。URLを確認してください。');
        }
        
        // ログイン実行
        const userInfo = await forgejoAuth.loginWithToken(apiToken, forgejoUrl);
        
        console.log('ログイン成功:', userInfo.login);
        showSuccess(`ようこそ、${userInfo.full_name || userInfo.login}さん！`);
        
        // ダッシュボードに遷移
        await showDashboard();
        
    } catch (error) {
        console.error('ログインエラー:', error);
        showError(error.message);
        
        // トークン入力フィールドをクリア
        if (tokenInput) {
            tokenInput.value = '';
            tokenInput.focus();
        }
        
    } finally {
        // ログインボタンを復元
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> ログイン';
        }
    }
}

/**
 * ログアウト処理
 */
function handleLogout() {
    if (confirm('ログアウトしますか？')) {
        // Forgejo認証をクリア
        forgejoAuth.logout();
        
        // TODOアプリをリセット（オプション）
        // todoApp.reset();
        
        console.log('ログアウトしました');
        showSuccess('ログアウトしました');
        
        // ログインフォームに戻る
        showLoginForm();
        
        // フォームをクリア
        const urlInput = document.getElementById('forgejoUrl');
        const tokenInput = document.getElementById('tokenInput');
        
        if (urlInput) urlInput.value = '';
        if (tokenInput) tokenInput.value = '';
    }
}

/**
 * エラーメッセージを表示
 * @param {string} message - エラーメッセージ
 */
function showError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    
    // コンソールにもログ出力
    console.error('Error:', message);
    
    // トーストでも表示（todoApp が初期化されている場合）
    if (todoApp && todoApp.initialized) {
        todoApp.showError(message);
    }
}

/**
 * 成功メッセージを表示
 * @param {string} message - 成功メッセージ
 */
function showSuccess(message) {
    console.log('Success:', message);
    
    // トーストで表示（todoApp が初期化されている場合）
    if (todoApp && todoApp.initialized) {
        todoApp.showSuccess(message);
    }
}


/**
 * シンプルログイン処理（ユーザー名・パスワード）
 */
async function handleSimpleLogin() {
    const urlInput = document.getElementById('forgejoUrl');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const simpleLoginBtn = document.getElementById('simpleLoginBtn');
    
    const forgejoUrl = urlInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    // バリデーション
    if (!forgejoUrl) {
        showError('Forgejo URLを入力してください');
        return;
    }
    
    if (!username || !password) {
        showError('ユーザー名とパスワードを入力してください');
        return;
    }
    
    // ボタンを無効化
    if (simpleLoginBtn) {
        simpleLoginBtn.disabled = true;
        simpleLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ログイン中...';
    }
    
    try {
        // Basic認証でユーザー情報を取得
        const response = await fetch(`${forgejoUrl.replace(/\/$/, '')}/api/v1/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${btoa(username + ':' + password)}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('ログインに失敗しました。ユーザー名またはパスワードを確認してください。');
        }

        const userInfo = await response.json();
        
        // 認証情報を保存（Basic認証）
        forgejoAuth.baseUrl = forgejoUrl.replace(/\/$/, '');
        forgejoAuth.token = btoa(username + ':' + password);
        forgejoAuth.userInfo = userInfo;
        forgejoAuth.saveAuth();
        
        console.log('ログイン成功:', userInfo.login);
        showSuccess(`ようこそ、${userInfo.full_name || userInfo.login}さん！`);
        
        // ダッシュボードに遷移
        await showDashboard();
        
    } catch (error) {
        console.error('ログインエラー:', error);
        showError(error.message);
        
        // パスワードフィールドをクリア
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
        
    } finally {
        // ボタンを復元
        if (simpleLoginBtn) {
            simpleLoginBtn.disabled = false;
            simpleLoginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> ログイン';
        }
    }
}

/**
 * APIトークンログイン処理
 * @param {Event} event - フォーム送信イベント
 */
async function handleTokenLogin(event) {
    event.preventDefault();
    
    const urlInput = document.getElementById('forgejoUrl');
    const tokenInput = document.getElementById('tokenInput');
    const loginBtn = document.getElementById('loginBtn');
    
    const forgejoUrl = urlInput.value.trim();
    const apiToken = tokenInput.value.trim();
    
    // バリデーション
    if (!forgejoUrl) {
        showError('Forgejo URLを入力してください');
        return;
    }
    
    if (!apiToken) {
        showError('APIトークンを入力してください');
        return;
    }
    
    // ログインボタンを無効化
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ログイン中...';
    }
    
    try {
        // ログイン実行
        const userInfo = await forgejoAuth.loginWithToken(apiToken, forgejoUrl);
        
        console.log('ログイン成功:', userInfo.login);
        showSuccess(`ようこそ、${userInfo.full_name || userInfo.login}さん！`);
        
        // ダッシュボードに遷移
        await showDashboard();
        
    } catch (error) {
        console.error('ログインエラー:', error);
        showError(error.message);
        
        // トークン入力フィールドをクリア
        if (tokenInput) {
            tokenInput.value = '';
            tokenInput.focus();
        }
        
    } finally {
        // ログインボタンを復元
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-key"></i> APIトークンでログイン';
        }
    }
}

/**
 * ログアウト処理
 */
function handleLogout() {
    if (confirm('ログアウトしますか？')) {
        // Forgejo認証をクリア
        forgejoAuth.logout();
        
        console.log('ログアウトしました');
        showSuccess('ログアウトしました');
        
        // ログインフォームに戻る
        showLoginForm();
        
        // フォームをクリア
        const urlInput = document.getElementById('forgejoUrl');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const tokenInput = document.getElementById('tokenInput');
        const simpleLoginSection = document.querySelector('.simple-login-section');
        const apiLoginSection = document.querySelector('.api-login-section');
        const showTokenLogin = document.getElementById('showTokenLogin');
        const showSimpleLogin = document.getElementById('showSimpleLogin');
        
        if (urlInput) urlInput.value = 'http://192.168.0.131:3000/';
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (tokenInput) tokenInput.value = '';
        
        // フォーム表示を初期状態に戻す
        if (simpleLoginSection) simpleLoginSection.style.display = 'block';
        if (apiLoginSection) apiLoginSection.style.display = 'none';
        if (showTokenLogin) showTokenLogin.style.display = 'inline-flex';
        if (showSimpleLogin) showSimpleLogin.style.display = 'none';
    }
}

/**
 * キーボードショートカット
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+L または Cmd+L でログアウト（ダッシュボード表示時のみ）
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            const dashboard = document.getElementById('dashboard');
            if (dashboard && dashboard.style.display !== 'none') {
                e.preventDefault();
                handleLogout();
            }
        }
        
        // Escape でモーダルを閉じる
        if (e.key === 'Escape') {
            const modal = document.getElementById('modal');
            if (modal && modal.style.display !== 'none') {
                todoApp.hideModal();
            }
        }
    });
}

/**
 * URL入力フィールドのプリセット
 */
function setupUrlPresets() {
    const urlInput = document.getElementById('forgejoUrl');
    if (!urlInput) return;
    
    // よく使われるForgejoサーバーのプリセット
    const presets = [
        'https://codeberg.org',
        'https://git.disroot.org',
        'https://forge.chapril.org'
    ];
    
    // データリストを作成
    const datalist = document.createElement('datalist');
    datalist.id = 'forgejoPresets';
    
    presets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset;
        datalist.appendChild(option);
    });
    
    document.body.appendChild(datalist);
    urlInput.setAttribute('list', 'forgejoPresets');
}

/**
 * 開発者向けデバッグ機能
 */
function setupDebugFeatures() {
    // 開発環境でのみ有効
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // グローバルにデバッグオブジェクトを露出
        window.debug = {
            forgejoAuth,
            todoApp,
            showDashboard,
            showLoginForm,
            initializeApp
        };
        
        console.log('デバッグモードが有効です。window.debug でアクセスできます。');
    }
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    // 既存のログインフォームは削除されるので、ここは空にする
    
    // ログアウトボタン
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // シンプルログインボタン
    const simpleLoginBtn = document.getElementById('simpleLoginBtn');
    if (simpleLoginBtn) {
        simpleLoginBtn.addEventListener('click', handleSimpleLogin);
    }
    
    // APIトークンログインフォーム
    const tokenLoginForm = document.getElementById('tokenLoginForm');
    if (tokenLoginForm) {
        tokenLoginForm.addEventListener('submit', handleTokenLogin);
    }
    
    // ログイン方法切り替えボタン
    const showTokenLogin = document.getElementById('showTokenLogin');
    const showSimpleLogin = document.getElementById('showSimpleLogin');
    const simpleLoginSection = document.querySelector('.simple-login-section');
    const apiLoginSection = document.querySelector('.api-login-section');
    
    if (showTokenLogin && showSimpleLogin && simpleLoginSection && apiLoginSection) {
        showTokenLogin.addEventListener('click', () => {
            simpleLoginSection.style.display = 'none';
            apiLoginSection.style.display = 'block';
            showTokenLogin.style.display = 'none';
            showSimpleLogin.style.display = 'inline-flex';
            
            // トークン入力にフォーカス
            const tokenInput = document.getElementById('tokenInput');
            if (tokenInput) {
                tokenInput.focus();
            }
        });
        
        showSimpleLogin.addEventListener('click', () => {
            simpleLoginSection.style.display = 'block';
            apiLoginSection.style.display = 'none';
            showTokenLogin.style.display = 'inline-flex';
            showSimpleLogin.style.display = 'none';
            
            // ユーザー名入力にフォーカス
            const usernameInput = document.getElementById('username');
            if (usernameInput) {
                usernameInput.focus();
            }
        });
    }
    
    // モーダルの背景クリック
    const modal = document.getElementById('modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                todoApp.hideModal();
            }
        });
    }
}

/**
 * アプリケーションのエラーハンドリング
 */
function setupErrorHandling() {
    // 未処理のエラーをキャッチ
    window.addEventListener('unhandledrejection', (e) => {
        console.error('未処理のPromise拒否:', e.reason);
        showError('予期しないエラーが発生しました');
        e.preventDefault();
    });
    
    // 一般的なエラーをキャッチ
    window.addEventListener('error', (e) => {
        console.error('JavaScript エラー:', e.error);
        showError('アプリケーションエラーが発生しました');
    });
}

/**
 * パフォーマンス監視
 */
function setupPerformanceMonitoring() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    console.log('ページ読み込み時間:', Math.round(perfData.loadEventEnd - perfData.fetchStart), 'ms');
                }
            }, 0);
        });
    }
}

/**
 * サービスワーカー登録（オフライン対応）
 */
async function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            // サービスワーカーが存在する場合のみ登録
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker 登録成功:', registration);
        } catch (error) {
            console.log('Service Worker 登録失敗:', error);
            // エラーは無視（サービスワーカーファイルが存在しない場合）
        }
    }
}

/**
 * DOMContentLoaded イベントハンドラー
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM読み込み完了');
    
    // 各種セットアップ
    setupEventListeners();
    setupKeyboardShortcuts();
    setupUrlPresets();
    setupErrorHandling();
    setupPerformanceMonitoring();
    setupDebugFeatures();
    
    // サービスワーカー登録（非同期）
    setupServiceWorker().catch(console.warn);
    
    // アプリケーション初期化
    await initializeApp();
});

/**
 * ページ離脱時の処理
 */
window.addEventListener('beforeunload', (e) => {
    // 未保存のTODOがある場合の警告など
    // 現在の実装では特に処理なし
});

/**
 * ページの可視性変更時の処理
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('ページが非表示になりました');
    } else {
        console.log('ページが表示されました');
        // 認証状態の再確認などを行う場合はここで実装
    }
});

// エクスポート（モジュール環境用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeApp,
        showDashboard,
        showLoginForm,
        handleLogin,
        handleLogout
    };
}
