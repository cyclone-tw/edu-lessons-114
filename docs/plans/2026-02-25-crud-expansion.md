# CRUD 功能擴展 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 為教育課文平台新增「連結項目」CRUD 和「說明文字區塊」富文本編輯功能

**Architecture:** 在現有單檔 SPA (`index.html`) 中擴展。連結項目存在 `catalog.json` 的 group.links 陣列，與 files 混合排列顯示。說明文字存在 group.description 欄位，用 contenteditable 富文本編輯器編輯，白名單過濾 HTML 標籤防 XSS。

**Tech Stack:** Vanilla JS, GitHub API, contenteditable, catalog.json

---

### Task 1: CSS — 新增連結項目與說明文字區塊樣式

**Files:**
- Modify: `index.html:360-400` (在 `.upload-area` 樣式之後)

**Step 1: 新增連結項目樣式**

在 `index.html` 的 `<style>` 區塊中，`.upload-area` 相關樣式後面（約第 407 行 `}` 之後），加入以下 CSS：

```css
    /* ========================================
       Link Items
       ======================================== */
    .file-item.link-item .file-icon {
      font-size: 1rem;
    }

    .file-item.link-item .link-description {
      font-size: 0.78rem;
      color: var(--text-secondary);
      margin-left: 4px;
      opacity: 0.8;
    }

    .file-item.link-item .file-link {
      color: var(--accent);
    }

    /* ========================================
       Description Block
       ======================================== */
    .group-description {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      margin: 8px 10px 4px 10px;
      font-size: 0.88rem;
      line-height: 1.7;
      color: var(--text-secondary);
    }

    .group-description a {
      color: var(--accent);
      text-decoration: underline;
    }

    .group-description a:hover {
      color: var(--accent-hover);
    }

    .group-description ul,
    .group-description ol {
      margin: 4px 0 4px 20px;
    }

    .group-description p {
      margin: 4px 0;
    }

    .group-description:empty {
      display: none;
    }

    .desc-edit-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.78rem;
      color: var(--text-secondary);
      cursor: pointer;
      background: none;
      border: none;
      padding: 2px 6px;
      margin-left: 10px;
      margin-top: 4px;
      opacity: 0.7;
      transition: opacity var(--transition);
    }

    .desc-edit-btn:hover {
      opacity: 1;
      color: var(--accent);
    }

    /* ========================================
       Rich Text Editor
       ======================================== */
    .rte-toolbar {
      display: flex;
      gap: 4px;
      padding: 6px 8px;
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-bottom: none;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      flex-wrap: wrap;
    }

    .rte-toolbar button {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-primary);
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      min-width: 30px;
      transition: all var(--transition);
    }

    .rte-toolbar button:hover {
      background: var(--accent-glow);
      border-color: var(--accent);
      color: var(--accent);
    }

    .rte-editor {
      min-height: 120px;
      max-height: 300px;
      overflow-y: auto;
      padding: 10px 14px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 0 0 var(--radius-sm) var(--radius-sm);
      color: var(--text-primary);
      font-family: var(--font);
      font-size: 0.92rem;
      line-height: 1.6;
      outline: none;
    }

    .rte-editor:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }

    .rte-editor a {
      color: var(--accent);
      text-decoration: underline;
    }

    /* ========================================
       Link Modal (wider for more fields)
       ======================================== */
    #link-modal .modal-content {
      max-width: 520px;
    }

    .icon-select {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .icon-option {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 2px solid var(--border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 1.2rem;
      transition: all var(--transition);
      background: var(--bg-surface);
    }

    .icon-option:hover {
      border-color: var(--accent);
      background: var(--accent-glow);
    }

    .icon-option.selected {
      border-color: var(--accent);
      background: var(--accent-glow);
      box-shadow: 0 0 8px var(--accent-glow);
    }
```

**Step 2: 提交**

```bash
git add index.html
git commit -m "style: 新增連結項目、說明文字區塊、富文本編輯器樣式"
```

---

### Task 2: HTML — 新增連結項目 Modal 和說明文字編輯 Modal

**Files:**
- Modify: `index.html:1038-1041` (在 confirm-modal 和 toast 之間)

