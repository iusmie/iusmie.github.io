/**
 * 首页 Bits of Life 交互逻辑 - 与模板分离，仅负责行为层
 */

(function () {
  'use strict';

  const DOM = {
    tabBtns: null,
    islandsView: null,
    tagsView: null,
    timelineView: null,
    cards: null,
    detailModal: null,
    modalContent: null,
  };

  function cacheDOMElements() {
    DOM.tabBtns = document.querySelectorAll('.home-tab-btn');
    DOM.islandsView = document.getElementById('islandsView');
    DOM.tagsView = document.getElementById('tagsView');
    DOM.timelineView = document.getElementById('timelineView');
    DOM.cards = document.querySelectorAll('.home-card');
    DOM.detailModal = document.getElementById('detailModal');
    DOM.modalContent = document.getElementById('modalContent');
  }

  function switchView(view) {
    if (!DOM.islandsView) return;

    // 只保留主题岛视图，始终显示
    DOM.islandsView.style.display = 'grid';
    
    // 触发卡片动画
    if (DOM.cards.length) {
      DOM.cards.forEach(function (card, i) {
        card.style.animation = 'none';
        setTimeout(function () {
          card.style.animation = 'homeFadeInUp 0.6s ease ' + i * 0.1 + 's forwards';
        }, 10);
      });
    }

    if (view === 'islands' && DOM.cards.length) {
      DOM.cards.forEach(function (card, i) {
        card.style.animation = 'none';
        setTimeout(function () {
          card.style.animation = 'homeFadeInUp 0.6s ease ' + i * 0.1 + 's forwards';
        }, 10);
      });
    }
  }

  var questionsData = {
    questions: [],
    drafts: []
  };

  // 权限检查：检查用户是否有编辑权限
  function hasEditPermission() {
    // 方式1: 通过URL参数检查（如 ?edit=true）
    var urlParams = new URLSearchParams(window.location.search);
    var hasEditParam = urlParams.get('edit') === 'true' || urlParams.get('admin') === 'true';
    
    if (hasEditParam) {
      // 设置到localStorage，保持会话状态
      localStorage.setItem('hasEditPermission', 'true');
      return true;
    } else {
      // 如果URL参数不存在，清除localStorage中的权限（防止之前的权限残留）
      localStorage.removeItem('hasEditPermission');
      return false;
    }
    
    // 方式2: 从localStorage检查（保持会话状态）- 已移除，只依赖URL参数
    // 方式3: 可以在这里添加其他权限检查逻辑（如token验证等）
  }

  // 从 markdown 文件解析数据
  function parseMarkdownQuestions(markdown) {
    var questions = [];
    var drafts = [];
    var lines = markdown.split('\n');
    var currentSection = null;
    var currentQuestion = null;
    
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      
      if (line.startsWith('## 已提交的问题')) {
        currentSection = 'questions';
        continue;
      } else if (line.startsWith('## 草稿')) {
        currentSection = 'drafts';
        continue;
      } else if (line.startsWith('### ')) {
        if (currentQuestion) {
          if (currentSection === 'questions') {
            questions.push(currentQuestion);
          } else if (currentSection === 'drafts') {
            drafts.push(currentQuestion);
          }
        }
        currentQuestion = {
          title: line.replace('### ', ''),
          content: '',
          link: ''
        };
      } else if (currentQuestion && line.startsWith('🔗 ')) {
        // 解析链接：🔗 [链接文本](url) 或 🔗 url
        var linkMatch = line.match(/🔗\s*(?:\[([^\]]+)\]\(([^)]+)\)|(.+))/);
        if (linkMatch) {
          currentQuestion.link = linkMatch[2] || linkMatch[3] || '';
          currentQuestion.linkText = linkMatch[1] || undefined;
        }
      } else if (currentQuestion && line) {
        currentQuestion.content += (currentQuestion.content ? '\n' : '') + line;
      }
    }
    
    if (currentQuestion) {
      if (currentSection === 'questions') {
        questions.push(currentQuestion);
      } else if (currentSection === 'drafts') {
        drafts.push(currentQuestion);
      }
    }
    
    return { questions: questions, drafts: drafts };
  }

  // 加载问题数据 - 使用与lifequestions页面相同的数据源
  function loadQuestionsData() {
    return fetch('./apps/lifequestions/data/questions-data.json')
      .then(function(response) {
        if (!response.ok) throw new Error('Failed to load questions');
        return response.json();
      })
      .then(function(data) {
        // 将JSON格式转换为首页使用的格式
        questionsData = {
          questions: (data.questions || []).map(function(q) {
            return {
              title: q.title || '',
              content: q.media ? (q.media.type === 'quote' ? q.media.text : '') : '',
              link: q.media && q.media.type === 'link' ? (q.media.url || '') : ''
            };
          }),
          drafts: []
        };
        // 保存原始JSON数据到全局变量，供其他函数使用
        window.questionsDataJSON = data;
        return questionsData;
      })
      .catch(function(error) {
        console.warn('Error loading questions from JSON:', error);
        // 尝试从localStorage加载
        var savedJSON = localStorage.getItem('questionsDataJSON');
        if (savedJSON) {
          try {
            var data = JSON.parse(savedJSON);
            window.questionsDataJSON = data;
            questionsData = {
              questions: (data.questions || []).map(function(q) {
                return {
                  title: q.title || '',
                  content: q.media ? (q.media.type === 'quote' ? q.media.text : '') : '',
                  link: q.media && q.media.type === 'link' ? (q.media.url || '') : ''
                };
              }),
              drafts: []
            };
            return questionsData;
          } catch (e) {
            console.warn('Error parsing saved JSON:', e);
          }
        }
        // 使用默认数据
        questionsData = {
          questions: [
            { title: '如何与不确定性共处？', content: '探索斯多葛学派与现代心理学的交叉点...' },
            { title: '数字极简是否可能？', content: '尝试把手机主屏幕减少到只有一屏的实验记录。' }
          ],
          drafts: []
        };
        return questionsData;
      });
  }

  // 生成 markdown 内容
  function generateMarkdownContent(data) {
    var markdown = '# 人生几多问\n\n';
    
    markdown += '## 已提交的问题\n\n';
    if (data.questions.length === 0) {
      markdown += '_暂无问题_\n';
    } else {
      data.questions.forEach(function(q) {
        markdown += '### ' + q.title + '\n';
        markdown += q.content + '\n';
        if (q.link) {
          if (q.linkText) {
            markdown += '🔗 [' + q.linkText + '](' + q.link + ')\n';
          } else {
            markdown += '🔗 ' + q.link + '\n';
          }
        }
        markdown += '\n';
      });
    }
    
    return markdown;
  }

  // 加载文件SHA（用于GitHub API更新）
  function loadFileSha() {
    if (window.GITHUB_REPO && window.GITHUB_TOKEN) {
      var repo = window.GITHUB_REPO.split('/');
      var owner = repo[0];
      var repoName = repo[1];
      
      return fetch('https://api.github.com/repos/' + owner + '/' + repoName + '/contents/shared/questionsaboutlife.md', {
        headers: {
          'Authorization': 'token ' + window.GITHUB_TOKEN
        }
      })
      .then(function(response) { return response.json(); })
      .then(function(data) {
        window.currentFileSha = data.sha;
        return data.sha;
      })
      .catch(function(error) {
        console.warn('Failed to load file SHA:', error);
        return null;
      });
    }
    return Promise.resolve(null);
  }

  // 写入文件
  function saveQuestionsToFile(data) {
    var markdown = generateMarkdownContent(data);
    
    // 方案1: 使用本地API端点（开发环境，Vite会自动处理）
    var apiEndpoint = window.API_ENDPOINT || '/api/save-questions';
    
    return fetch(apiEndpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: markdown })
    }).then(function(response) {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Failed to save');
    }).catch(function(error) {
      console.warn('Local API failed, trying GitHub API:', error);
      
      // 方案2: 使用 GitHub API（生产环境/GitHub Pages）
      if (window.GITHUB_TOKEN && window.GITHUB_REPO) {
        var repo = window.GITHUB_REPO.split('/');
        var owner = repo[0];
        var repoName = repo[1];
        
        return loadFileSha().then(function(sha) {
          return fetch('https://api.github.com/repos/' + owner + '/' + repoName + '/contents/shared/questionsaboutlife.md', {
            method: 'PUT',
            headers: {
              'Authorization': 'token ' + window.GITHUB_TOKEN,
              'Content-Type': 'application/json',
              'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
              message: 'Update questions from web interface',
              content: btoa(unescape(encodeURIComponent(markdown))),
              sha: sha || undefined
            })
          }).then(function(response) {
            if (!response.ok) {
              return response.json().then(function(err) {
                throw new Error(err.message || 'Failed to save');
              });
            }
            return response.json();
          });
        });
      }
      
      // 方案3: 使用localStorage临时存储（最后的备选）
      localStorage.setItem('questionsaboutlife_md', markdown);
      localStorage.setItem('questionsaboutlife_last_update', new Date().toISOString());
      
      console.log('Saved to localStorage. Start dev server with "npm run dev" to enable file writing.');
      
      return Promise.resolve({ 
        success: true, 
        fallback: true,
        message: 'Saved to browser storage. Start dev server for file writing.'
      });
    });
  }

  // 保存JSON数据到文件（与lifequestions页面使用相同的数据源）
  function saveQuestionsToJSONFile(jsonData) {
    var jsonContent = JSON.stringify(jsonData, null, 2);
    
    // 方案1: 使用本地API端点（开发环境）
    var apiEndpoint = window.API_ENDPOINT || '/api/save-questions-json';
    
    return fetch(apiEndpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: jsonContent, file: 'apps/lifequestions/data/questions-data.json' })
    }).then(function(response) {
      if (response.ok) {
        // 更新内存中的数据
        window.questionsDataJSON = jsonData;
        return response.json();
      }
      throw new Error('Failed to save');
    }).catch(function(error) {
      console.warn('Local API failed, trying GitHub API:', error);
      
      // 方案2: 使用 GitHub API（生产环境/GitHub Pages）
      if (window.GITHUB_TOKEN && window.GITHUB_REPO) {
        var repo = window.GITHUB_REPO.split('/');
        var owner = repo[0];
        var repoName = repo[1];
        
        return fetch('https://api.github.com/repos/' + owner + '/' + repoName + '/contents/apps/lifequestions/data/questions-data.json', {
          method: 'GET',
          headers: {
            'Authorization': 'token ' + window.GITHUB_TOKEN
          }
        }).then(function(response) {
          return response.ok ? response.json() : { sha: null };
        }).then(function(fileData) {
          return fetch('https://api.github.com/repos/' + owner + '/' + repoName + '/contents/apps/lifequestions/data/questions-data.json', {
            method: 'PUT',
            headers: {
              'Authorization': 'token ' + window.GITHUB_TOKEN,
              'Content-Type': 'application/json',
              'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
              message: 'Update questions data from home page',
              content: btoa(unescape(encodeURIComponent(jsonContent))),
              sha: fileData.sha || undefined
            })
          }).then(function(response) {
            if (!response.ok) {
              return response.json().then(function(err) {
                throw new Error(err.message || 'Failed to save');
              });
            }
            // 更新内存中的数据
            window.questionsDataJSON = jsonData;
            return response.json();
          });
        });
      }
      
      // 方案3: 使用localStorage临时存储（最后的备选）
      localStorage.setItem('questionsDataJSON', jsonContent);
      localStorage.setItem('questionsDataJSON_last_update', new Date().toISOString());
      
      console.log('Saved to localStorage. Start dev server with "npm run dev" to enable file writing.');
      
      // 更新内存中的数据
      window.questionsDataJSON = jsonData;
      
      return Promise.resolve({ 
        success: true, 
        fallback: true,
        message: 'Saved to browser storage. Start dev server for file writing.'
      });
    });
  }

  // 获取世界时钟内容
  function getToolsContent() {
    // 时区配置：北京、伦敦、纽约
    var timezones = [
      { name: '北京', tz: 'Asia/Shanghai' },
      { name: '伦敦', tz: 'Europe/London' },
      { name: '纽约', tz: 'America/New_York' }
    ];
    
    // 获取当前时间并格式化
    function getTimeForTimezone(tz) {
      try {
        var now = new Date();
        
        // 获取时间
        var timeFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        var timeParts = timeFormatter.formatToParts(now);
        var time = timeParts.find(function(p) { return p.type === 'hour'; }).value + ':' + 
                   timeParts.find(function(p) { return p.type === 'minute'; }).value;
        
        // 获取日期（MM/DD格式）
        var dateFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          month: '2-digit',
          day: '2-digit'
        });
        var dateParts = dateFormatter.formatToParts(now);
        var date = dateParts.find(function(p) { return p.type === 'month'; }).value + '/' + 
                   dateParts.find(function(p) { return p.type === 'day'; }).value;
        
        return { time: time, date: date };
      } catch (e) {
        // 降级方案：使用UTC时间
        var now = new Date();
        var month = (now.getMonth() + 1).toString().padStart(2, '0');
        var day = now.getDate().toString().padStart(2, '0');
        return {
          time: now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'),
          date: month + '/' + day
        };
      }
    }
    
    // 获取所有时区的时间
    var cities = timezones.map(function(item) {
      var timeData = getTimeForTimezone(item.tz);
      return {
        name: item.name,
        time: timeData.time,
        date: timeData.date,
        sortKey: parseInt(timeData.time.replace(':', ''))
      };
    });
    
    // 按时间顺序排序（从晚到早）
    cities.sort(function(a, b) {
      return b.sortKey - a.sortKey;
    });
    
    // 生成HTML
    var timeCellsHTML = cities.map(function(city) {
      return '<div class="home-detail-time-cell" data-city="' + city.name + '">' +
        '<div class="label">' + city.name + '</div>' +
        '<div class="value">' + city.time + '</div>' +
        '<div class="date">' + city.date + '</div>' +
        '</div>';
    }).join('');
    
    return '<h2 class="home-detail-heading" style="margin-bottom: 2rem;">生活工具箱</h2>' +
      '<div class="home-detail-grid">' +
      '<div class="home-detail-card-dark" id="worldClockCard">' +
      '<h4>🌍 世界时钟</h4>' +
      '<div class="home-detail-time-grid" id="worldClockGrid">' +
      timeCellsHTML +
      '</div>' +
      '</div>' +
      '<div class="home-detail-card-dark" id="timestampConverterCard">' +
      '<h4>⏰ 时间戳转换</h4>' +
      '<div class="home-detail-timestamp-converter">' +
      '<div class="home-detail-timestamp-input-group">' +
      '<select id="timestampUnit" class="home-detail-timestamp-unit-selector">' +
      '<option value="seconds" selected>秒</option>' +
      '<option value="milliseconds">毫秒</option>' +
      '</select>' +
      '<input type="text" id="timestampInput" placeholder="输入时间戳" class="home-detail-timestamp-input">' +
      '<button type="button" id="convertTimestampBtn" class="home-detail-timestamp-btn">转换为日期</button>' +
      '</div>' +
      '<div class="home-detail-timestamp-input-group">' +
      '<input type="datetime-local" id="datetimeInput" class="home-detail-timestamp-input">' +
      '<button type="button" id="convertDatetimeBtn" class="home-detail-timestamp-btn">转换为时间戳</button>' +
      '</div>' +
      '<div class="home-detail-timestamp-result" id="timestampResult"></div>' +
      '</div>' +
      '</div>' +
      '</div>';
  }

  function getThoughtsContent() {
    var lang = localStorage.getItem('lang') || 'en';
    // 获取translations对象（从i18n.js）
    var translations = window.translations || {};
    var texts = translations[lang] || translations.en || {};
    
    // 使用JSON数据源（与lifequestions页面相同）
    var jsonData = window.questionsDataJSON || { questions: [] };
    var allQuestions = jsonData.questions || [];
    var questionsCount = allQuestions.length;
    // 弹层只显示前2条
    var questions = allQuestions.slice(0, 2);
    var isEditor = hasEditPermission();
    
    var questionsHTML = '';
    questions.forEach(function(q, index) {
      // 构建标题HTML
      var titleHTML = '<h4>' + (q.title || '') + '</h4>';
      
      // 构建内容HTML - 根据media类型显示不同内容
      var contentHTML = '';
      if (q.media) {
        switch(q.media.type) {
          case 'quote':
            contentHTML = '<p style="font-style: italic; color: #666; margin: 1rem 0;">"' + (q.media.text || '') + '"</p>';
            if (q.media.author) {
              contentHTML += '<p style="text-align: right; color: #999; font-size: 0.9rem;">' + q.media.author + '</p>';
            }
            break;
          case 'doc':
            contentHTML = '<pre style="background: #f5f5f5; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; line-height: 1.6;">' + 
                         (q.media.preview || '').replace(/\n/g, '<br>') + '</pre>';
            break;
          case 'link':
            if (q.media.links && Array.isArray(q.media.links)) {
              // 多个链接
              contentHTML = '<div style="display: flex; flex-direction: column; gap: 0.5rem; margin: 1rem 0;">';
              q.media.links.forEach(function(link) {
                contentHTML += '<div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #f8f8f8; border-radius: 8px;">';
                contentHTML += '<div style="font-size: 1.2rem;">' + (link.icon || '📄') + '</div>';
                contentHTML += '<div style="font-size: 0.9rem; font-weight: 500;">' + (link.title || '') + '</div>';
                contentHTML += '</div>';
              });
              contentHTML += '</div>';
            } else {
              // 单个链接
              if (q.media.url) {
                titleHTML = '<h4><a href="' + q.media.url + '" target="_blank" rel="noopener noreferrer" class="home-detail-title-link">' + (q.title || '') + '</a></h4>';
              }
              if (q.media.title) {
                contentHTML = '<p style="color: #666; margin: 1rem 0;">' + q.media.title + '</p>';
              }
            }
            break;
          case 'video':
            contentHTML = '<div style="background: #1a1a1a; aspect-ratio: 16/9; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; margin: 1rem 0;">';
            contentHTML += '<div style="text-align: center;">';
            contentHTML += '<div style="width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; font-size: 1.5rem;">▶</div>';
            if (q.media.title) contentHTML += '<div>' + q.media.title + '</div>';
            if (q.media.duration) contentHTML += '<div style="opacity: 0.6; font-size: 0.85rem; margin-top: 0.5rem;">' + q.media.duration + '</div>';
            contentHTML += '</div></div>';
            break;
          case 'image':
            if (q.media.url) {
              contentHTML = '<div style="margin: 1rem 0;"><img src="' + q.media.url + '" alt="' + (q.media.alt || '') + '" style="max-width: 100%; border-radius: 8px;"></div>';
            }
            break;
          case 'audio':
            contentHTML = '<div style="background: #f8f8f8; padding: 1rem; border-radius: 8px; margin: 1rem 0;">';
            contentHTML += '<div style="display: flex; justify-content: space-between; align-items: center;">';
            if (q.media.title) contentHTML += '<span style="font-size: 0.9rem;">' + q.media.title + '</span>';
            if (q.media.duration) contentHTML += '<span style="font-size: 0.8rem; opacity: 0.8;">' + q.media.duration + '</span>';
            contentHTML += '</div></div>';
            break;
        }
      }
      
      // 添加标签
      var tagsHTML = '';
      if (q.tags && q.tags.length > 0) {
        tagsHTML = '<div style="margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">';
        q.tags.forEach(function(tag) {
          tagsHTML += '<span style="background: #f0f0f0; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; color: #666;">#' + tag + '</span>';
        });
        tagsHTML += '</div>';
      }
      
      // 只有有编辑权限时才显示滑动面板
      var linkPanelHTML = isEditor && q.media && q.media.type === 'link' && q.media.url
        ? '<div class="home-detail-block-link-panel" data-i18n-hint="press_enter_to_save">' +
          '<input type="url" class="home-detail-link-input" placeholder="' + (texts.question_placeholder_link || 'Enter link URL...') + '" value="' + (q.media.url || '') + '" data-question-id="' + (q.id || index) + '">' +
          '</div>'
        : '';
      
      questionsHTML += '<div class="home-detail-block" data-question-id="' + (q.id || index) + '">' +
        '<div class="home-detail-block-content">' +
        titleHTML +
        contentHTML +
        tagsHTML +
        '<div style="margin-top: 0.5rem; font-size: 0.85rem; color: #999;">' + (q.date || '') + '</div>' +
        '</div>' +
        linkPanelHTML +
        '</div>';
    });
    
    // 只有有编辑权限时才显示添加表单
    var addFormHTML = isEditor
      ? '<div class="home-detail-add-form">' +
        '<h3 data-i18n="add_question">' + (texts.add_question || '添加新问题') + '</h3>' +
        '<form id="questionForm">' +
        '<input type="text" id="questionTitle" placeholder="' + (texts.question_placeholder_title || 'Enter question title...') + '" required>' +
        '<textarea id="questionContent" rows="4" placeholder="' + (texts.question_placeholder_content || 'Describe your question or reflection...') + '" required></textarea>' +
        '<input type="url" id="questionLink" placeholder="' + (texts.question_placeholder_link || 'External link (optional)...') + '" style="padding: 0.75rem; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem;">' +
        '<div class="home-detail-form-actions">' +
        '<button type="submit" id="submitBtn" class="home-detail-btn-submit" data-i18n="submit">' + (texts.submit || '提交') + '</button>' +
        '</div>' +
        '</form>' +
        '</div>'
      : '';
    
    // 如果问题数量大于2，显示"更多"按钮
    var moreButtonHTML = questionsCount > 2
      ? '<div style="text-align: center; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #eee;">' +
        '<a href="pages/lifequestions.html" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.875rem 2rem; background: #1a1a1a; color: white; text-decoration: none; border-radius: 8px; font-size: 0.95rem; font-weight: 500; transition: all 0.3s ease;">' +
        '<span>查看更多 (' + questionsCount + ' 条)</span>' +
        '<span style="font-size: 1rem;">→</span>' +
        '</a>' +
        '</div>'
      : '';
    
    return '<div style="margin-bottom: 2rem;">' +
      '<span class="home-detail-badge">' + questionsCount + ' ' + (texts.questions_count || 'Questions') + '</span>' +
      '<h2 class="home-detail-heading" data-i18n="questions_title">' + (texts.questions_title || '人生几多问') + '</h2>' +
      '<p class="home-detail-subtitle" data-i18n="questions_subtitle">' + (texts.questions_subtitle || '探索存在、焦虑、数字极简主义的哲学思考。') + '</p>' +
      '</div>' +
      questionsHTML +
      moreButtonHTML +
      addFormHTML;
  }

  // 加载技术总结文档列表
  function loadTechSummaries() {
    return fetch('./docs/technology_summaries/')
      .then(function(response) {
        if (!response.ok) throw new Error('Failed to load tech summaries directory');
        return response.text();
      })
      .then(function(html) {
        // 解析 HTML 目录列表，提取所有 .md 文件
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var links = doc.querySelectorAll('a');
        var summaries = [];
        
        links.forEach(function(link) {
          var href = link.getAttribute('href');
          var text = link.textContent.trim();
          
          // 只处理 .md 文件，忽略目录和其他文件
          if (href && href.endsWith('.md') && !href.includes('..')) {
            var filename = href.split('/').pop().replace('.md', '');
            // 从文件名生成标题（替换 - 和 _ 为空格）
            var title = filename
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, function(char) { return char.toUpperCase(); });
              
            summaries.push({
              filename: href,
              title: title,
              url: './docs/technology_summaries/' + href
            });
          }
        });
        
        return summaries;
      })
      .catch(function(error) {
        console.warn('Error loading tech summaries directory:', error);
        
        // 返回默认的技术总结列表
        return [
          {
            filename: 'react-hooks-best-practices.md',
            title: 'React Hooks Best Practices',
            url: './docs/technology_summaries/react-hooks-best-practices.md'
          },
          {
            filename: 'javascript-performance-optimization.md',
            title: 'JavaScript Performance Optimization',
            url: './docs/technology_summaries/javascript-performance-optimization.md'
          },
          {
            filename: 'typescript-advanced-types.md',
            title: 'TypeScript Advanced Types',
            url: './docs/technology_summaries/typescript-advanced-types.md'
          }
        ];
      });
  }

  // 获取技术总结内容
  function getTechContent() {
    var techSummaries = window.techSummariesData || [];
    
    if (techSummaries.length === 0) {
      return '<div style="text-align: center; padding: 2rem; color: #999;">' +
        '<h2 class="home-detail-heading">技术角落</h2>' +
        '<p>暂无技术总结文档</p>' +
        '</div>';
    }
    
    // 按标题排序
    techSummaries.sort(function(a, b) {
      return a.title.localeCompare(b.title);
    });
    
    // 生成时间线 HTML
    var timelineHTML = '<div class="home-timeline-filtered">' +
      '<h2 class="home-detail-heading" style="margin-bottom: 2rem;">📚 技术总结</h2>' +
      '<p class="home-detail-subtitle" style="margin-bottom: 2rem;">' +
      '技术学习笔记与实践经验总结' +
      '</p>';
    
    techSummaries.forEach(function(summary, index) {
      var date = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '.');
      
      timelineHTML += '<div class="home-timeline-item" style="margin-bottom: 2rem; cursor: pointer;" ' +
        'onclick="window.open(\'' + summary.url + '\', \'_blank\')" ' +
        'title="点击阅读文档">';
      timelineHTML += '<div class="home-timeline-dot"></div>';
      timelineHTML += '<div class="home-timeline-date">' + date + '</div>';
      timelineHTML += '<h4 class="home-timeline-title">' + summary.title + '</h4>';
      timelineHTML += '<p class="home-timeline-desc">📄 MarkDown 文档 - 点击阅读完整内容</p>';
      timelineHTML += '</div>';
    });
    
    timelineHTML += '</div>';
    return timelineHTML;
  }

  var detailData = {
    thoughts: {
      content: getThoughtsContent(),
    },
    tools: {
      content: getToolsContent(),
    },
    tech: {
      content: getTechContent(),
    },
  };

  function openDetail(type) {
    if (!DOM.detailModal || !DOM.modalContent) return;
    
    // 如果是thoughts类型，从文件加载数据
    if (type === 'thoughts') {
      loadQuestionsData().then(function() {
        detailData.thoughts.content = getThoughtsContent();
        DOM.modalContent.innerHTML = detailData.thoughts.content;
        
        // 只有有编辑权限时才绑定表单事件
        if (hasEditPermission()) {
          bindQuestionForm();
        }
        
        // 延迟绑定滑动事件和更新i18n文本，确保DOM已渲染
        setTimeout(function() {
          bindQuestionBlocks();
          if (typeof updateContent === 'function') {
            updateContent(localStorage.getItem('lang') || 'en');
          }
          // 更新滑动面板的提示文本（如果有编辑权限）
          if (hasEditPermission()) {
            var lang = localStorage.getItem('lang') || 'en';
            var translations = window.translations || {};
            var texts = translations[lang] || translations.en || {};
            document.querySelectorAll('.home-detail-block-link-panel').forEach(function(panel) {
              panel.setAttribute('data-hint-text', texts.press_enter_to_save || 'Press Enter to save');
            });
          }
        }, 100);
      });
    } else if (type === 'tools') {
      // 工具页面需要实时更新时间
      detailData.tools.content = getToolsContent();
      DOM.modalContent.innerHTML = detailData.tools.content;
      
      // 绑定时间戳转换器事件
      bindTimestampConverter();
      
      // 启动实时更新（每分钟更新一次）
      if (window.worldClockInterval) {
        clearInterval(window.worldClockInterval);
      }
      window.worldClockInterval = setInterval(function() {
        if (DOM.detailModal && DOM.detailModal.classList.contains('is-open')) {
          var currentType = DOM.modalContent.querySelector('.home-detail-heading') ? 'tools' : null;
          if (currentType === 'tools') {
            detailData.tools.content = getToolsContent();
            DOM.modalContent.innerHTML = detailData.tools.content;
            bindTimestampConverter();
          }
        }
      }, 60000); // 每分钟更新一次
    } else if (type === 'tech') {
      // 技术总结页面：加载文档列表
      loadTechSummaries().then(function(summaries) {
        window.techSummariesData = summaries;
        detailData.tech.content = getTechContent();
        DOM.modalContent.innerHTML = detailData.tech.content;
        
        // 更新i18n文本
        if (typeof updateContent === 'function') {
          updateContent(localStorage.getItem('lang') || 'en');
        }
      }).catch(function(error) {
        console.error('Error loading tech summaries:', error);
        DOM.modalContent.innerHTML = '<div style="text-align: center; padding: 2rem; color: #999;">' +
          '<h2 class="home-detail-heading">技术角落</h2>' +
          '<p>加载技术总结失败</p>' +
          '</div>';
      });
    } else {
      var item = detailData[type] || detailData.thoughts;
      DOM.modalContent.innerHTML = item.content;
    }
    
    DOM.detailModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function bindQuestionForm() {
    var form = document.getElementById('questionForm');
    
    if (!form) return;
    
    // 提交
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var title = document.getElementById('questionTitle').value;
        var content = document.getElementById('questionContent').value;
        var link = document.getElementById('questionLink').value;
        
        if (!title || !content) {
          var lang = localStorage.getItem('lang') || 'en';
          var translations = window.translations || {};
          var texts = translations[lang] || translations.en || {};
          alert(texts.question_title && texts.question_content ? '请填写标题和内容' : 'Please fill in both title and content');
          return;
        }
        
        // 添加到JSON数据数组（与lifequestions页面使用相同格式）
        var jsonData = window.questionsDataJSON || { questions: [] };
        var existingQuestions = jsonData.questions || [];
        var maxId = existingQuestions.length > 0 
          ? Math.max.apply(null, existingQuestions.map(function(q) { return q.id || 0; }))
          : 0;
        var maxNumber = existingQuestions.length > 0
          ? Math.max.apply(null, existingQuestions.map(function(q) { 
              var num = parseInt((q.number || '000').replace(/^0+/, '') || '0');
              return isNaN(num) ? 0 : num;
            }))
          : 0;
        
        var newQuestion = {
          id: maxId + 1,
          number: String(maxNumber + 1).padStart(3, '0'),
          title: title,
          status: 'draft',
          type: link ? 'link' : 'doc',
          tags: [],
          date: new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).replace(/\//g, '.'),
          media: link ? {
            type: 'link',
            url: link,
            title: title
          } : {
            type: 'doc',
            preview: content
          },
          answers: []
        };
        
        jsonData.questions = jsonData.questions || [];
        jsonData.questions.push(newQuestion);
        
        // 保存到JSON文件
        saveQuestionsToJSONFile(jsonData).then(function() {
          var lang = localStorage.getItem('lang') || 'en';
          var translations = window.translations || {};
          var texts = translations[lang] || translations.en || {};
          
          // 清空表单
          document.getElementById('questionTitle').value = '';
          document.getElementById('questionContent').value = '';
          document.getElementById('questionLink').value = '';
          
          // 直接更新显示内容，使用内存中已更新的数据
          detailData.thoughts.content = getThoughtsContent();
          DOM.modalContent.innerHTML = detailData.thoughts.content;
          
          // 重新绑定表单和滑动事件（只有有编辑权限时）
          if (hasEditPermission()) {
            bindQuestionForm();
            setTimeout(function() {
              bindQuestionBlocks();
              if (typeof updateContent === 'function') {
                updateContent(localStorage.getItem('lang') || 'en');
              }
              // 更新滑动面板的提示文本
              var lang = localStorage.getItem('lang') || 'en';
              var translations = window.translations || {};
              var texts = translations[lang] || translations.en || {};
              document.querySelectorAll('.home-detail-block-link-panel').forEach(function(panel) {
                panel.setAttribute('data-hint-text', texts.press_enter_to_save || 'Press Enter to save');
              });
            }, 100);
          }
          
          alert(texts.submit ? '问题已提交！' : 'Question submitted successfully!');
        }).catch(function(error) {
          console.error('Error submitting question:', error);
          var lang = localStorage.getItem('lang') || 'en';
          var translations = window.translations || {};
          var texts = translations[lang] || translations.en || {};
          alert(texts.submit ? '提交失败，请重试' : 'Failed to submit, please try again');
        });
      });
    }
  }

  // 全局点击处理器（只绑定一次）
  var globalClickHandlerBound = false;
  
  function bindQuestionBlocks() {
    // 如果没有编辑权限，不绑定滑动事件
    if (!hasEditPermission()) {
      return;
    }
    
    var blocks = document.querySelectorAll('.home-detail-block');
    
    // 绑定全局点击处理器（只绑定一次）
    if (!globalClickHandlerBound) {
      document.addEventListener('click', function(e) {
        // 检查所有 swiped 的 blocks
        document.querySelectorAll('.home-detail-block.swiped').forEach(function(block) {
          // 权限检查：只有有编辑权限时才处理关闭逻辑
          if (!hasEditPermission()) {
            // 如果没有权限但面板是打开的，强制关闭
            block.classList.remove('swiped');
            var content = block.querySelector('.home-detail-block-content');
            var panel = block.querySelector('.home-detail-block-link-panel');
            if (content) content.style.transform = '';
            if (panel) panel.style.transform = '';
            return;
          }
          
          var linkInput = block.querySelector('.home-detail-link-input');
          
          // 如果点击的是输入框或面板内部，不关闭
          if (block.contains(e.target) || e.target === linkInput) {
            return;
          }
          
          // 如果输入框有焦点，不关闭
          if (linkInput && document.activeElement === linkInput) {
            return;
          }
          
          // 否则关闭面板
          block.classList.remove('swiped');
          var content = block.querySelector('.home-detail-block-content');
          var panel = block.querySelector('.home-detail-block-link-panel');
          if (content) content.style.transform = '';
          if (panel) panel.style.transform = '';
        });
      }, true);
      globalClickHandlerBound = true;
    }
    
    blocks.forEach(function(block) {
      // 如果已经绑定过，跳过
      if (block.dataset.bound === 'true') {
        return;
      }
      block.dataset.bound = 'true';
      
      // 检查是否有滑动面板（只有有编辑权限时才有）
      var linkPanel = block.querySelector('.home-detail-block-link-panel');
      if (!linkPanel) {
        return; // 没有滑动面板，不绑定滑动事件
      }
      
      var startX = 0;
      var currentX = 0;
      var isSwiping = false;
      var threshold = 50;
      
      // 触摸事件
      block.addEventListener('touchstart', function(e) {
        // 双重权限检查
        if (!hasEditPermission() || !linkPanel) return;
        startX = e.touches[0].clientX;
        isSwiping = true;
      });
      
      block.addEventListener('touchmove', function(e) {
        // 双重权限检查
        if (!hasEditPermission() || !isSwiping || !linkPanel) return;
        currentX = e.touches[0].clientX;
        var diffX = currentX - startX;
        
        // 只允许左滑
        if (diffX < 0) {
          e.preventDefault();
          var translateX = Math.max(diffX, -200);
          block.querySelector('.home-detail-block-content').style.transform = 'translateX(' + translateX + 'px)';
          linkPanel.style.transform = 'translateX(' + (translateX + 200) + 'px)';
        }
      });
      
      block.addEventListener('touchend', function(e) {
        // 双重权限检查
        if (!hasEditPermission() || !isSwiping || !linkPanel) return;
        isSwiping = false;
        var diffX = currentX - startX;
        
        if (diffX < -threshold) {
          block.classList.add('swiped');
        } else {
          block.classList.remove('swiped');
          block.querySelector('.home-detail-block-content').style.transform = '';
          linkPanel.style.transform = '';
        }
      });
      
      // 鼠标事件（用于桌面）
      var mouseDown = false;
      var mouseStartX = 0;
      
      block.addEventListener('mousedown', function(e) {
        // 双重权限检查
        if (!hasEditPermission() || !linkPanel) return;
        mouseDown = true;
        mouseStartX = e.clientX;
      });
      
      block.addEventListener('mousemove', function(e) {
        // 双重权限检查
        if (!hasEditPermission() || !mouseDown || !linkPanel) return;
        var diffX = e.clientX - mouseStartX;
        
        if (diffX < 0) {
          var translateX = Math.max(diffX, -200);
          block.querySelector('.home-detail-block-content').style.transform = 'translateX(' + translateX + 'px)';
          linkPanel.style.transform = 'translateX(' + (translateX + 200) + 'px)';
        }
      });
      
      block.addEventListener('mouseup', function(e) {
        // 双重权限检查
        if (!hasEditPermission() || !mouseDown || !linkPanel) return;
        mouseDown = false;
        var diffX = e.clientX - mouseStartX;
        
        if (diffX < -threshold) {
          block.classList.add('swiped');
        } else {
          block.classList.remove('swiped');
          block.querySelector('.home-detail-block-content').style.transform = '';
          linkPanel.style.transform = '';
        }
      });
      
      block.addEventListener('mouseleave', function(e) {
        // 双重权限检查
        if (!hasEditPermission() || !linkPanel) return;
        if (mouseDown) {
          mouseDown = false;
          block.classList.remove('swiped');
          block.querySelector('.home-detail-block-content').style.transform = '';
          linkPanel.style.transform = '';
        }
      });
      
      // 保存链接功能（Enter键保存）
      var linkInput = block.querySelector('.home-detail-link-input');
      
      if (linkInput) {
        // 点击输入框时阻止关闭面板
        linkInput.addEventListener('click', function(e) {
          e.stopPropagation();
        });
        
        // 点击面板时阻止事件冒泡
        linkInput.addEventListener('mousedown', function(e) {
          e.stopPropagation();
        });
        
        linkInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            var questionId = parseInt(block.getAttribute('data-question-id'));
            var link = linkInput.value.trim();
            
            // 更新JSON数据
            var jsonData = window.questionsDataJSON || { questions: [] };
            var question = jsonData.questions.find(function(q) { return q.id === questionId; });
            
            if (question) {
              if (link) {
                if (!question.media) {
                  question.media = { type: 'link' };
                }
                question.media.type = 'link';
                question.media.url = link;
              } else {
                if (question.media && question.media.type === 'link') {
                  delete question.media.url;
                }
              }
              
              // 保存到JSON文件
              saveQuestionsToJSONFile(jsonData).then(function() {
                // 关闭滑动面板
                block.classList.remove('swiped');
                block.querySelector('.home-detail-block-content').style.transform = '';
                block.querySelector('.home-detail-block-link-panel').style.transform = '';
                
                // 刷新内容
                setTimeout(function() {
                  openDetail('thoughts');
                }, 300);
              }).catch(function(error) {
                console.error('Error saving link:', error);
                var lang = localStorage.getItem('lang') || 'en';
                var translations = window.translations || {};
                var texts = translations[lang] || translations.en || {};
                alert(texts.save ? '保存失败，请重试' : 'Failed to save, please try again');
              });
            }
          }
        });
      }
      
      // 点击面板本身时阻止事件冒泡
      var linkPanel = block.querySelector('.home-detail-block-link-panel');
      if (linkPanel) {
        linkPanel.addEventListener('click', function(e) {
          e.stopPropagation();
        });
        
        linkPanel.addEventListener('mousedown', function(e) {
          e.stopPropagation();
        });
      }
    });
  }

  // 绑定时间戳转换器事件
  function bindTimestampConverter() {
    var timestampInput = document.getElementById('timestampInput');
    var datetimeInput = document.getElementById('datetimeInput');
    var convertTimestampBtn = document.getElementById('convertTimestampBtn');
    var convertDatetimeBtn = document.getElementById('convertDatetimeBtn');
    var resultDiv = document.getElementById('timestampResult');
    
    if (!timestampInput || !datetimeInput || !convertTimestampBtn || !convertDatetimeBtn || !resultDiv) {
      return;
    }
    
    // 获取选择的单位
    function getSelectedUnit() {
      var unitSelect = document.getElementById('timestampUnit');
      return unitSelect ? unitSelect.value : 'seconds';
    }
    
    // 时间戳转日期
    function convertTimestampToDate() {
      var timestamp = timestampInput.value.trim();
      if (!timestamp) {
        resultDiv.textContent = '请输入时间戳';
        resultDiv.className = 'home-detail-timestamp-result error';
        return;
      }
      
      var ts = parseInt(timestamp);
      if (isNaN(ts)) {
        resultDiv.textContent = '时间戳格式错误';
        resultDiv.className = 'home-detail-timestamp-result error';
        return;
      }
      
      // 根据选择的单位转换
      var unit = getSelectedUnit();
      if (unit === 'milliseconds') {
        ts = Math.floor(ts / 1000);
      }
      
      var date = new Date(ts * 1000);
      if (isNaN(date.getTime())) {
        resultDiv.textContent = '无效的时间戳';
        resultDiv.className = 'home-detail-timestamp-result error';
        return;
      }
      
      var year = date.getFullYear();
      var month = String(date.getMonth() + 1).padStart(2, '0');
      var day = String(date.getDate()).padStart(2, '0');
      var hours = String(date.getHours()).padStart(2, '0');
      var minutes = String(date.getMinutes()).padStart(2, '0');
      var seconds = String(date.getSeconds()).padStart(2, '0');
      
      var dateStr = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
      datetimeInput.value = dateStr;
      
      resultDiv.textContent = '转换成功：' + year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
      resultDiv.className = 'home-detail-timestamp-result success';
    }
    
    // 日期转时间戳
    function convertDateToTimestamp() {
      var datetime = datetimeInput.value;
      if (!datetime) {
        resultDiv.textContent = '请选择日期时间';
        resultDiv.className = 'home-detail-timestamp-result error';
        return;
      }
      
      var date = new Date(datetime);
      if (isNaN(date.getTime())) {
        resultDiv.textContent = '无效的日期时间';
        resultDiv.className = 'home-detail-timestamp-result error';
        return;
      }
      
      var unit = getSelectedUnit();
      var timestamp;
      if (unit === 'milliseconds') {
        timestamp = date.getTime();
      } else {
        timestamp = Math.floor(date.getTime() / 1000);
      }
      
      timestampInput.value = timestamp;
      
      resultDiv.textContent = '转换成功：' + timestamp + ' (' + (unit === 'milliseconds' ? '毫秒' : '秒') + ')';
      resultDiv.className = 'home-detail-timestamp-result success';
    }
    
    // 绑定事件
    convertTimestampBtn.addEventListener('click', convertTimestampToDate);
    convertDatetimeBtn.addEventListener('click', convertDateToTimestamp);
    
    // 回车键转换
    timestampInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        convertTimestampToDate();
      }
    });
    
    datetimeInput.addEventListener('change', function() {
      if (datetimeInput.value) {
        convertDateToTimestamp();
      }
    });
    
    // 设置当前时间
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    datetimeInput.value = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
  }

  function closeModal(e) {
    if (!DOM.detailModal) return;
    var isOverlay = !e || e.target.id === 'detailModal';
    if (isOverlay) {
      DOM.detailModal.classList.remove('is-open');
      document.body.style.overflow = '';
      
      // 清除世界时钟的定时器
      if (window.worldClockInterval) {
        clearInterval(window.worldClockInterval);
        window.worldClockInterval = null;
      }
    }
  }

  function filterTag(tag) {
    if (!DOM.detailModal || !DOM.modalContent) return;
    
    // 获取标签显示文本（从i18n或标签元素本身）
    var tagElement = document.querySelector('[data-filter-tag="' + tag + '"]');
    var tagText = tagElement ? tagElement.textContent.replace('#', '') : tag;
    
    // 获取所有时间流条目
    var timelineItems = document.querySelectorAll('.home-timeline-item');
    var filteredItems = [];
    
    // 过滤包含该标签的条目
    timelineItems.forEach(function(item) {
      var tags = item.getAttribute('data-tags');
      if (tags && tags.split(',').indexOf(tag) !== -1) {
        filteredItems.push(item);
      }
    });
    
    // 生成时间流HTML
    var timelineHTML = '<div class="home-timeline-filtered">';
    timelineHTML += '<h2 class="home-detail-heading" style="margin-bottom: 2rem;">#' + tagText + '</h2>';
    
    if (filteredItems.length === 0) {
      timelineHTML += '<p style="text-align: center; padding: 2rem; color: #999;">暂无相关内容</p>';
    } else {
      filteredItems.forEach(function(item) {
        var date = item.querySelector('.home-timeline-date').textContent;
        var title = item.querySelector('.home-timeline-title').textContent;
        var desc = item.querySelector('.home-timeline-desc').textContent;
        
        timelineHTML += '<div class="home-timeline-item" style="margin-bottom: 2rem;">';
        timelineHTML += '<div class="home-timeline-dot"></div>';
        timelineHTML += '<div class="home-timeline-date">' + date + '</div>';
        timelineHTML += '<h4 class="home-timeline-title">' + title + '</h4>';
        timelineHTML += '<p class="home-timeline-desc">' + desc + '</p>';
        timelineHTML += '</div>';
      });
    }
    
    timelineHTML += '</div>';
    
    // 显示在模态框中
    DOM.modalContent.innerHTML = timelineHTML;
    DOM.detailModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        if (href === '#') return;
        e.preventDefault();
        var target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
    
    // 页面加载时，如果有 hash，滚动到对应位置
    if (window.location.hash) {
      setTimeout(function() {
        var target = document.querySelector(window.location.hash);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }

  function bindEvents() {
    // Tab按钮已移除，不再需要绑定事件

    document.querySelectorAll('.home-nav-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        // 如果链接有href且不是#，允许正常跳转
        var href = link.getAttribute('href');
        if (href && href !== '#') {
          return; // 允许默认跳转行为
        }
        e.preventDefault();
        document.querySelectorAll('.home-nav-link').forEach(function (l) { l.classList.remove('active'); });
        link.classList.add('active');
        var view = link.getAttribute('data-view-link');
        if (view) switchView(view);
      });
    });

    if (DOM.detailModal) {
      DOM.detailModal.addEventListener('click', function (e) {
        if (e.target.id === 'detailModal' || e.target === DOM.detailModal) {
          closeModal(e);
        }
      });
    }

    var closeBtn = document.getElementById('detailModalClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeModal({ target: { id: 'detailModal' } });
      });
    }

    // 先绑定链接的事件，阻止事件冒泡到卡片
    document.querySelectorAll('.home-card-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        // 如果链接有有效的 href 且不是 #，允许正常跳转
        if (href && href !== '#' && href !== '') {
          // 阻止事件冒泡到卡片，让浏览器处理跳转
          e.stopPropagation();
          return; // 允许默认跳转行为
        }
        // 如果链接有 data-card-detail 属性，打开模态框
        var cardDetail = link.getAttribute('data-card-detail');
        if (cardDetail) {
          e.preventDefault();
          e.stopPropagation();
          openDetail(cardDetail);
        }
      });
    });
    
    // 绑定卡片事件：区分上半部分和下半部分
    document.querySelectorAll('[data-detail]').forEach(function (el) {
      var type = el.getAttribute('data-detail');
      var linkUrl = el.getAttribute('data-link');
      
      if (type) {
        // 上半部分（图片区域）：点击打开模态框
        var cardImage = el.querySelector('.home-card-image');
        if (cardImage) {
          cardImage.addEventListener('click', function (e) {
            e.stopPropagation();
            openDetail(type);
          });
        }
        
        // 下半部分（内容区域）：如果有链接，点击跳转
        var cardContent = el.querySelector('.home-card-content');
        if (cardContent && linkUrl) {
          cardContent.style.cursor = 'pointer';
          cardContent.addEventListener('click', function (e) {
            // 如果点击的是链接，不处理（让链接的事件处理）
            if (e.target.closest('.home-card-link')) {
              return;
            }
            // 跳转到指定页面
            e.stopPropagation();
            window.location.href = linkUrl;
          });
        }
        
        // 卡片整体点击事件（作为后备，但优先级低于上下部分）
        el.addEventListener('click', function (e) {
          // 如果卡片本身是链接，允许正常跳转
          if (el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href') !== '#') {
            return; // 允许默认跳转行为
          }
          
          // 如果点击的是链接或其内部元素，不处理（让链接的事件处理）
          if (e.target.closest('.home-card-link')) {
            return;
          }
          
          // 如果点击的是图片区域或内容区域，不处理（让它们各自的事件处理）
          if (e.target.closest('.home-card-image') || e.target.closest('.home-card-content')) {
            return;
          }
          
          // 其他情况：如果有链接就跳转，否则打开模态框
          if (linkUrl) {
            e.preventDefault();
            window.location.href = linkUrl;
          } else {
            e.preventDefault();
            openDetail(type);
          }
        });
      }
    });


    document.querySelectorAll('[data-filter-tag]').forEach(function (el) {
      var tag = el.getAttribute('data-filter-tag');
      if (tag) {
        el.addEventListener('click', function () {
          filterTag(tag);
        });
      }
    });

    initSmoothScroll();
  }

  function init() {
    cacheDOMElements();
    bindEvents();
    // 预加载问题数据
    loadQuestionsData();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.homePage = {
    switchView: switchView,
    openDetail: openDetail,
    closeModal: closeModal,
    filterTag: filterTag,
  };
})();
