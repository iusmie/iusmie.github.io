/**
 * 小红书笔记生成器
 * 支持 Markdown 编辑、图片粘贴、主题切换、分页、导出 JPG
 * 支持多板块切换（宠物/家装/生活），数据与程序隔离
 */
class XiaohongshuApp {
  constructor() {
    this.markdownInput = null;
    this.previewContainer = null;
    this.currentPageIndex = 0;
    this.pages = [];
    this.coverImageDataUrl = null;
    this.coverTitlePosition = null; // { left: 0-100, top: 0-100 } 百分比
    this.coverVisible = true; // 封面是否在预览中展示
    this.imageDataUrls = {}; // img_0 -> dataUrl，正文中用 img:img_0 短引用
    this._imgRefCounter = 0;
    this.blockConfig = null;
    this.coverTemplates = null;
    this.customBlocks = null;
    this.currentBlockId = 'pet';
    this._scrollObserver = null;
    this.defaultMarkdown = `📍 **坐标**：杭州  
🏠 **户型**：房本 94㎡（实际略小）  
💰 **预算**：20w（纯毛坯硬装）  
⏳ **工期**：整整 8 个月  
👨‍👩‍👧‍👦 **常住**：1 人 + 6 只猫主子 + 1 位已回汪星的修勾🐶 
✍️ **户型图**： 


入住满月，终于能静心复盘这套耗时最长的“爱的工程”。  
最意难平的是：装修前期图纸里，每一处转角都为狗狗🐕预留了奔跑空间，却在硬装结束、软装进场前，她悄悄去了汪星。🕯️  
从150㎡+大平层缩至94㎡小家，如何让6只猫主子与我和谐共生？这份**全流程实录 + 血泪避雷指南**，献给所有多宠家庭与小户型奋斗者。🙏  

@---

## 📋 我的装修全流程  
1. **设计前置**  
   - 拉出全屋物品清单（件数/尺寸/摆放位置），宠物用品（砂盆、粮桶、爬架）精确到厘米标注，直接交付设计师。  
2. **方案交互**  
   - 针对杭州一楼采光弱、多宠动线、巨量收纳需求，与设计师反复打磨图纸10+版。  
3. **施工落地**  
   - 敲墙 → 砌墙 → 水电 → 泥工 → 木工 → 油漆 → 美缝（全程监工+每日拍照存档）。  

@---

## ⚠️ 那些“肠子悔青”的坑（一楼多猫家庭必看！）  
- **❌ 纵向空间利用不足**  
  为“显大”留白，墙面未预埋加固件 → 只能占地面放成品猫爬架，猫咪领地压缩，打架频发！  
  💡 *教训：多猫家庭请死守“墙猫一体”原则！提前规划墙面承重件、隐藏式跳台、吊桥动线。*  

- **❌ 一楼湿气魔法攻击💦**  
  未预留除湿机专用排水孔，也未装全屋新风除湿系统 → 梅雨季每日手动倒水箱，崩溃指数拉满。  
  💡 *教训：一楼装修，排水孔+除湿系统=保命组合！水电阶段务必规划。*  

- **❌ 阳台晾晒动线翻车👔**  
  洗衣区做满吊柜+隐形晾衣架 → 衣服一挂，柜门直接卡死！  
  💡 *教训：先模拟晾衣动作再定柜体深度，留足操作空间。*  

- **❌ 窗帘变“猫抓板”🐈**  
  轨道外露成猫咪引体向上杆，布料选错秒变抽丝现场。  
  💡 *教训：首选百叶窗/蜂巢帘；若用布帘，轨道内嵌+材质锁定科技布/猫抓布。*  

- **❌ 监控盲区焦虑📹**  
  插座预留不足 → 6只猫玩躲猫猫时，手机画面全是死角，心梗预警！  
  💡 *教训：动线关键点（猫爬架顶、角落）预埋插座+USB，为摄像头/夜灯留位。*  

@---

## ✅ 值得反复夸的“神操作”  
- **🚽 卧室专属猫卫（蹲坑YYDS！）**  
  大胆取消洗手台+门，嵌入蹲坑（训练无砂如厕）+自动猫砂盆组合，6猫家庭异味/铲屎压力直降90%！  
- **🔌 次卧“插座森林”**  
  饮水机、烘干箱、循环扇、监控……每个设备专属孔位，告别排插乱舞，安全整洁满分。  
- **📦 海量隐形储物**  
  全屋定制柜塞下全年猫粮猫砂+人类杂物，小户型收纳天花板。  
- **🛡️ 全屋金刚纱窗**  
  多宠家庭安全底线！抗造防越狱，开窗自由从此实现。  

@---

✨ **最后想说**：  
装修是遗憾的艺术，更是爱的具象化。  
狗狗的足迹留在图纸里，猫咪的呼噜填满新家角落。  
愿每个为爱筑巢的人，都能在方寸之间，安放所有柔软与牵挂。  
🐾 *谨以此文，纪念我们的修勾，也致敬所有毛孩子的陪伴。*  `;
  }