**Step 1: 在 `<!-- ====== Toast Notification ====== -->` 前面，加入兩個新 modal**

在 `index.html` 第 1039 行 `</div>` (confirm-modal 結束) 之後、第 1040 行 toast 之前，插入：

```html
  <!-- ====== Link Modal (add/edit link) ====== -->
  <div id="link-modal" class="modal hidden">
    <div class="modal-backdrop" data-close-modal></div>
    <div class="modal-content">
      <h2 class="modal-title" id="link-modal-title">新增連結</h2>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label" for="link-title-input">顯示名稱</label>
          <input type="text" id="link-title-input" class="form-input" placeholder="例：課文朗讀影片" autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label" for="link-url-input">網址 URL</label>
          <input type="url" id="link-url-input" class="form-input" placeholder="https://..." autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label" for="link-desc-input">簡短描述</label>
          <input type="text" id="link-desc-input" class="form-input" placeholder="選填" autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label">圖示類型</label>
          <div class="icon-select" id="link-icon-select">
            <div class="icon-option selected" data-icon="link" title="一般連結">🔗</div>
            <div class="icon-option" data-icon="video" title="影片">🎬</div>
            <div class="icon-option" data-icon="doc" title="文件">📑</div>
            <div class="icon-option" data-icon="quiz" title="測驗">📝</div>
            <div class="icon-option" data-icon="web" title="網頁">🌐</div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-close-modal>取消</button>
        <button class="btn btn-primary" id="btn-save-link">儲存</button>
      </div>
    </div>
  </div>

  <!-- ====== Description Editor Modal ====== -->
  <div id="desc-modal" class="modal hidden">
    <div class="modal-backdrop" data-close-modal></div>
    <div class="modal-content" style="max-width:560px;">
      <h2 class="modal-title">編輯說明文字</h2>
      <div class="modal-body">
        <div class="rte-toolbar">
          <button type="button" onclick="rteCommand('bold')" title="粗體"><b>B</b></button>
          <button type="button" onclick="rteCommand('italic')" title="斜體"><i>I</i></button>
          <button type="button" onclick="rteCommand('insertUnorderedList')" title="項目清單">• 清單</button>
          <button type="button" onclick="rteCommand('insertOrderedList')" title="編號清單">1. 清單</button>
          <button type="button" onclick="rteInsertLink()" title="插入超連結">🔗 連結</button>
        </div>
        <div class="rte-editor" id="rte-editor" contenteditable="true"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-close-modal>取消</button>
        <button class="btn btn-danger btn-sm" id="btn-clear-desc">清除</button>
        <button class="btn btn-primary" id="btn-save-desc">儲存</button>
      </div>
    </div>
  </div>
```

**Step 2: 提交**

```bash
git add index.html
git commit -m "feat: 新增連結項目 Modal 和說明文字編輯器 Modal HTML"
```

---

### Task 3: JS — HTML 白名單過濾（XSS 防護）

**Files:**
- Modify: `index.html:1909` (在 `escapeAttr` 函式之後)

**Step 1: 在 `escapeAttr()` 函式後面，加入 sanitizeHtml 和圖示映射**

```javascript
    /**
     * sanitizeHtml(html)
     * Whitelist-based HTML sanitizer for description blocks.
     * Only allows: b, i, strong, em, a (with href), ul, ol, li, p, br
     */
    function sanitizeHtml(html) {
      const temp = document.createElement('div');
      temp.innerHTML = html;

      function cleanNode(node) {
        const allowed = ['B', 'I', 'STRONG', 'EM', 'A', 'UL', 'OL', 'LI', 'P', 'BR'];
        const children = Array.from(node.childNodes);

        for (const child of children) {
          if (child.nodeType === Node.TEXT_NODE) continue;
          if (child.nodeType === Node.ELEMENT_NODE) {
            if (!allowed.includes(child.tagName)) {
              // Replace disallowed element with its text content
              const text = document.createTextNode(child.textContent);
              node.replaceChild(text, child);
            } else {
              // Strip all attributes except href on <a>
              const attrs = Array.from(child.attributes);
              for (const attr of attrs) {
                if (child.tagName === 'A' && attr.name === 'href') {
                  // Only allow http/https URLs
                  if (!attr.value.match(/^https?:\/\//)) {
                    child.removeAttribute('href');
                  }
                } else {
                  child.removeAttribute(attr.name);
                }
              }
              // Ensure links open in new tab
              if (child.tagName === 'A') {
                child.setAttribute('target', '_blank');
                child.setAttribute('rel', 'noopener noreferrer');
              }
              cleanNode(child);
            }
          } else {
            node.removeChild(child);
          }
        }
      }

      cleanNode(temp);
      return temp.innerHTML;
    }

    /**
     * LINK_ICONS
     * Map of icon type to emoji for link items
     */
    const LINK_ICONS = {
      link: '🔗',
      video: '🎬',
      doc: '📑',
      quiz: '📝',
      web: '🌐'
    };
```

