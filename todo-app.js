/**
 * TODOアプリケーション管理クラス
 * ローカルストレージを使用してTODOデータを管理
 */
class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = {
            status: 'all',
            priority: 'all'
        };
        this.initialized = false;
    }

    /**
     * アプリケーションを初期化
     */
    initialize() {
        if (this.initialized) return;
        
        this.loadTodos();
        this.setupEventListeners();
        this.renderTodos();
        this.updateStats();
        this.initialized = true;
        
        console.log('TODOアプリが初期化されました');
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // TODOフォームの送信
        const todoForm = document.getElementById('todoForm');
        if (todoForm) {
            todoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTodo();
            });
        }

        // フィルター変更
        const filterStatus = document.getElementById('filterStatus');
        const filterPriority = document.getElementById('filterPriority');
        
        if (filterStatus) {
            filterStatus.addEventListener('change', (e) => {
                this.currentFilter.status = e.target.value;
                this.renderTodos();
            });
        }
        
        if (filterPriority) {
            filterPriority.addEventListener('change', (e) => {
                this.currentFilter.priority = e.target.value;
                this.renderTodos();
            });
        }
    }

    /**
     * 新しいTODOを追加
     */
    addTodo() {
        const titleInput = document.getElementById('todoTitle');
        const descriptionInput = document.getElementById('todoDescription');
        const prioritySelect = document.getElementById('todoPriority');

        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const priority = prioritySelect.value;

        if (!title) {
            this.showError('TODOのタイトルを入力してください');
            return;
        }

        const todo = {
            id: this.generateId(),
            title: title,
            description: description,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
            updatedAt: new Date().toISOString()
        };

        this.todos.unshift(todo); // 新しいTODOを先頭に追加
        this.saveTodos();
        this.renderTodos();
        this.updateStats();

        // フォームをリセット
        titleInput.value = '';
        descriptionInput.value = '';
        prioritySelect.value = 'medium';

        // 成功メッセージを表示
        this.showSuccess('TODOを追加しました');
        
        console.log('TODO追加:', todo);
    }

    /**
     * TODOを更新
     * @param {string} id - TODO ID
     * @param {Object} updates - 更新データ
     */
    updateTodo(id, updates) {
        const todoIndex = this.todos.findIndex(todo => todo.id === id);
        if (todoIndex === -1) {
            this.showError('TODOが見つかりません');
            return;
        }

        const todo = this.todos[todoIndex];
        const updatedTodo = {
            ...todo,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // 完了状態が変更された場合、completedAtを更新
        if (updates.hasOwnProperty('completed')) {
            updatedTodo.completedAt = updates.completed ? new Date().toISOString() : null;
        }

        this.todos[todoIndex] = updatedTodo;
        this.saveTodos();
        this.renderTodos();
        this.updateStats();

        console.log('TODO更新:', updatedTodo);
    }

    /**
     * TODOを削除
     * @param {string} id - TODO ID
     */
    deleteTodo(id) {
        const todoIndex = this.todos.findIndex(todo => todo.id === id);
        if (todoIndex === -1) {
            this.showError('TODOが見つかりません');
            return;
        }

        const todo = this.todos[todoIndex];
        
        // 確認ダイアログを表示
        if (confirm(`「${todo.title}」を削除しますか？`)) {
            this.todos.splice(todoIndex, 1);
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showSuccess('TODOを削除しました');
            
            console.log('TODO削除:', todo);
        }
    }

    /**
     * TODOの完了状態を切り替え
     * @param {string} id - TODO ID
     */
    toggleTodoComplete(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (!todo) {
            this.showError('TODOが見つかりません');
            return;
        }

        this.updateTodo(id, { completed: !todo.completed });
        
        if (!todo.completed) {
            this.showSuccess('TODOを完了しました');
        } else {
            this.showSuccess('TODOを未完了に戻しました');
        }
    }

    /**
     * TODO編集モーダルを表示
     * @param {string} id - TODO ID
     */
    showEditModal(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (!todo) {
            this.showError('TODOが見つかりません');
            return;
        }

        const modalBody = `
            <form id="editTodoForm">
                <div class="form-group">
                    <label for="editTitle">タイトル</label>
                    <input type="text" id="editTitle" value="${this.escapeHtml(todo.title)}" required>
                </div>
                <div class="form-group">
                    <label for="editPriority">優先度</label>
                    <select id="editPriority">
                        <option value="low" ${todo.priority === 'low' ? 'selected' : ''}>低</option>
                        <option value="medium" ${todo.priority === 'medium' ? 'selected' : ''}>中</option>
                        <option value="high" ${todo.priority === 'high' ? 'selected' : ''}>高</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editDescription">説明</label>
                    <textarea id="editDescription" rows="4">${this.escapeHtml(todo.description)}</textarea>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button type="button" id="cancelEdit" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        キャンセル
                    </button>
                    <button type="submit" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        更新
                    </button>
                </div>
            </form>
        `;

        this.showModal('TODO編集', modalBody);

        // 編集フォームのイベントリスナー
        const editForm = document.getElementById('editTodoForm');
        const cancelBtn = document.getElementById('cancelEdit');

        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const newTitle = document.getElementById('editTitle').value.trim();
                const newPriority = document.getElementById('editPriority').value;
                const newDescription = document.getElementById('editDescription').value.trim();

                if (!newTitle) {
                    this.showError('タイトルを入力してください');
                    return;
                }

                this.updateTodo(id, {
                    title: newTitle,
                    priority: newPriority,
                    description: newDescription
                });

                this.hideModal();
                this.showSuccess('TODOを更新しました');
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }
    }

    /**
     * フィルタリングされたTODOを取得
     * @returns {Array} フィルタリングされたTODO一覧
     */
    getFilteredTodos() {
        return this.todos.filter(todo => {
            // ステータスフィルター
            if (this.currentFilter.status === 'completed' && !todo.completed) return false;
            if (this.currentFilter.status === 'pending' && todo.completed) return false;

            // 優先度フィルター
            if (this.currentFilter.priority !== 'all' && todo.priority !== this.currentFilter.priority) return false;

            return true;
        });
    }

    /**
     * TODOリストを描画
     */
    renderTodos() {
        const todoList = document.getElementById('todoList');
        const emptyState = document.getElementById('emptyState');
        
        if (!todoList) return;

        const filteredTodos = this.getFilteredTodos();

        if (filteredTodos.length === 0) {
            todoList.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        todoList.innerHTML = filteredTodos.map(todo => this.renderTodoItem(todo)).join('');

        // イベントリスナーを再設定
        filteredTodos.forEach(todo => {
            this.setupTodoItemListeners(todo.id);
        });
    }

    /**
     * 個別のTODOアイテムを描画
     * @param {Object} todo - TODOオブジェクト
     * @returns {string} HTML文字列
     */
    renderTodoItem(todo) {
        const priorityText = { low: '低', medium: '中', high: '高' };
        const createdDate = new Date(todo.createdAt).toLocaleString('ja-JP');
        const completedDate = todo.completedAt ? new Date(todo.completedAt).toLocaleString('ja-JP') : null;

        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-todo-id="${todo.id}">
                <div class="todo-header">
                    <div>
                        <div class="todo-title">${this.escapeHtml(todo.title)}</div>
                        <div class="todo-meta">
                            <span class="priority-badge priority-${todo.priority}">
                                ${priorityText[todo.priority]}
                            </span>
                            <span><i class="fas fa-calendar-plus"></i> ${createdDate}</span>
                            ${completedDate ? `<span><i class="fas fa-check-circle"></i> ${completedDate}</span>` : ''}
                        </div>
                    </div>
                    <div class="todo-actions">
                        <button class="complete-btn" data-action="toggle" data-todo-id="${todo.id}" title="${todo.completed ? '未完了に戻す' : '完了にする'}">
                            <i class="fas fa-${todo.completed ? 'undo' : 'check'}"></i>
                        </button>
                        <button class="edit-btn" data-action="edit" data-todo-id="${todo.id}" title="編集">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" data-action="delete" data-todo-id="${todo.id}" title="削除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${todo.description ? `<div class="todo-description">${this.escapeHtml(todo.description).replace(/\n/g, '<br>')}</div>` : ''}
            </div>
        `;
    }

    /**
     * TODOアイテムのイベントリスナーを設定
     * @param {string} todoId - TODO ID
     */
    setupTodoItemListeners(todoId) {
        const todoItem = document.querySelector(`[data-todo-id="${todoId}"]`);
        if (!todoItem) return;

        // ボタンクリックイベント
        const buttons = todoItem.querySelectorAll('[data-action]');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = button.dataset.action;
                const id = button.dataset.todoId;

                switch (action) {
                    case 'toggle':
                        this.toggleTodoComplete(id);
                        break;
                    case 'edit':
                        this.showEditModal(id);
                        break;
                    case 'delete':
                        this.deleteTodo(id);
                        break;
                }
            });
        });
    }

    /**
     * 統計情報を更新
     */
    updateStats() {
        const totalTodos = this.todos.length;
        const completedTodos = this.todos.filter(todo => todo.completed).length;
        const pendingTodos = totalTodos - completedTodos;
        const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

        // DOM要素を更新
        const totalElement = document.getElementById('totalTodos');
        const pendingElement = document.getElementById('pendingTodos');
        const completedElement = document.getElementById('completedTodos');
        const rateElement = document.getElementById('completionRate');

        if (totalElement) totalElement.textContent = totalTodos;
        if (pendingElement) pendingElement.textContent = pendingTodos;
        if (completedElement) completedElement.textContent = completedTodos;
        if (rateElement) rateElement.textContent = `${completionRate}%`;
    }

    /**
     * TODOデータをローカルストレージに保存
     */
    saveTodos() {
        try {
            const data = {
                todos: this.todos,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('forgejo_todos', JSON.stringify(data));
        } catch (error) {
            console.error('TODOデータの保存に失敗しました:', error);
            this.showError('TODOデータの保存に失敗しました');
        }
    }

    /**
     * ローカルストレージからTODOデータを読み込み
     */
    loadTodos() {
        try {
            const data = localStorage.getItem('forgejo_todos');
            if (data) {
                const parsed = JSON.parse(data);
                this.todos = parsed.todos || [];
                console.log('TODOデータを読み込みました:', this.todos.length, '件');
            }
        } catch (error) {
            console.error('TODOデータの読み込みに失敗しました:', error);
            this.todos = [];
        }
    }

    /**
     * TODOデータをクリア
     */
    clearAllTodos() {
        if (confirm('全てのTODOを削除しますか？この操作は取り消せません。')) {
            this.todos = [];
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showSuccess('全てのTODOを削除しました');
        }
    }

    /**
     * TODOデータをJSONでエクスポート
     */
    exportTodos() {
        const data = {
            todos: this.todos,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `todos_${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
        this.showSuccess('TODOデータをエクスポートしました');
    }

    /**
     * JSONファイルからTODOデータをインポート
     * @param {File} file - インポートするファイル
     */
    async importTodos(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.todos || !Array.isArray(data.todos)) {
                throw new Error('無効なTODOデータ形式です');
            }

            // 既存のTODOとマージするか確認
            let shouldMerge = false;
            if (this.todos.length > 0) {
                shouldMerge = confirm('既存のTODOと統合しますか？「キャンセル」を選択すると既存のTODOは削除されます。');
            }

            if (!shouldMerge) {
                this.todos = [];
            }

            // インポートしたTODOを追加
            data.todos.forEach(todo => {
                // IDの重複を避ける
                const newTodo = {
                    ...todo,
                    id: this.generateId()
                };
                this.todos.push(newTodo);
            });

            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showSuccess(`${data.todos.length}件のTODOをインポートしました`);

        } catch (error) {
            console.error('TODOデータのインポートに失敗しました:', error);
            this.showError('TODOデータのインポートに失敗しました: ' + error.message);
        }
    }

    /**
     * ユニークIDを生成
     * @returns {string} ユニークID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * HTMLエスケープ
     * @param {string} text - エスケープするテキスト
     * @returns {string} エスケープされたテキスト
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * モーダルを表示
     * @param {string} title - モーダルタイトル
     * @param {string} body - モーダル本文
     */
    showModal(title, body) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalClose = document.getElementById('modalClose');

        if (modal && modalTitle && modalBody) {
            modalTitle.textContent = title;
            modalBody.innerHTML = body;
            modal.style.display = 'flex';

            // ESCキーでモーダルを閉じる
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    this.hideModal();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);

            // 背景クリックでモーダルを閉じる
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal();
                }
            });

            // 閉じるボタン
            if (modalClose) {
                modalClose.addEventListener('click', () => {
                    this.hideModal();
                });
            }
        }
    }

    /**
     * モーダルを非表示
     */
    hideModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 成功メッセージを表示
     * @param {string} message - メッセージ
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    /**
     * エラーメッセージを表示
     * @param {string} message - メッセージ
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * トーストメッセージを表示
     * @param {string} message - メッセージ
     * @param {string} type - タイプ (success, error)
     */
    showToast(message, type = 'info') {
        // 既存のトーストを削除
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        `;

        // タイプ別のスタイル
        if (type === 'success') {
            toast.style.background = '#10b981';
        } else if (type === 'error') {
            toast.style.background = '#ef4444';
        } else {
            toast.style.background = '#3b82f6';
        }

        toast.textContent = message;
        document.body.appendChild(toast);

        // 3秒後に自動削除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 3000);
    }

    /**
     * アプリケーションの状態をリセット
     */
    reset() {
        this.todos = [];
        this.currentFilter = { status: 'all', priority: 'all' };
        localStorage.removeItem('forgejo_todos');
        this.renderTodos();
        this.updateStats();
    }
}

// グローバルインスタンスを作成してエクスポート
const todoApp = new TodoApp();