  async init() {
    this.markdownInput = document.getElementById('markdownInput');
    this.previewContainer = document.getElementById('previewContainer');

    if (!this.markdownInput.value.trim()) {
      const loaded = this.loadDraft();
      let md = loaded?.markdown ?? (typeof loaded === 'string' ? loaded : null) ?? this.defaultMarkdown;
      if (loaded?.images) {
        this.imageDataUrls = loaded.images;
        const maxIdx = Math.max(-1, ...Object.keys(loaded.images).map(k => parseInt(k.replace('img_', ''), 10) || -1));
        this._imgRefCounter = maxIdx + 1;
      }
      const migrated = this.migrateBase64ToRefs(md);
      this.markdownInput.value = migrated.markdown;
      Object.assign(this.imageDataUrls, migrated.images);
      if (migrated.changed) this.saveDraft();
    }

    await Promise.all([this.loadBlockConfig(), this.loadCoverTemplates(), this.loadCustomBlocks()]);
    this.renderBlockTabs();
    this.renderCoverTemplateOptions();
    this.bindEvents();
    this.applyBlockConfig(this.currentBlockId);
    this.toggleCustomAuthorInput();
    // 初始化滑块数值显示
    ['coverFontSize', 'bodyFontSize', 'titleFontSize'].forEach(id => {
      const el = document.getElementById(id);
      const valEl = document.getElementById(id + 'Val');
      if (el && valEl) valEl.textContent = el.value;
    });
    this.render();
  }

  async loadBlockConfig() {
    try {
      const res = await fetch('../apps/tools/xiaohongshu-note/data/block-config.json');
      this.blockConfig = await res.json();
    } catch (e) {
      console.warn('加载板块配置失败', e);
      this.blockConfig = {
        blocks: [
          { id: 'pet', name: '宠物板块', icon: '🐾', themes: [{ value: 'notion', label: 'Notion 极简' }, { value: 'cream', label: '奶油治愈' }], authors: ['@陆喵_喵喵喵'], defaults: { coverTitle: '宠物心得分享', coverFontSize: 48, bodyFontSize: 15, titleFontSize: 26 } },
          { id: 'decoration', name: '家装板块', icon: '🏠', themes: [{ value: 'notion', label: 'Notion 极简' }, { value: 'light', label: '纯白干货' }], authors: ['@kk4sin90'], defaults: { coverTitle: '家装灵感', coverFontSize: 44, bodyFontSize: 15, titleFontSize: 24 } },
          { id: 'life', name: '生活版块', icon: '🌸', themes: [{ value: 'notion', label: 'Notion 极简' }, { value: 'cream', label: '奶油治愈' }], authors: ['@塔塔菜猫猫头'], defaults: { coverTitle: '生活记录', coverFontSize: 48, bodyFontSize: 15, titleFontSize: 26 } }
        ]
      };
    }
  }

  getCurrentBlock() {
    if (!this.blockConfig?.blocks) return null;
    return this.blockConfig.blocks.find(b => b.id === this.currentBlockId) || this.blockConfig.blocks[0];
  }

  async loadCoverTemplates() {
    try {
      const res = await fetch('../apps/tools/xiaohongshu-note/data/cover-templates.json');
      const data = await res.json();
      this.coverTemplates = data.templates || [];
    } catch (e) {
      console.warn('加载封面模版失败，使用默认', e);
      this.coverTemplates = [
        { id: 'center', name: '居中大标题' },
        { id: 'top-desc', name: '上标题下简介' },
        { id: 'simple', name: '简约风格' },
        { id: 'bottom-author', name: '底部作者' }
      ];
    }
  }

  renderCoverTemplateOptions() {
    const select = document.getElementById('coverTemplate');
    if (!select || !this.coverTemplates?.length) return;
    select.innerHTML = this.coverTemplates.map((t, i) =>
      `<option value="${t.id}" ${i === 0 ? 'selected' : ''}>${t.name}</option>`
    ).join('');
  }