**Step 2: 提交**

```bash
git add index.html
git commit -m "feat: 新增 HTML 白名單過濾器與連結圖示映射"
```

---

### Task 4: JS — 連結項目 CRUD 函式

**Files:**
- Modify: `index.html` (在 `deleteFileItem` 函式之後，約第 1849 行)

**Step 1: 新增連結 CRUD 狀態和函式**

在 `deleteFileItem` 函式結束後，加入以下程式碼：

```javascript
    // --- Link CRUD ---
    let linkModalCallback = null;

    /**
     * showLinkModal(title, linkData, callback)
     * Show modal for add/edit link item
     * linkData: { title, url, description, icon } or null for new
     */
    function showLinkModal(title, linkData, callback) {
      document.getElementById('link-modal-title').textContent = title;
      document.getElementById('link-title-input').value = linkData ? linkData.title : '';
      document.getElementById('link-url-input').value = linkData ? linkData.url : '';
      document.getElementById('link-desc-input').value = linkData ? linkData.description : '';

      // Reset icon selection
      const iconSelect = document.getElementById('link-icon-select');
      iconSelect.querySelectorAll('.icon-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.icon === (linkData ? linkData.icon : 'link'));
      });

      linkModalCallback = callback;
      showModal('link-modal');
      setTimeout(() => document.getElementById('link-title-input').focus(), 50);
    }

    /**
     * getSelectedIcon()
     * Get currently selected icon type from the icon select UI
     */
    function getSelectedIcon() {
      const selected = document.querySelector('#link-icon-select .icon-option.selected');
      return selected ? selected.dataset.icon : 'link';
    }

    /**
     * addLink(catIndex, groupIndex)
     * Show modal to add a new link item to a group
     */
    function addLink(catIndex, groupIndex) {
      showLinkModal('新增連結', null, async (linkData) => {
        const category = catalogData.categories[catIndex];
        const group = category.groups[groupIndex];

        if (!group.links) group.links = [];

        // Calculate order: after all existing files and links
        const maxFileOrder = (group.files || []).length;
        const maxLinkOrder = group.links.reduce((max, l) => Math.max(max, l.order || 0), 0);
        const newOrder = Math.max(maxFileOrder, maxLinkOrder) + 1;

        const newLink = {
          title: linkData.title,
          url: linkData.url,
          description: linkData.description || '',
          icon: linkData.icon || 'link',
          order: newOrder
        };

        group.links.push(newLink);

        const saveBtn = document.getElementById('btn-save-link');
        setButtonLoading(saveBtn, true);

        try {
          await saveCatalog();
          hideModal('link-modal');
          renderCatalog(catalogData);
          showToast(`已新增連結「${linkData.title}」`, 'success');
        } catch (err) {
          group.links.pop();
          showToast('新增連結失敗：' + err.message, 'error');
        } finally {
          setButtonLoading(saveBtn, false);
        }
      });
    }

    /**
     * editLink(catIndex, groupIndex, linkIndex)
     * Show modal to edit an existing link item
     */
    function editLink(catIndex, groupIndex, linkIndex) {
      const group = catalogData.categories[catIndex].groups[groupIndex];
      const link = group.links[linkIndex];
      if (!link) return;

      showLinkModal('編輯連結', link, async (linkData) => {
        const saveBtn = document.getElementById('btn-save-link');
        setButtonLoading(saveBtn, true);

        try {
          link.title = linkData.title;
          link.url = linkData.url;
          link.description = linkData.description || '';
          link.icon = linkData.icon || 'link';

          await saveCatalog();
          hideModal('link-modal');
          renderCatalog(catalogData);
          showToast(`已更新連結「${linkData.title}」`, 'success');
        } catch (err) {
          showToast('更新連結失敗：' + err.message, 'error');
        } finally {
          setButtonLoading(saveBtn, false);
        }
      });
    }

    /**
     * deleteLinkItem(catIndex, groupIndex, linkIndex)
     * Confirm and delete a link from catalog
     */
    function deleteLinkItem(catIndex, groupIndex, linkIndex) {
      const group = catalogData.categories[catIndex].groups[groupIndex];
      const link = group.links[linkIndex];
      if (!link) return;

      showConfirmModal(
        '刪除連結',
        `確定要刪除連結「${link.title}」嗎？`,
        async () => {
          try {
            hideAllModals();
            group.links.splice(linkIndex, 1);
            await saveCatalog();
            renderCatalog(catalogData);
            showToast(`已刪除連結「${link.title}」`, 'success');
          } catch (err) {
            showToast('刪除連結失敗：' + err.message, 'error');
          }
        }
      );
    }
```

