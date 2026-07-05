/**
 * Bits & Pulse - Core Interactive Engine
 * Handling Founder Mode Toggles, Timezones, Terminal Emulator, and GitHub APIs.
 */

$(document).ready(function() {
  'use strict';

  // CALCULATE CONSULTATIONS: base 5000 + 400 per month since June 1, 2026
  function calculateCurrentConsultations() {
    const baseConsultations = 5000;
    const referenceDate = new Date(2026, 5, 1); // June 1, 2026
    const today = new Date();
    const monthsElapsed = Math.floor((today - referenceDate) / (1000 * 60 * 60 * 24 * 30.44));
    return baseConsultations + (monthsElapsed * 400);
  }
  
  function updateConsultationsCount() {
    const currentConsultations = calculateCurrentConsultations();
    const consultationsEl = document.getElementById('consultations-count');
    if (consultationsEl) {
      consultationsEl.textContent = currentConsultations.toLocaleString() + '+';
    }
  }
  
  updateConsultationsCount();

  // 1. DYNAMIC BENGALURU CLOCK
  function updateBengaluruClock() {
    const clockEl = document.getElementById('bengaluru-time');
    if (!clockEl) return;
    
    // Get time in Bengaluru (IST, UTC+5:30)
    const options = {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    
    try {
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(new Date());
      const timeStr = parts.map(p => p.value).join('');
      clockEl.textContent = `${timeStr} IST`;
    } catch (e) {
      // Fallback if timezone formatting is unsupported
      const d = new Date();
      const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      const ist = new Date(utc + (3600000 * 5.5));
      const pad = (n) => n.toString().padStart(2, '0');
      clockEl.textContent = `${pad(ist.getHours())}:${pad(ist.getMinutes())}:${pad(ist.getSeconds())} IST`;
    }
  }
  
  setInterval(updateBengaluruClock, 1000);
  updateBengaluruClock();

  // 4. INTERACTIVE TERMINAL DRAWER (initialize early)
  const termHeader = $('.terminal-header');
  const termInput = $('.terminal-input');
  const termOutput = $('.terminal-output');
  let blogEntries = [];

  // Terminal Line Adder Helper
  function addTerminalLine(text, type = 'normal') {
    const line = $('<div class="term-line"></div>');
    if (type === 'system') {
      line.css('color', '#6366F1');
      line.html(`[SYSTEM] ${text}`);
    } else if (type === 'prompt') {
      line.html(`<span style="color: #6366F1">saurabh-minni &gt;</span> ${text}`);
    } else if (type === 'error') {
      line.css('color', '#EF4444');
      line.html(`[ERROR] ${text}`);
    } else if (type === 'highlight') {
      line.css('color', '#10B981');
      line.html(text);
    } else {
      line.text(text);
    }
    termOutput.append(line);
    
    // Auto-scroll terminal body
    const bodyEl = $('.terminal-body')[0];
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  // 2. STATE SWITCHER: PULSE MODE VS. BITS MODE (FOUNDER MODE)
  const body = $('body');
  const btnPulse = $('#btn-mode-pulse');
  const btnBits = $('#btn-mode-bits');
  const termDrawer = $('.terminal-drawer');

  function setMode(mode) {
    if (mode === 'bits') {
      body.addClass('bits-mode');
      btnPulse.removeClass('active');
      btnBits.addClass('active');
      termDrawer.addClass('expanded');
      localStorage.setItem('portfolio-mode', 'bits');
      addTerminalLine('System switch: BITS MODE activated. Raw terminal loaded.', 'system');
    } else {
      body.removeClass('bits-mode');
      btnBits.removeClass('active');
      btnPulse.addClass('active');
      termDrawer.removeClass('expanded');
      localStorage.setItem('portfolio-mode', 'pulse');
    }
  }

  btnPulse.on('click', () => setMode('pulse'));
  btnBits.on('click', () => setMode('bits'));

  // Load persistent user preference
  const savedMode = localStorage.getItem('portfolio-mode');
  if (savedMode === 'bits') {
    setMode('bits');
  } else {
    setMode('pulse');
  }

  // 3. GITHUB LIVE STATS FETCHER
  let githubData = { repos: 0, stars: 0, followers: 0 };
  
  function fetchGitHubStats() {
    const reposCountEl = $('#gh-repos-count');
    const starsCountEl = $('#gh-stars-count');

    // Fetch user profile
    $.ajax({
      url: 'https://api.github.com/users/the100rabh',
      dataType: 'json',
      success: function(user) {
        githubData.repos = user.public_repos || 45;
        githubData.followers = user.followers || 120;
        
        if (reposCountEl.length) reposCountEl.text(githubData.repos);
        
        // Fetch repositories to calculate stars
        $.ajax({
          url: 'https://api.github.com/users/the100rabh/repos?per_page=100',
          dataType: 'json',
          success: function(repos) {
            let totalStars = 0;
            if (Array.isArray(repos)) {
              repos.forEach(repo => {
                totalStars += (repo.stargazers_count || 0);
              });
            }
            githubData.stars = totalStars || 18;
            if (starsCountEl.length) starsCountEl.text(githubData.stars);
          },
          error: function() {
            // Fallback for sub-query error
            githubData.stars = 24; 
            if (starsCountEl.length) starsCountEl.text(githubData.stars);
          }
        });
      },
      error: function() {
        // Safe fallbacks in case of GitHub rate limiting API limits
        githubData.repos = 54;
        githubData.stars = 32;
        githubData.followers = 118;
        if (reposCountEl.length) reposCountEl.text(githubData.repos);
        if (starsCountEl.length) starsCountEl.text(githubData.stars);
      }
    });
  }
  
  fetchGitHubStats();

  // Toggle drawer expand/collapse on header click
  termHeader.on('click', function(e) {
    if ($(e.target).closest('.terminal-ctrls').length) return; // ignore control buttons
    termDrawer.toggleClass('expanded');
  });

  // Handle Control buttons actions
  $('.btn-close').on('click', () => {
    termDrawer.removeClass('expanded');
    setMode('pulse');
  });
  $('.btn-min').on('click', () => termDrawer.removeClass('expanded'));
  $('.btn-max').on('click', () => termDrawer.addClass('expanded'));

  // Hook into blog feed to cache entries for terminal query
  window.update_feed = function(feed_url, element_id) {
    console.log('Intercepting update_feed to cache blog posts in JS...');
    $.ajax({
      url: feed_url,
      dataType: 'jsonp',
      success: function(data) {
        let feed_html = '';
        const entries = data.feed.entry || [];
        blogEntries = entries; // Cache for CLI terminal use
        
        entries.slice(0, 10).forEach(function(entry) {
          let post_link = '';
          if (entry.link && Array.isArray(entry.link)) {
            const alternate_link = entry.link.find(link => link.rel === 'alternate');
            if (alternate_link) {
              post_link = alternate_link.href;
            }
          }
          const post_title = entry.title ? entry.title.$t : 'Untitled Post';
          feed_html += `
            <li class="feed_item">
              <a class="feed_item_link" href="${post_link}" target="_blank" rel="noopener">
                ${post_title}
              </a>
            </li>
          `;
        });
        
        const html = '<ul class="feed_list" style="margin:0; padding:0; list-style:none;">' + feed_html + '</ul>';
        $('#' + element_id).html(html);
      },
      error: function(xhr, status, error) {
        console.error("Failed to load blog feed:", status, error);
        $('#' + element_id).html('<p>Could not load blog posts.</p>');
      }
    });
  };

  // Commands Interpreter
  function interpretCommand(cmdStr) {
    const raw = cmdStr.trim();
    if (!raw) return;
    
    addTerminalLine(raw, 'prompt');
    const cmd = raw.toLowerCase().split(' ')[0];
    
    switch(cmd) {
      case 'help':
        addTerminalLine('Available System Queries:', 'highlight');
        addTerminalLine('  bio       : Displays full architectural biography & tech background');
        addTerminalLine('  ventures  : Displays clinical telemetry report of Sudama Health (ASCII charts)');
        addTerminalLine('  apps      : Queries interactive laboratory and experimental software artifacts');
        addTerminalLine('  blog      : Displays the 5 latest post chronicles dynamically indexed from feed');
        addTerminalLine('  github    : Fetches live stats of Saurabh\'s repositories & open source nodes');
        addTerminalLine('  clear     : Clears the terminal output screen');
        break;
        
      case 'bio':
        addTerminalLine('=========================================================', 'highlight');
        addTerminalLine('SAURABH MINNI - TECHNOLOGY FOUNDER & FULL-STACK CRAFTSMAN');
        addTerminalLine('=========================================================', 'highlight');
        addTerminalLine('20+ years scaling core architectures at Google, Intuit, and Adobe.');
        addTerminalLine('Today: Founder of Sudama Health, rural telemedicine operator.');
        addTerminalLine('Languages: Android, Java, Go, Python, C/C++, HTML5, Javascript.');
        break;
        
      case 'ventures':
        addTerminalLine('=========================================================', 'highlight');
        addTerminalLine('SUDAMA HEALTH RURAL CLINICS TELEMETRY LOGS');
        addTerminalLine('=========================================================', 'highlight');
        addTerminalLine('Status: ACTIVE CLINICAL TELEMEDICINE INFRASTRUCTURE');
        
        const currentConsultations = calculateCurrentConsultations();
        addTerminalLine(`Consultations: ${currentConsultations.toLocaleString()} completed patient interactions`);
        addTerminalLine('EMR Software: 100% custom telemedicine first workflow integration.');
        addTerminalLine('Telemedicine Hardware Integration: Platform provides seemless integration with advanced connected medical devices.');
        break;
        
      case 'apps':
        addTerminalLine('=========================================================', 'highlight');
        addTerminalLine('THE LABORATORY ARTIFACT REGISTRY (apps.100rabh.com)');
        addTerminalLine('=========================================================', 'highlight');
        addTerminalLine('• Educational Games for Kids (HTML5 Pedagogical Games)');
        addTerminalLine('  -> Interactive, static learning portals to help kids have fun and learn.');
        addTerminalLine('• Mastodon-to-Bluesky Cross-Poster (Go)');
        addTerminalLine('  -> Lean sync tool optimized for Raspberry Pi armv7 architecture.');
        addTerminalLine('• Docker App Builder (Python/Docker)');
        addTerminalLine('  -> Securely run agent and GUI Apps in Docker containers on Linux.');
        break;
        
      case 'blog':
        addTerminalLine('=========================================================', 'highlight');
        addTerminalLine('CHRONICLES - RECENT PUBLICATIONS INDEX');
        addTerminalLine('=========================================================', 'highlight');
        if (blogEntries.length > 0) {
          blogEntries.slice(0, 5).forEach((entry, i) => {
            const title = entry.title ? entry.title.$t : 'Untitled';
            addTerminalLine(`[${i+1}] ${title}`);
          });
        } else {
          addTerminalLine('Failed to fetch blog entries. Imagine there were some really interesting posts here like:');
          addTerminalLine('• Look Back at 2025: Milestones in Healthcare Infrastructure & AI Co-Authoring');
          addTerminalLine('• The Illusion of Machine Thinking: Analyzing Collapse in Large Reasoning Models (LRMs)');
          addTerminalLine('• 20 Years of Barcamp Bangalore: Reflections on the Crucible of India’s Tech Capital');
        }
        break;
        
      case 'github':
        addTerminalLine('=========================================================', 'highlight');
        addTerminalLine('LIVE GITHUB PORTFOLIO SYNCHRONIZATION');
        addTerminalLine('=========================================================', 'highlight');
        addTerminalLine(`Node Connection: github.com/the100rabh`);
        addTerminalLine(`Public Repositories : ${githubData.repos}`);
        addTerminalLine(`Cumulative Stars     : ${githubData.stars}`);
        addTerminalLine(`Follower Nodes       : ${githubData.followers}`);
        break;
        
      case 'clear':
        termOutput.empty();
        break;
        
      default:
        addTerminalLine(`Command not found: "${cmd}". Type "help" to view query commands.`, 'error');
    }
  }

  // Handle command submission
  termInput.on('keydown', function(e) {
    if (e.key === 'Enter') {
      const val = $(this).val();
      interpretCommand(val);
      $(this).val('');
    }
  });

  // Welcome terminal message
  addTerminalLine('Bits & Pulse Terminal Interface loaded.', 'system');
  addTerminalLine('Type "help" to start querying systems, or click "Pulse Mode" above to exit.', 'normal');
});