  async loadCustomBlocks() {
    const defaults = [
      { id: 'pitfall-human', name: '人视角坑点', icon: '🧺', bg: 'rgba(220, 235, 255, 0.6)', borderColor: 'rgba(100, 150, 255, 0.25)' },
      { id: 'pitfall-cat', name: '咪视角坑点', icon: '🐱', bg: 'rgba(255, 230, 240, 0.6)', borderColor: 'rgba(255, 150, 180, 0.25)' },
      { id: 'card', name: '通用卡片', icon: '', bg: 'rgba(0, 0, 0, 0.03)', borderColor: 'rgba(0, 0, 0, 0.08)' }
    ];
    try {
      const res = await fetch('../apps/tools/xiaohongshu-note/data/custom-blocks.json');
      const data = await res.json();
      this.customBlocks = (data.blocks && data.blocks.length) ? data.blocks : defaults;
    } catch (e) {
      this.customBlocks = defaults;
    }
  }

  renderBlockTabs() {
    const container = document.getElementById('blockTabs');
    if (!container || !this.blockConfig?.blocks?.length) return;
    container.innerHTML = this.blockConfig.blocks.map((b, i) =>
      `<button class="xhs-tab ${i === 0 ? 'active' : ''}" data-block="${b.id}">
        <span class="xhs-tab-icon">${b.icon || '📌'}</span>
        <span class="xhs-tab-text">${b.name}</span>
      </button>`
    ).join('');
  }