**Step 2: 提交**

```bash
git add index.html
git commit -m "feat: 連結項目 CRUD 函式（新增、編輯、刪除）"
```

---

### Task 5: JS — 說明文字區塊 CRUD 函式

**Files:**
- Modify: `index.html` (在 Task 4 新增的程式碼之後)

**Step 1: 新增富文本編輯器和說明文字 CRUD 函式**

```javascript
    // --- Rich Text Editor & Description CRUD ---

    let descModalCallback = null;

    /**
     * rteCommand(command, value)
     * Execute a rich text editing command on the RTE editor
     */
    function rteCommand(command, value = null) {
      document.execCommand(command, false, value);
      document.getElementById('rte-editor').focus();
    }

    /**
     * rteInsertLink()
     * Prompt for URL and insert a hyperlink at the current selection
     */
    function rteInsertLink() {
      const url = prompt('請輸入網址：', 'https://');
      if (url && url !== 'https://') {
        document.execCommand('createLink', false, url);
        // Add target="_blank" to the newly created link
        const editor = document.getElementById('rte-editor');
        const links = editor.querySelectorAll('a:not([target])');
        links.forEach(a => {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
        });
        editor.focus();
      }
    }

    /**
     * editDescription(catIndex, groupIndex)
     * Open the rich text editor modal to edit group description
     */
    function editDescription(catIndex, groupIndex) {
      const group = catalogData.categories[catIndex].groups[groupIndex];
      const editor = document.getElementById('rte-editor');

      // Load existing description into editor
      editor.innerHTML = group.description || '';

      descModalCallback = async (html) => {
        const saveBtn = document.getElementById('btn-save-desc');
        setButtonLoading(saveBtn, true);

        try {
          group.description = html;
          await saveCatalog();
          hideModal('desc-modal');
          renderCatalog(catalogData);
          showToast('說明文字已更新', 'success');
        } catch (err) {
          showToast('更新說明失敗：' + err.message, 'error');
        } finally {
          setButtonLoading(saveBtn, false);
        }
      };

      showModal('desc-modal');
      setTimeout(() => editor.focus(), 50);
    }
```

**Step 2: 提交**

```bash
git add index.html
git commit -m "feat: 說明文字富文本編輯器 CRUD 函式"
```

---

### Task 6: JS — 更新 renderCatalog 支援連結項目與說明文字

**Files:**
- Modify: `index.html` 中的 `renderCatalog()` 函式（約第 1972-2096 行）

**Step 1: 修改 renderCatalog 函式**

需要修改的部分：

1. **在 group 的 `fileCount` 計算中加入 links 數量**（用於 count-badge）
2. **在 group-header 後加入說明文字區塊**
3. **將 files 和 links 混合排列**
4. **新增管理模式按鈕（新增連結、編輯說明）**

具體修改如下：

**6a.** 修改 `totalFiles` 計算（約第 1992 行），改為同時計算 files 和 links：

將：
```javascript
        const totalFiles = (category.groups || []).reduce((sum, group) => {
          return sum + (group.files ? group.files.length : 0);
        }, 0);
```

改為：
```javascript
        const totalFiles = (category.groups || []).reduce((sum, group) => {
          return sum + (group.files ? group.files.length : 0) + (group.links ? group.links.length : 0);
        }, 0);
```

**6b.** 修改 `fileCount`（約第 2015 行），改為同時計算：

將：
```javascript
          const fileCount = group.files ? group.files.length : 0;
```

改為：
```javascript
          const fileCount = (group.files ? group.files.length : 0) + (group.links ? group.links.length : 0);
```

**6c.** 在 group admin actions 區塊（約第 2018 行），加入「新增連結」和「編輯說明」按鈕。

將：
```javascript
          const groupAdminActions = isAdminMode ? `
            <div class="admin-actions admin-only">
              <button class="btn-icon btn-sm" onclick="event.stopPropagation(); renameGroup(${catIndex}, ${groupIndex})" title="重新命名">✏️</button>
              <div class="sort-buttons">
                <button class="btn-sort" onclick="event.stopPropagation(); moveGroupUp(${catIndex}, ${groupIndex})" title="上移">▲</button>
                <button class="btn-sort" onclick="event.stopPropagation(); moveGroupDown(${catIndex}, ${groupIndex})" title="下移">▼</button>
              </div>
              <button class="btn-icon btn-sm" onclick="event.stopPropagation(); deleteGroup(${catIndex}, ${groupIndex})" title="刪除" style="color:var(--danger)">🗑️</button>
            </div>` : '';
```

改為：
```javascript
          const groupAdminActions = isAdminMode ? `
            <div class="admin-actions admin-only">
              <button class="btn-icon btn-sm" onclick="event.stopPropagation(); renameGroup(${catIndex}, ${groupIndex})" title="重新命名">✏️</button>
              <button class="btn-icon btn-sm" onclick="event.stopPropagation(); addLink(${catIndex}, ${groupIndex})" title="新增連結">🔗</button>
              <button class="btn-icon btn-sm" onclick="event.stopPropagation(); editDescription(${catIndex}, ${groupIndex})" title="編輯說明">📝</button>
              <div class="sort-buttons">
                <button class="btn-sort" onclick="event.stopPropagation(); moveGroupUp(${catIndex}, ${groupIndex})" title="上移">▲</button>
                <button class="btn-sort" onclick="event.stopPropagation(); moveGroupDown(${catIndex}, ${groupIndex})" title="下移">▼</button>
              </div>
              <button class="btn-icon btn-sm" onclick="event.stopPropagation(); deleteGroup(${catIndex}, ${groupIndex})" title="刪除" style="color:var(--danger)">🗑️</button>
            </div>` : '';
```

**6d.** 將整個「Build file list HTML」區塊（約第 2029-2049 行）替換為 files + links 混合列表：

將原本從 `let filesHtml = '';` 到 `filesHtml = ...尚無檔案...` 的整段（約第 2029-2049 行），替換為：