  applyBlockConfig(blockId) {
    this.currentBlockId = blockId || (this.blockConfig?.blocks?.[0]?.id || 'pet');
    const block = this.getCurrentBlock();
    if (!block) return;

    // 渲染风格主题
    const themeContainer = document.getElementById('themeOptions');
    if (themeContainer) {
      themeContainer.innerHTML = block.themes.map((t, i) =>
        `<label class="xhs-radio-label"><input type="radio" name="theme" value="${t.value}" ${i === 0 ? 'checked' : ''} /> ${t.label}</label>`
      ).join('');
    }

    // 渲染作者下拉
    const authorSelect = document.getElementById('coverAuthor');
    if (authorSelect) {
      const opts = block.authors.map((a, i) =>
        `<option value="${a}" ${i === 0 ? 'selected' : ''}>${a}</option>`
      ).join('');
      authorSelect.innerHTML = opts + '<option value="@自定义">自定义</option>';
    }

    // 应用外观默认值
    const d = block.defaults || {};
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val != null) {
        el.value = val;
        const valEl = document.getElementById(id + 'Val');
        if (valEl) valEl.textContent = val;
      }
    };
    setVal('coverTitle', d.coverTitle);
    setVal('coverFontSize', d.coverFontSize);
    setVal('bodyFontSize', d.bodyFontSize);
    setVal('titleFontSize', d.titleFontSize);
  }

  bindEvents() {
    // 板块 Tab 切换
    document.getElementById('blockTabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('.xhs-tab');
      if (!tab) return;
      const blockId = tab.dataset.block;
      if (!blockId || blockId === this.currentBlockId) return;
      document.querySelectorAll('.xhs-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      this.applyBlockConfig(blockId);
      this.render(true);
    });

    // 输入变化
    this.markdownInput.addEventListener('input', () => this.debouncedRender());
    this.markdownInput.addEventListener('paste', (e) => this.handlePaste(e));

    // 粘贴按钮
    document.getElementById('pasteBtn').addEventListener('click', () => this.handlePasteClick());

    // 插入图片
    document.getElementById('insertImageBtn').addEventListener('click', () => {
      document.getElementById('imageFileInput').click();
    });
    document.getElementById('imageFileInput').addEventListener('change', (e) => this.handleImageSelect(e));

    // 封面图
    document.getElementById('coverImageBtn').addEventListener('click', () => {
      document.getElementById('coverImageInput').click();
    });
    document.getElementById('coverImageDeleteBtn').addEventListener('click', () => {
      this.coverImageDataUrl = null;
      this.render();
    });
    document.getElementById('coverImageInput').addEventListener('change', (e) => this.handleCoverImageSelect(e));

    // 设置变化
    document.getElementById('coverTemplate')?.addEventListener('change', () => this.render(true));
    document.getElementById('coverToggleBtn')?.addEventListener('change', (e) => {
      this.coverVisible = e.target.checked;
      this.render(true);
    });
    ['coverTitle', 'coverDesc', 'coverDate'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => this.render());
    });
    document.getElementById('coverAuthor').addEventListener('change', () => {
      this.toggleCustomAuthorInput();
      this.render();
    });
    document.getElementById('coverAuthorCustom').addEventListener('input', () => this.render());
    document.getElementById('themeOptions').addEventListener('change', () => this.render(true));
    document.getElementById('canvasSize').addEventListener('change', () => this.render());

    ['coverFontSize', 'bodyFontSize', 'titleFontSize'].forEach(id => {
      const el = document.getElementById(id);
      const valEl = document.getElementById(id + 'Val');
      el.addEventListener('input', () => {
        valEl.textContent = el.value;
        this.render();
      });
    });

    // 预览区双击：左侧正文锚定到对应内容，预览和右侧不滚动
    this.previewContainer?.addEventListener('dblclick', (e) => {
      const card = e.target.closest('.xhs-card');
      if (!card) return;
      e.preventDefault();
      const pageNum = parseInt(card.dataset.page, 10);
      if (isNaN(pageNum)) return;
      this.scrollEditorToPage(pageNum);
    });

    // 翻页
    document.getElementById('prevPageBtn').addEventListener('click', () => this.prevPage());
    document.getElementById('nextPageBtn').addEventListener('click', () => this.nextPage());

    // 导出
    document.getElementById('exportBtn').addEventListener('click', () => this.exportToJpg());
  }

  toggleCustomAuthorInput() {
    const select = document.getElementById('coverAuthor');
    const customInput = document.getElementById('coverAuthorCustom');
    const wrapper = customInput.closest('.xhs-form-group-custom-author');
    const visible = select.value === '@自定义';
    customInput.style.display = visible ? 'block' : 'none';
    if (wrapper) wrapper.style.display = visible ? 'block' : 'none';
    if (!visible) customInput.value = '';
  }

  getCoverAuthor() {
    const select = document.getElementById('coverAuthor');
    if (select.value === '@自定义') {
      return document.getElementById('coverAuthorCustom').value || '@作者';
    }
    return select.value || '@作者';
  }

  debouncedRender() {
    if (this._renderTimer) clearTimeout(this._renderTimer);
    this._renderTimer = setTimeout(() => {
      this.saveDraft();
      this.render(true);
    }, 150);
  }

  loadDraft() {
    try {
      const raw = localStorage.getItem('xiaohongshu-note-draft');
      if (!raw) return null;
      try {
        const obj = JSON.parse(raw);
        if (obj && typeof obj.markdown === 'string') return obj;
      } catch (_) {}
      return raw;
    } catch (e) {
      return null;
    }
  }

  saveDraft() {
    try {
      const markdown = this.markdownInput?.value ?? '';
      const payload = { markdown, images: this.imageDataUrls };
      localStorage.setItem('xiaohongshu-note-draft', JSON.stringify(payload));
    } catch (e) {}
  }

  handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        this.insertImageFromFile(file);
        return;
      }
    }
  }

  handlePasteClick() {
    navigator.clipboard?.readText().then(text => {
      if (text) {
        const cursor = this.markdownInput.selectionStart;
        const before = this.markdownInput.value.substring(0, cursor);
        const after = this.markdownInput.value.substring(cursor);
        this.markdownInput.value = before + text + after;
        this.markdownInput.selectionStart = this.markdownInput.selectionEnd = cursor + text.length;
        this.saveDraft();
        this.render(true);
      }
    }).catch(() => {});
  }

  handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.insertImageFromFile(file);
    }
    e.target.value = '';
  }

  insertImageFromFile(file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const ref = `img_${this._imgRefCounter++}`;
      this.imageDataUrls[ref] = dataUrl;
      const cursor = this.markdownInput.selectionStart;
      const before = this.markdownInput.value.substring(0, cursor);
      const after = this.markdownInput.value.substring(cursor);
      const imgMarkdown = `\n![图片](img:${ref})\n`;
      this.markdownInput.value = before + imgMarkdown + after;
      this.markdownInput.selectionStart = this.markdownInput.selectionEnd = cursor + imgMarkdown.length;
      this.saveDraft();
      this.render(true);
    };
    reader.readAsDataURL(file);
  }

  handleCoverImageSelect(e) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.coverImageDataUrl = ev.target.result;
        this.render();
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }

  parsePages() {
    const raw = this.markdownInput.value;
    const parts = raw.split(/(?=@---)/).map(s => s.replace(/^@---\s*\n?/, '').trim()).filter(Boolean);
    if (parts.length === 0) {
      return [''];
    }
    return parts;
  }

  /** 获取各内容页在 markdown 中的起始字符偏移 */
  getPageStartOffsets() {
    const raw = this.markdownInput?.value ?? '';
    const offsets = [0];
    const re = /@---\s*\n?/g;
    let match;
    while ((match = re.exec(raw)) !== null) {
      offsets.push(match.index + match[0].length);
    }
    return offsets;
  }

  /** 预览区双击：左侧正文锚定到对应内容，预览和右侧不滚动 */
  scrollEditorToPage(cardPageIndex) {
    const ta = this.markdownInput;
    if (!ta) return;
    const offsets = this.getPageStartOffsets();
    const contentIndex = this.coverVisible ? cardPageIndex - 1 : cardPageIndex;
    let pos = 0;
    if (contentIndex >= 0 && contentIndex < offsets.length) {
      pos = offsets[contentIndex];
    }
    const len = ta.value.length;
    pos = Math.max(0, Math.min(pos, len));
    ta.scrollTop = this.getTextareaScrollTopForPosition(ta, pos);
    ta.setSelectionRange(pos, pos);
    ta.focus({ preventScroll: true });
  }

  getTextareaScrollTopForPosition(ta, charPos) {
    if (charPos <= 0) return 0;
    const style = getComputedStyle(ta);
    const mirror = document.createElement('div');
    mirror.style.cssText = `
      position: absolute; visibility: hidden; overflow: hidden;
      white-space: pre-wrap; word-wrap: break-word;
      width: ${ta.clientWidth}px; box-sizing: border-box;
      padding: ${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft};
      font: ${style.font}; line-height: ${style.lineHeight};
      font-family: ${style.fontFamily};
    `;
    mirror.textContent = ta.value.substring(0, charPos);
    document.body.appendChild(mirror);
    const h = mirror.offsetHeight;
    document.body.removeChild(mirror);
    return Math.max(0, h - ta.clientHeight / 2);
  }

  /** 将正文中的 base64 图片迁移为短引用 img:img_N */
  migrateBase64ToRefs(md) {
    const re = /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)\)/g;
    const images = {};
    let changed = false;
    let counter = this._imgRefCounter;
    const markdown = md.replace(re, (_, alt, dataUrl) => {
      changed = true;
      const ref = `img_${counter++}`;
      images[ref] = dataUrl;
      return `![${alt}](img:${ref})`;
    });
    if (changed) this._imgRefCounter = counter;
    return { markdown, images, changed };
  }

  /** 将 markdown 中的 img:xxx 展开为带贴纸标签的 HTML，兼容已有 base64 */
  expandImageRefs(md) {
    if (!md) return md;
    return md.replace(/!\[([^\]]*)\]\(img:(\w+)\)/g, (_, alt, ref) => {
      const dataUrl = this.imageDataUrls[ref];
      const altEsc = this.escapeHtml(alt || '');
      if (dataUrl) {
        return `<img src="${dataUrl}" alt="${altEsc}">`;
      }
      return `<span class="xhs-img-placeholder">${ref}</span>`;
    });
  }

  /** 判断该页是否仅有且只有一个图片（@--- 之间只有一张图） */
  isSingleImagePage(md) {
    const trimmed = (md || '').trim();
    if (!trimmed) return false;
    return /^\s*!\[[^\]]*\]\([^)]+\)\s*$/.test(trimmed);
  }

  /** 解析自定义块 ::: blockType [标题] ... ::: 并替换为 HTML */
  parseCustomBlocks(md) {
    if (!md) return md;
    const blocks = this.customBlocks || [];
    const knownIds = blocks.map(b => b.id).filter(Boolean);
    const blockIds = knownIds.length ? knownIds.join('|') : 'card';
    const re = new RegExp(`:::\\s*([^\\s\\n]+)(?:\\s+([^\\n]*?))?\\s*\\r?\\n([\\s\\S]*?)\\r?\\n\\s*:::`, 'g');
    return md.replace(re, (_, first, rest, body) => {
      const blockId = knownIds.includes(first) ? first : 'card';
      const title = (blockId === first ? (rest || '') : (first + (rest ? ' ' + rest : ''))).trim();
      return this.renderCustomBlock(blockId, title, (body || '').trim());
    });
  }

  /** 渲染自定义块 HTML：子标题: 子描述 多行，每个 pair 可跟图片。样式继承当前主题 */
  renderCustomBlock(blockId, title, body) {
    const config = this.customBlocks?.find(b => b.id === blockId) || {};
    const icon = config.icon || '';
    const imgRe = /!\[([^\]]*)\]\((img:\w+|data:image[^)]+)\)/;

    const renderImg = (alt, src) => {
      const dataUrl = src.startsWith('img:') ? this.imageDataUrls[src.replace('img:', '')] : src;
      const stickerRef = src.startsWith('img:') ? src.replace('img:', '') : '';
      const altEsc = this.escapeHtml(alt || '');
      if (dataUrl) {
        return `<div class="xhs-custom-block-img"><img src="${dataUrl}" alt="${altEsc}"></div>`;
      }
      return stickerRef ? `<div class="xhs-custom-block-img xhs-img-placeholder">${stickerRef}</div>` : '';
    };

    const pairs = [];
    const lines = body.split(/\n/);
    let lastPair = null;

    for (const line of lines) {
      const imgMatch = line.match(imgRe);
      const textWithoutImg = line.replace(imgRe, '').trim();
      const pairMatch = textWithoutImg.match(/^([^:：]+)[:：]\s*(.*)$/);

      if (pairMatch) {
        const subtitle = pairMatch[1].trim();
        const desc = pairMatch[2].trim();
        const pair = { subtitle, desc, image: imgMatch ? imgMatch[2] : null, alt: imgMatch ? imgMatch[1] : '' };
        pairs.push(pair);
        lastPair = pair;
      } else if (imgMatch && lastPair) {
        lastPair.image = imgMatch[2];
        lastPair.alt = imgMatch[1];
      }
    }

    const pairsHtml = pairs.map(p => {
      const imgHtml = p.image ? renderImg(p.alt, p.image) : '';
      return `<div class="xhs-custom-block-pair"><div class="xhs-custom-block-subtitle">${this.escapeHtml(p.subtitle)}</div><div class="xhs-custom-block-desc">${this.escapeHtml(p.desc)}</div>${imgHtml}</div>`;
    }).join('');

    const titleHtml = title ? `<div class="xhs-custom-block-title">${this.escapeHtml(title)}</div>` : '';
    const iconHtml = icon ? `<div class="xhs-custom-block-icon">${icon}</div>` : '';

    return `<div class="xhs-custom-block xhs-custom-block-${blockId}">${iconHtml}${titleHtml}<div class="xhs-custom-block-pairs">${pairsHtml}</div></div>`;
  }

  markdownToHtml(md) {
    if (!md || !md.trim()) return '';
    md = this.parseCustomBlocks(md);
    md = this.expandImageRefs(md);
    if (typeof marked !== 'undefined') {
      return marked.parse(md);
    }
    return md.replace(/\n/g, '<br>');
  }

  getTheme() {
    const checked = document.querySelector('#themeOptions input:checked');
    return checked ? checked.value : 'notion';
  }

  getThemeColors(theme) {
    const themes = {
      notion: { bg: '#F7F6F3', accent: '#37352F', text: '#37352F' },
      minimal: { bg: '#FAFAFA', accent: '#1a1a1a', text: '#1a1a1a' },
      light: { bg: '#FFFFFF', accent: '#1a1a1a', text: '#1a1a1a' },
      cream: { bg: '#FFF8F0', accent: '#5C4A3A', text: '#37352F' },
      contrast: { bg: '#FEFCE8', accent: '#1a1a1a', text: '#1a1a1a' },
      nanobanana: { bg: '#FFFBF0', accent: '#B8860B', text: '#4A4238' }
    };
    return themes[theme] || themes.notion;
  }

  render(skipScroll = false) {
    const savedScrollTop = this.previewContainer?.scrollTop ?? 0;
    this.pages = this.parsePages();
    this.currentPageIndex = Math.min(this.currentPageIndex, Math.max(0, this.pages.length - 1));

    const theme = this.getTheme();
    const colors = this.getThemeColors(theme);
    const canvasSize = document.getElementById('canvasSize').value;
    const [w, h] = canvasSize.split(':').map(Number);
    const aspectRatio = h / w; /* padding-bottom 用 height/width */

    const coverTitle = document.getElementById('coverTitle').value || '标题';
    const coverDesc = document.getElementById('coverDesc').value;
    const coverDate = document.getElementById('coverDate').value || '';
    const coverAuthor = this.getCoverAuthor();

    const coverFontSize = document.getElementById('coverFontSize').value + 'px';
    const bodyFontSize = document.getElementById('bodyFontSize').value + 'px';
    const titleFontSize = document.getElementById('titleFontSize').value + 'px';
    const coverTemplate = document.getElementById('coverTemplate')?.value || 'center';

    document.body.setAttribute('data-theme', theme);
    this.previewContainer.style.setProperty('--xhs-preview-aspect', aspectRatio);

    let html = '';

    // 封面页 - 根据模版渲染不同布局（隐藏时不渲染）
    if (this.coverVisible) {
      const coverBodyHtml = this.renderCoverBody(coverTemplate, coverTitle, coverDesc, coverAuthor);
      html += `
        <div class="xhs-card xhs-cover-card xhs-cover-${coverTemplate}${this.coverImageDataUrl ? ' xhs-has-cover-image' : ''}" data-page="0" style="
          --xhs-bg: ${colors.bg};
          --xhs-accent: ${colors.accent};
          --xhs-text: ${colors.text};
          --xhs-aspect: ${aspectRatio};
          --xhs-cover-font: ${coverFontSize};
          --xhs-body-font: ${bodyFontSize};
          --xhs-title-font: ${titleFontSize};
        ">
          <div class="xhs-card-bg" ${this.coverImageDataUrl ? `style="background-image: url(${this.coverImageDataUrl}); opacity: 1;"` : ''}></div>
          <div class="xhs-card-inner">
            ${coverBodyHtml}
          </div>
        </div>
      `;
    }

    // 内容页
    const pageOffset = this.coverVisible ? 1 : 0;
    this.pages.forEach((pageMd, i) => {
      const pageNum = pageOffset + i;
      const contentHtml = this.markdownToHtml(pageMd);
      const singleImageClass = this.isSingleImagePage(pageMd) ? ' xhs-single-image-page' : '';
      html += `
        <div class="xhs-card xhs-content-card${singleImageClass}" data-page="${pageNum}" style="
          --xhs-bg: ${colors.bg};
          --xhs-accent: ${colors.accent};
          --xhs-text: ${colors.text};
          --xhs-aspect: ${aspectRatio};
          --xhs-cover-font: ${coverFontSize};
          --xhs-body-font: ${bodyFontSize};
          --xhs-title-font: ${titleFontSize};
        ">
          <div class="xhs-card-inner">
            <div class="xhs-card-body">
              <div class="xhs-markdown-body">${contentHtml}</div>
            </div>
          </div>
        </div>
      `;
    });

    this.previewContainer.innerHTML = html;
    this.updatePageVisibility(skipScroll, this.coverVisible);
    this.applyMarkdownStyles();
    if (this.coverVisible) this.setupCoverTitleDrag();
    this.setupScrollObserver();
    if (skipScroll) {
      this.previewContainer.scrollTop = savedScrollTop;
    }
  }

  renderCoverBody(template, title, desc, author) {
    const t = this.escapeHtml(title);
    const d = desc ? this.escapeHtml(desc) : '';
    const a = this.escapeHtml(author);
    const titleClass = this.coverTitlePosition ? 'xhs-cover-title xhs-cover-title-draggable' : 'xhs-cover-title';
    const titleAttrs = this.coverTitlePosition
      ? `class="${titleClass}" style="position: absolute; left: ${this.coverTitlePosition.left}%; top: ${this.coverTitlePosition.top}%; transform: translate(-50%, -50%);" title="拖动可移动，双击重置"`
      : `class="${titleClass}"`;
    switch (template) {
      case 'top-desc':
        return `<div class="xhs-cover-body xhs-cover-top-desc">
          <h1 ${titleAttrs}>${t}</h1>
          ${d ? `<p class="xhs-cover-desc">${d}</p>` : ''}
          <p class="xhs-cover-author">${a}</p>
        </div>`;
      case 'simple':
        return `<div class="xhs-cover-body xhs-cover-simple">
          <h1 ${titleAttrs}>${t}</h1>
          <p class="xhs-cover-author">${a}</p>
        </div>`;
      case 'bottom-author':
        return `<div class="xhs-cover-body xhs-cover-bottom-author">
          <h1 ${titleAttrs}>${t}</h1>
          ${d ? `<p class="xhs-cover-desc">${d}</p>` : ''}
          <p class="xhs-cover-author">${a}</p>
        </div>`;
      default:
        return `<div class="xhs-cover-body xhs-cover-center">
          <h1 ${titleAttrs}>${t}</h1>
          ${d ? `<p class="xhs-cover-desc">${d}</p>` : ''}
          <p class="xhs-cover-author">${a}</p>
        </div>`;
    }
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  applyMarkdownStyles() {
    this.previewContainer.querySelectorAll('.xhs-markdown-body').forEach(body => {
      body.querySelectorAll('h1, h2, h3, h4').forEach(h => {
        h.style.fontSize = 'var(--xhs-title-font)';
      });
      body.querySelectorAll('p, li').forEach(el => {
        el.style.fontSize = 'var(--xhs-body-font)';
      });
      body.querySelectorAll('img').forEach(img => {
        img.style.maxWidth = '100%';
        img.style.borderRadius = '8px';
      });
    });
  }

  updatePageVisibility(skipScroll = false, hasCover = true) {
    const cards = this.previewContainer.querySelectorAll('.xhs-card');
    const totalPages = hasCover ? 1 + this.pages.length : this.pages.length;
    if (!hasCover && this.currentPageIndex > 0) {
      this.currentPageIndex = Math.max(0, this.currentPageIndex - 1);
    }
    this.currentPageIndex = Math.max(0, Math.min(this.currentPageIndex, totalPages - 1));

    cards.forEach((card, i) => {
      card.classList.toggle('xhs-card-active', i === this.currentPageIndex);
    });

    if (!skipScroll) {
      const activeCard = cards[this.currentPageIndex];
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    if (prevBtn) prevBtn.style.visibility = totalPages > 1 ? 'visible' : 'hidden';
    if (nextBtn) nextBtn.style.visibility = totalPages > 1 ? 'visible' : 'hidden';
  }

  setupCoverTitleDrag() {
    const coverCard = this.previewContainer?.querySelector('.xhs-cover-card');
    const title = coverCard?.querySelector('.xhs-cover-title');
    if (!coverCard || !title) return;

    let startX = 0, startY = 0, startLeft = 0, startTop = 0, cardRect = null;

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      cardRect = coverCard.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      const cx = titleRect.left + titleRect.width / 2;
      const cy = titleRect.top + titleRect.height / 2;
      startLeft = this.coverTitlePosition ? this.coverTitlePosition.left : (cx - cardRect.left) / cardRect.width * 100;
      startTop = this.coverTitlePosition ? this.coverTitlePosition.top : (cy - cardRect.top) / cardRect.height * 100;
      startX = e.clientX;
      startY = e.clientY;

      title.style.position = 'absolute';
      title.style.left = startLeft + '%';
      title.style.top = startTop + '%';
      title.style.transform = 'translate(-50%, -50%)';
      title.classList.add('xhs-cover-title-draggable');

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!cardRect) return;
      const dx = (e.clientX - startX) / cardRect.width * 100;
      const dy = (e.clientY - startY) / cardRect.height * 100;
      let left = Math.max(5, Math.min(95, startLeft + dx));
      let top = Math.max(5, Math.min(95, startTop + dy));
      title.style.left = left + '%';
      title.style.top = top + '%';
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (cardRect) {
        const left = parseFloat(title.style.left) || 50;
        const top = parseFloat(title.style.top) || 50;
        this.coverTitlePosition = { left, top };
        this.render(true);
      }
    };

    const onDblClick = (e) => {
      if (this.coverTitlePosition) {
        e.preventDefault();
        e.stopPropagation();
        this.coverTitlePosition = null;
        this.render(true);
      }
    };

    title.addEventListener('mousedown', onMouseDown);
    title.addEventListener('dblclick', onDblClick);
    title.style.cursor = 'move';
    title.title = '拖动可移动，双击重置';
  }

  setupScrollObserver() {
    if (this._scrollObserver) {
      this._scrollObserver.disconnect();
      this._scrollObserver = null;
    }
    const cards = this.previewContainer.querySelectorAll('.xhs-card');
    if (!cards.length || typeof IntersectionObserver === 'undefined') return;

    this._scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const pageNum = parseInt(entry.target.dataset.page, 10);
        const idx = Array.from(cards).findIndex(c => parseInt(c.dataset.page, 10) === pageNum);
        if (idx >= 0 && idx !== this.currentPageIndex) {
          this.currentPageIndex = idx;
          cards.forEach((c, i) => c.classList.toggle('xhs-card-active', i === idx));
        }
      });
    }, { root: this.previewContainer, threshold: 0.5 });

    cards.forEach(card => this._scrollObserver.observe(card));
  }

  prevPage() {
    const totalPages = 1 + this.pages.length;
    this.currentPageIndex = Math.max(0, this.currentPageIndex - 1);
    this.updatePageVisibility();
  }

  nextPage() {
    const totalPages = 1 + this.pages.length;
    this.currentPageIndex = Math.min(totalPages - 1, this.currentPageIndex + 1);
    this.updatePageVisibility();
  }

  async exportToJpg() {
    const cards = this.previewContainer?.querySelectorAll('.xhs-card');
    if (!cards?.length) return;

    const total = cards.length;
    const ok = confirm(`即将导出 ${total} 张图片，将打包为 ZIP 下载。\n\n是否继续？`);
    if (!ok) return;

    const btn = document.getElementById('exportBtn');
    const origText = btn.textContent;
    btn.textContent = `导出中 0/${total}...`;
    btn.disabled = true;

    const opts = { useCORS: true, allowTaint: true, scale: 2, backgroundColor: null, logging: false };

    try {
      const zip = typeof JSZip !== 'undefined' ? new JSZip() : null;
      const prefix = `xiaohongshu-note-${Date.now()}`;

      for (let i = 0; i < cards.length; i++) {
        btn.textContent = `导出中 ${i + 1}/${total}...`;
        const canvas = await html2canvas(cards[i], opts);
        const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92));
        const name = `${prefix}-${String(i + 1).padStart(2, '0')}.jpg`;

        if (zip) {
          zip.file(name, blob);
        } else {
          const link = document.createElement('a');
          link.download = name;
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href);
          await new Promise(r => setTimeout(r, 400));
        }
      }

      if (zip) {
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.download = `${prefix}.zip`;
        link.href = URL.createObjectURL(content);
        link.click();
        URL.revokeObjectURL(link.href);
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('导出失败：' + (err.message || err));
    } finally {
      btn.textContent = origText;
      btn.disabled = false;
    }
  }
}