```javascript
          // Build description block
          const descHtml = group.description
            ? `<div class="group-description">${sanitizeHtml(group.description)}</div>`
            : (isAdminMode ? `<button class="desc-edit-btn admin-only" onclick="editDescription(${catIndex}, ${groupIndex})">📝 新增說明文字</button>` : '');

          // Build merged items (files + links), sorted by order
          const mergedItems = [];

          // Add files with order
          (group.files || []).forEach((file, fileIndex) => {
            mergedItems.push({ type: 'file', data: file, index: fileIndex, order: fileIndex + 1 });
          });

          // Add links with order
          (group.links || []).forEach((link, linkIndex) => {
            mergedItems.push({ type: 'link', data: link, index: linkIndex, order: link.order || (group.files || []).length + linkIndex + 1 });
          });

          // Sort by order
          mergedItems.sort((a, b) => a.order - b.order);

          let itemsHtml = '';
          if (mergedItems.length > 0) {
            const itemElements = mergedItems.map(item => {
              if (item.type === 'file') {
                const file = item.data;
                const fileIndex = item.index;
                const displayName = escapeHtml(file.replace(/\.html$/, ''));
                const filePath = `lessons/${encodeURIComponent(category.folder)}/${encodeURIComponent(group.folder)}/${encodeURIComponent(file)}`;
                const filePathAttr = escapeAttr(filePath);
                const fileAdminAction = isAdminMode ? `
                  <button class="btn-icon btn-sm admin-only" onclick="deleteFileItem(${catIndex}, ${groupIndex}, ${fileIndex})" title="刪除檔案" style="color:var(--danger)">🗑️</button>` : '';
                return `<div class="file-item">
                  <span class="file-icon">📄</span>
                  <a href="${escapeHtml(filePath)}" target="_blank" rel="noopener noreferrer" class="file-link">${displayName}</a>
                  <div class="file-actions">
                    <button class="btn-copy" onclick="copyLink(this, '${filePathAttr}')" title="複製連結">📋</button>
                    ${fileAdminAction}
                  </div>
                </div>`;
              } else {
                // Link item
                const link = item.data;
                const linkIndex = item.index;
                const icon = LINK_ICONS[link.icon] || '🔗';
                const descSpan = link.description ? `<span class="link-description">— ${escapeHtml(link.description)}</span>` : '';
                const linkAdminActions = isAdminMode ? `
                  <button class="btn-icon btn-sm admin-only" onclick="editLink(${catIndex}, ${groupIndex}, ${linkIndex})" title="編輯連結">✏️</button>
                  <button class="btn-icon btn-sm admin-only" onclick="deleteLinkItem(${catIndex}, ${groupIndex}, ${linkIndex})" title="刪除連結" style="color:var(--danger)">🗑️</button>` : '';
                return `<div class="file-item link-item">
                  <span class="file-icon">${icon}</span>
                  <a href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer" class="file-link">${escapeHtml(link.title)}</a>
                  ${descSpan}
                  <div class="file-actions">
                    ${linkAdminActions}
                  </div>
                </div>`;
              }
            }).join('');
            itemsHtml = `<div class="file-list">${itemElements}</div>`;
          } else {
            itemsHtml = `<div class="file-list"><div class="file-item text-secondary" style="font-size:0.85rem;">尚無檔案</div></div>`;
          }
```

**6e.** 替換 group 的 children 區塊中的 `filesHtml` 為 `descHtml` + `itemsHtml`：

將：
```javascript
            <div class="children">
              ${filesHtml}
              ${uploadArea}
            </div>
```

改為：
```javascript
            <div class="children">
              ${descHtml}
              ${itemsHtml}
              ${uploadArea}
            </div>
```

**Step 2: 提交**

```bash
git add index.html
git commit -m "feat: renderCatalog 支援連結項目與說明文字混合顯示"
```

---

### Task 7: JS — 事件監聽器綁定

**Files:**
- Modify: `index.html` 中的 DOMContentLoaded 事件監聽器（約第 2179 行）

**Step 1: 在 DOMContentLoaded 中加入新 modal 的事件監聽**

在 confirm-modal 的事件監聽之後（約第 2235 行），加入以下程式碼：

```javascript
      // Link modal: icon selection
      document.getElementById('link-icon-select').addEventListener('click', (e) => {
        const option = e.target.closest('.icon-option');
        if (!option) return;
        document.querySelectorAll('#link-icon-select .icon-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
      });

      // Link modal: save button
      document.getElementById('btn-save-link').addEventListener('click', () => {
        const title = document.getElementById('link-title-input').value.trim();
        const url = document.getElementById('link-url-input').value.trim();
        const description = document.getElementById('link-desc-input').value.trim();
        const icon = getSelectedIcon();

        if (!title) {
          showToast('請輸入顯示名稱', 'error');
          return;
        }
        if (!url) {
          showToast('請輸入網址', 'error');
          return;
        }
        if (!url.match(/^https?:\/\//)) {
          showToast('網址必須以 http:// 或 https:// 開頭', 'error');
          return;
        }

        if (linkModalCallback) linkModalCallback({ title, url, description, icon });
      });

      // Link modal: Enter key to save (on URL field)
      document.getElementById('link-url-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          document.getElementById('btn-save-link').click();
        }
      });

      // Description modal: save button
      document.getElementById('btn-save-desc').addEventListener('click', () => {
        const editor = document.getElementById('rte-editor');
        const html = sanitizeHtml(editor.innerHTML);
        if (descModalCallback) descModalCallback(html);
      });

      // Description modal: clear button
      document.getElementById('btn-clear-desc').addEventListener('click', () => {
        if (descModalCallback) descModalCallback('');
      });
```

**Step 2: 更新 `[data-close-modal]` 綁定**

新加的 modal 中有 `data-close-modal` 的按鈕，需要在 DOMContentLoaded 中重新掃描。因為原本的 `querySelectorAll('[data-close-modal]')` 已經在初始化時執行，而新的 modal HTML 在 DOM 一開始就存在，所以**不需要額外修改** — 原本的程式碼會自動掃到新加的 close 按鈕。

**Step 3: 提交**

```bash
git add index.html
git commit -m "feat: 連結和說明文字 Modal 事件監聽器"
```

---

### Task 8: JS — 更新 build.js 保留 links 和 description

**Files:**
- Modify: `build.js:64-69`

**Step 1: 修改 build.js 的 group 物件，保留 links 和 description**

將：
```javascript
      groups.push({
        folder: groupDir.name,
        displayName: existingGroup ? existingGroup.displayName : groupDir.name,
        order: existingGroup ? existingGroup.order : groupOrder++,
        files
      });
```

改為：
```javascript
      const groupObj = {
        folder: groupDir.name,
        displayName: existingGroup ? existingGroup.displayName : groupDir.name,
        order: existingGroup ? existingGroup.order : groupOrder++,
        files
      };
      // Preserve links and description from existing catalog
      if (existingGroup && existingGroup.links && existingGroup.links.length > 0) {
        groupObj.links = existingGroup.links;
      }
      if (existingGroup && existingGroup.description) {
        groupObj.description = existingGroup.description;
      }
      groups.push(groupObj);
```

**Step 2: 更新 summary 輸出，顯示連結數**

將：
```javascript
categories.forEach(c => {
  const totalFiles = c.groups.reduce((sum, g) => sum + g.files.length, 0);
  console.log(`   - ${c.displayName}：${c.groups.length} 個組別，${totalFiles} 個檔案`);
});
```

改為：
```javascript
categories.forEach(c => {
  const totalFiles = c.groups.reduce((sum, g) => sum + g.files.length, 0);
  const totalLinks = c.groups.reduce((sum, g) => sum + (g.links ? g.links.length : 0), 0);
  const linkInfo = totalLinks > 0 ? `，${totalLinks} 個連結` : '';
  console.log(`   - ${c.displayName}：${c.groups.length} 個組別，${totalFiles} 個檔案${linkInfo}`);
});
```

**Step 3: 提交**

```bash
git add build.js
git commit -m "feat: build.js 保留 links 和 description 資料"
```

---

### Task 9: 瀏覽器驗證 & 最終提交

**Step 1: 本地驗證**

在瀏覽器中打開 `index.html`，確認以下功能：

1. **連結項目**
   - 管理模式下，group header 出現 🔗 按鈕
   - 點擊後彈出連結 Modal，可填寫四個欄位
   - 儲存後連結出現在檔案列表中，混合排列
   - 可編輯、刪除連結
   - 公開模式下，連結可正常點擊開啟

2. **說明文字**
   - 管理模式下，group header 出現 📝 按鈕
   - 無說明文字時，顯示「📝 新增說明文字」按鈕
   - 點擊後彈出富文本編輯器
   - 可插入粗體、斜體、超連結、清單
   - 儲存後在檔案列表上方顯示說明區塊
   - 公開模式下，說明文字正常顯示

**Step 2: 驗證 build.js**

```bash
node build.js
```

確認不報錯，且 catalog.json 保留了 links 和 description。

**Step 3: 最終合併提交（如果前面分步提交了，此步可跳過）**

```bash
git add index.html build.js
git commit -m "feat: 新增連結項目 CRUD 與說明文字富文本編輯功能"
```
