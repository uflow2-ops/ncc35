const NEIS_API_KEY = CLASS_CONFIG.neisApiKey;
const DAHANDIN_API_KEY = CLASS_CONFIG.dahandinApiKey;
const WEATHER_KEY = CLASS_CONFIG.weatherKey;

// 개인 정보 보호를 위해 studentData는 localStorage에서 먼저 로드합니다.
// localStorage에 없으면 CLASS_CONFIG.studentData (이제 빈 배열)를 사용합니다.
CLASS_CONFIG.studentData = JSON.parse(localStorage.getItem('studentData_v1')) || CLASS_CONFIG.studentData;
const { studentData, subjects, subIcons, defaultMarqueeMsg, school, weatherGrid, alarmSoundUrl } = CLASS_CONFIG; // 이제 studentData는 로드된 값 또는 빈 배열
const { bugPool, wheelItems } = CLASS_DATA;
const STUDENT_COUNT = studentData.length; // studentData가 로드된 후 길이를 계산

let viewDate = new Date();
        let weeklyTT = JSON.parse(localStorage.getItem('weeklyTT_v7')) || { "월": Array(6).fill().map(()=>({s:"-", m:false})), "화": Array(6).fill().map(()=>({s:"-", m:false})), "수": Array(6).fill().map(()=>({s:"-", m:false})), "목": Array(6).fill().map(()=>({s:"-", m:false})), "금": Array(6).fill().map(()=>({s:"-", m:false})) };
        let classTimes = JSON.parse(localStorage.getItem('classTimes_v7')) || ["09:00", "09:50", "10:40", "11:30", "13:00", "13:40"];
        let orderRef = JSON.parse(localStorage.getItem('order_v5')) || { baseDate: "2026-03-30", startIdx: 0 };
        let cookieGoal = parseInt(localStorage.getItem('cookieGoal_v5')) || 500;
        let routineMsgs = JSON.parse(localStorage.getItem('routine_msgs_v1')) || { morning: "1. 안내장 제출\n2. 오늘 교과서 준비\n3. 우유 당번 우유 가져오기\n4. 책 읽기", break1: "1. 우유 마시기\n2. 화장실 다녀오기" };
        let routineDismissed = { morning: false, break1: false };
        let lastCheckedDay = new Date().getDate();
        let currentActiveRoutineType = "";
        let temporaryTT = JSON.parse(localStorage.getItem('temporaryTT_v1')) || {}, homeInterval;

        function toLocalDateStr(d) {
            return d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0');
        }
        function toLocalYmdCompact(d) {
            return d.getFullYear() + (d.getMonth() + 1).toString().padStart(2, '0') + d.getDate().toString().padStart(2, '0');
        }
        function isViewDateToday(d) {
            return toLocalDateStr(d) === toLocalDateStr(new Date());
        }

        let clockFormat = localStorage.getItem('clockFormat_v1') || '12';
        let myTimerInt = null, myTimerSec = 0;
        let myAlarmTime = null; 

        let milkDrinkers = JSON.parse(localStorage.getItem('milkDrinkers_v1')) || studentData.map(s => s.code);
        let milkOrderRef = JSON.parse(localStorage.getItem('milkOrder_v1')) || { baseDate: "2026-03-30", startIdx: 0 };
        let alarmOffFlags = JSON.parse(localStorage.getItem('alarmOffFlags_v1')) || Array(6).fill(false);
        let homeMissionText = localStorage.getItem('home_mission_v1') || "📍 책상 줄 맞추기\n📍 바닥 쓰레기 줍기\n📍 내일 배울 교과서 및 내 자리 정리";
        let creativeMemo = JSON.parse(localStorage.getItem('creativeMemo_v1')) || {};
        let creativeMemoEditIdx = null;
        let soundSettings = JSON.parse(localStorage.getItem('soundSettings_v1')) || { volume: 0.7, bell: true, timer: true, celebration: true, tick: true };
        let marqueeRestoreTimer = null;
        let lastDismissedAlarmIdx = -1; // 사용자가 수동으로 닫은 알람의 인덱스 저장
        let currentAlarmIdx = -1;      // 현재 추적 중인 가장 가까운 알람 인덱스
        let weatherWarningMsg = "";    // 기상 특보 메시지 저장용

        // 소음 관리 변수
        let noiseStream = null, noiseAnalyser = null, noiseDataArray = null;
        let noiseStrikes = 0;          // 경고 누적 횟수
        let noiseHighStartTime = 0;    // 소음이 기준치를 넘기 시작한 시간
        let isNoiseMonitoring = false;
        let noiseThreshold = parseInt(localStorage.getItem('noiseThreshold_v1')) || 55; // 소음 기준치

        let lunchAutoOpened = false;
        let lunchResultShown = false;
        const STORAGE_KEY = '3_5_science_garden_v2';

        let gameData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        let currentAPI_Totals = {};
        
        let cookieEarnDates = JSON.parse(localStorage.getItem('cookieEarnDates_v1')) || {};
        let isFirstSync = true;

        // --- 틱 사운드용 오디오 컨텍스트 (브라우저 내장) ---
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let lastTickSecond = -1;

        // 브라우저 정책 준수: 사용자 첫 클릭 시 오디오 컨텍스트 재개
        document.addEventListener('click', () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
        }, { once: true });

        function playTickSound() {
            if (!soundSettings.tick) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1 * soundSettings.volume, audioCtx.currentTime);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
        }

        function applySoundVolume() {
            const audio = document.getElementById('alarmSound');
            if (audio) audio.volume = soundSettings.volume;
        }
        function saveSoundSettings() {
            soundSettings.volume = parseFloat(document.getElementById('sound-volume').value);
            soundSettings.bell = document.getElementById('sound-bell').checked;
            soundSettings.timer = document.getElementById('sound-timer').checked;
            soundSettings.celebration = document.getElementById('sound-celebration').checked;
            soundSettings.tick = document.getElementById('sound-tick').checked;
            localStorage.setItem('soundSettings_v1', JSON.stringify(soundSettings));
            
            const ntInput = document.getElementById('noise-threshold-input');
            if (ntInput) {
                noiseThreshold = parseInt(ntInput.value);
                localStorage.setItem('noiseThreshold_v1', noiseThreshold);
            }
            applySoundVolume();
        }
        function loadSoundSettingsUI() {
            document.getElementById('sound-volume').value = soundSettings.volume;
            document.getElementById('sound-volume-label').innerText = Math.round(soundSettings.volume * 100) + '%';
            document.getElementById('sound-bell').checked = soundSettings.bell;
            document.getElementById('sound-timer').checked = soundSettings.timer;
            document.getElementById('sound-celebration').checked = soundSettings.celebration;
            document.getElementById('sound-tick').checked = soundSettings.tick;

            // 소음 기준치 UI 동적 추가 (이미 존재하지 않는 경우에만)
            const settingsContainer = document.querySelector('.sound-settings');
            if (settingsContainer && !document.getElementById('noise-threshold-input')) {
                const html = `
                    <div style="border-top: 1px dashed #ccc; margin-top: 10px; padding-top: 10px;">
                        <label style="display:block; margin-bottom:5px;">🔇 소음 감지 민감도: <b id="noise-threshold-label">${noiseThreshold}</b></label>
                        <input type="range" id="noise-threshold-input" min="30" max="85" value="${noiseThreshold}" 
                               style="width:100%;" oninput="document.getElementById('noise-threshold-label').innerText = this.value">
                        <small style="color: #666; font-size:0.9rem;">(값이 낮을수록 더 예민하게 감지합니다. 보통 50~60 권장)</small>
                    </div>
                `;
                settingsContainer.insertAdjacentHTML('beforeend', html);
            } else if (document.getElementById('noise-threshold-input')) {
                document.getElementById('noise-threshold-input').value = noiseThreshold;
                document.getElementById('noise-threshold-label').innerText = noiseThreshold;
            }
        }
        function playAlarmSound(type) {
            if (type === 'bell' && !soundSettings.bell) return;
            if (type === 'timer' && !soundSettings.timer) return;
            if (type === 'celebration' && !soundSettings.celebration) return;
            const audio = document.getElementById('alarmSound');
            if (!audio) return;
            audio.volume = soundSettings.volume;
            audio.play().catch(function() {});
        }
        function getActiveMarqueeText() {
            if (weatherWarningMsg) return weatherWarningMsg;
            const saved = getTodayRoulette();
            return saved ? saved.title : defaultMarqueeMsg;
        }
        function showMarqueeMessage(msg, durationMs) {
            const marquee = document.getElementById('top-msg');
            marquee.innerText = msg;
            if (marqueeRestoreTimer) clearTimeout(marqueeRestoreTimer);
            if (durationMs && durationMs > 0) {
                marqueeRestoreTimer = setTimeout(function() {
                    marquee.innerText = getActiveMarqueeText();
                }, durationMs);
            }
        }
        function getTodayRoulette() {
            try {
                const saved = JSON.parse(localStorage.getItem('roulette_daily_v1') || 'null');
                if (saved && saved.date === toLocalDateStr(new Date())) return saved;
            } catch (e) {}
            return null;
        }
        function saveTodayRoulette(data) {
            localStorage.setItem('roulette_daily_v1', JSON.stringify(Object.assign({ date: toLocalDateStr(new Date()) }, data)));
        }
        function applyLucky369Effect() {
            const luckyNumbers = [3, 6, 9, 13, 16, 19];
            const orderDivs = document.querySelectorAll('#dynamic-content div');
            luckyNumbers.forEach(function(num) {
                const targetDiv = orderDivs[num - 1];
                if (targetDiv) {
                    targetDiv.style.animation = 'luckySparkleBg 1.5s infinite ease-in-out';
                    targetDiv.style.color = '#d32f2f';
                    targetDiv.style.fontWeight = 'bold';
                    if (!targetDiv.innerHTML.includes('✨')) targetDiv.innerHTML += ' ✨';
                }
            });
        }
        function clearLucky369Effect() {
            document.querySelectorAll('#dynamic-content div').forEach(function(div) {
                div.style.animation = '';
                div.style.background = '';
                div.style.color = '';
                div.style.fontWeight = '';
                div.innerHTML = div.innerHTML.replace(' ✨', '');
            });
        }
        function markRouletteComplete(saved) {
            const sideBtn = document.getElementById('eventRouletteBtn');
            if (!sideBtn) return;
            sideBtn.innerText = '✅ 오늘 뽑기 완료';
            sideBtn.style.background = '#4caf50';
            sideBtn.style.boxShadow = '0 4px 0 #388e3c';
            sideBtn.onclick = function() { showMarqueeMessage(saved.alert, 0); };
        }
        function restoreRouletteState() {
            const saved = getTodayRoulette();
            if (!saved) {
                document.getElementById('top-msg').innerText = defaultMarqueeMsg;
                clearLucky369Effect();
                const sideBtn = document.getElementById('eventRouletteBtn');
                if (sideBtn) {
                    sideBtn.innerText = '🎰 오늘의 이벤트 뽑기';
                    sideBtn.style.background = '#e91e63';
                    sideBtn.style.boxShadow = '0 4px 0 #ad1457';
                    sideBtn.onclick = openRouletteModal;
                }
                return;
            }
            document.getElementById('top-msg').innerHTML = saved.title;
            markRouletteComplete(saved);
            if (saved.isLucky369) applyLucky369Effect();
        }
        function showGoalCelebration(total) {
            const overlay = document.getElementById('goalCelebration');
            document.getElementById('goalCelebrationText').innerHTML = '🎉 우리 반 쿠키 ' + total + '개!<br>목표 ' + cookieGoal + '개 달성! 🎉';
            overlay.style.display = 'flex';
            spawnConfetti();
            playAlarmSound('celebration');
            setTimeout(function() { overlay.style.display = 'none'; }, 8000);
        }
        function spawnConfetti() {
            const emojis = ['🎉', '🍪', '⭐', '🦋', '🌸', '✨'];
            for (let i = 0; i < 30; i++) {
                const el = document.createElement('div');
                el.className = 'confetti-piece';
                el.innerText = emojis[i % emojis.length];
                el.style.left = Math.random() * 100 + 'vw';
                el.style.animationDelay = (Math.random() * 2) + 's';
                document.body.appendChild(el);
                setTimeout(function() { el.remove(); }, 4000);
            }
        }
        function spawnSuperConfetti() {
            const colors = ['#FFD700', '#FFCC00', '#FFB300', '#F9A602', '#E6B800']; // 다양한 톤의 골드 컬러
            const emojis = ['✨', '⭐', '💰', '👑', '📀', '💎'];
            for (let i = 0; i < 120; i++) { // 120개로 대폭 증량
                const el = document.createElement('div');
                el.className = 'confetti-piece';
                el.innerText = emojis[i % emojis.length];
                el.style.color = colors[Math.floor(Math.random() * colors.length)];
                el.style.left = Math.random() * 100 + 'vw';
                el.style.fontSize = (Math.random() * 1.5 + 1.5) + 'rem'; // 크기 다양화
                el.style.animationDuration = (Math.random() * 3 + 2) + 's'; // 낙하 속도 다양화
                el.style.animationDelay = (Math.random() * 4) + 's'; // 쏟아지는 시간차
                document.body.appendChild(el);
                setTimeout(function() { el.remove(); }, 6000);
            }
        }

        function init() {
            document.getElementById('alarmSound').src = alarmSoundUrl;
            applySoundVolume();
            setupRouletteUI();
            setupNoiseElements(); // 소음 UI 요소 생성
            restoreRouletteState();
            renderAll(); fetchWeather(); fetchMeal(); drawGardenBackground(); syncCookies();
            setInterval(function() {
                const now = new Date();
                checkDateTransition(now);
                updateMainClock(now); checkAlarms(now); checkCustomAlarm(now); checkRoutines(now); checkLunchEvent(now);
            }, 1000);
            setInterval(syncCookies, 60000);
            setInterval(fetchWeather, 600000);
        }

        function updateMainClock(now) {
            const h = now.getHours();
            const m = now.getMinutes().toString().padStart(2, '0');
            const s = now.getSeconds().toString().padStart(2, '0');
            const ampmEl = document.getElementById('clock-ampm');
            const clockEl = document.getElementById('digital-clock');
            if (clockFormat === '12') {
                ampmEl.innerText = h >= 12 ? '오후' : '오전';
                let displayH = h % 12; if (displayH === 0) displayH = 12;
                clockEl.innerText = `${displayH.toString().padStart(2, '0')}:${m}:${s}`;
            } else {
                ampmEl.innerText = '24H'; clockEl.innerText = `${h.toString().padStart(2, '0')}:${m}:${s}`;
            }
        }
        function toggleClockFormat() { clockFormat = (clockFormat === '12') ? '24' : '12'; localStorage.setItem('clockFormat_v1', clockFormat); updateMainClock(new Date()); }

        function startCustomTimer(sec) {
            clearInterval(myTimerInt); myTimerSec = sec;
            const display = document.getElementById('active-tool-display'); display.style.display = 'block';
            myTimerInt = setInterval(() => {
                myTimerSec--;
                const mm = Math.floor(myTimerSec / 60).toString().padStart(2, '0'); const ss = (myTimerSec % 60).toString().padStart(2, '0');
                display.innerText = `⏱️ 타이머: ${mm}:${ss}`;
                if (myTimerSec <= 0) { stopCustomTimer(); fireAlertOverlay("⏱️ 설정한 시간이 다 되었습니다!"); }
            }, 1000);
            closeAllModals();
        }
        function startCustomTimerPrompt() { const min = prompt("몇 분으로 설정하시겠습니까? (숫자만 입력)", "10"); if(min && !isNaN(min)) startCustomTimer(parseInt(min) * 60); }
        function stopCustomTimer() { clearInterval(myTimerInt); document.getElementById('active-tool-display').style.display = 'none'; if(!myAlarmTime) closeAllModals(); }

        function setCustomAlarm() {
            const timeVal = document.getElementById('custom-alarm-input').value; 
            if (timeVal) { myAlarmTime = timeVal; document.getElementById('active-tool-display').style.display = 'block'; document.getElementById('active-tool-display').innerText = `🔔 알람: ${myAlarmTime}`; closeAllModals(); }
        }
        function clearCustomAlarm() { myAlarmTime = null; document.getElementById('active-tool-display').style.display = 'none'; closeAllModals(); }
        function checkCustomAlarm(now) {
            if(!myAlarmTime) return;
            const curH = now.getHours().toString().padStart(2, '0'); const curM = now.getMinutes().toString().padStart(2, '0'); const curS = now.getSeconds().toString().padStart(2, '0');
            const timeStr = myAlarmTime.length > 5 ? `${curH}:${curM}:${curS}` : `${curH}:${curM}`; 
            if (timeStr === myAlarmTime) { myAlarmTime = null; document.getElementById('active-tool-display').style.display = 'none'; fireAlertOverlay("🔔 약속한 시간입니다!"); }
        }
        function fireAlertOverlay(text) { document.getElementById('bigAlertText').innerHTML = '<span style="font-size:6rem">' + text + '</span>'; document.getElementById('bigAlert').style.display = 'flex'; playAlarmSound('timer'); }

        function toggleHomeLayer(show) {
            const l = document.getElementById('homeLayer'), t = document.getElementById('homeTimer');
            const mission = document.getElementById('homeMission'), stopS = document.getElementById('stopSign');
            clearInterval(homeInterval);
            if(show) {
                l.classList.add('show');
                mission.innerHTML = homeMissionText.replace(/\n/g, '<br>'); 
                t.style.display = 'block'; mission.style.display = 'block'; stopS.style.display = 'none';
                let c = 60; t.innerText = c;
                homeInterval = setInterval(() => {
                    c--; t.innerText = c;
                    if(c <= 0) { clearInterval(homeInterval); t.style.display = 'none'; mission.style.display = 'none'; stopS.style.display = 'block'; playAlarmSound('bell'); }
                }, 1000);
            } else { l.classList.remove('show'); document.getElementById('alarmSound').pause(); }
        }

        async function syncCookies() {
            let grandTotal = 0; let earners = []; const prevTotals = JSON.parse(localStorage.getItem('prev_api_totals') || '{}');
            await Promise.all(studentData.map(async (s) => {
                try {
                    const res = await (await fetch(`https://api.dahandin.com/openapi/v1/get/student/total?code=${s.code}`, { headers: {"X-API-Key": DAHANDIN_API_KEY} })).json();
                    if(res.result) { 
                        const current = res.data.totalCookie;
                        const todayStr = new Date().toLocaleDateString('sv-SE');
                        
                        // ✨ 쿠키가 예전보다 늘어났다면 현재 시간(밀리초) 기록!
                        if(prevTotals[s.code] !== undefined && current > prevTotals[s.code]) { 
                            if(!isFirstSync) earners.push(s.name); 
                            cookieEarnDates[s.code] = Date.now();
                            localStorage.setItem('cookieEarnDates_v1', JSON.stringify(cookieEarnDates));
                        } else if (prevTotals[s.code] === undefined) {
                            // 처음 켰을 때 다 굶어 죽어있으면 슬프니까 지금 먹은 걸로 초기 셋팅
                            cookieEarnDates[s.code] = Date.now();
                            localStorage.setItem('cookieEarnDates_v1', JSON.stringify(cookieEarnDates));
                        }
                        
                        prevTotals[s.code] = current; currentAPI_Totals[s.code] = current; grandTotal += current; 
                    }
                } catch(e) {}
            }));
            localStorage.setItem('prev_api_totals', JSON.stringify(prevTotals)); isFirstSync = false;
            if (earners.length > 0) {
                showMarqueeMessage('🎉 축하합니다! ' + earners.join(', ') + ' 학생이 쿠키를 획득했습니다! 🎉', 60000);
            }
            
            const pct = Math.min(100, Math.floor((grandTotal / cookieGoal) * 100));
            document.getElementById('pct-text').innerText = pct + '%'; document.getElementById('current-total').innerText = grandTotal;
            const pile = document.getElementById('cookie-pile');
            pile.style.height = pct + '%'; 
            
            // 입체적인 쿠키 쌓기 연출 (옆면 및 다양한 각도)
            let cookiesHtml = '';
            const cookieCount = Math.floor(pct / 1.5); 
            for(let i=0; i<cookieCount; i++) {
                const rotateZ = (Math.random() * 360).toFixed(1); // 무작위 회전
                const skew = (Math.random() * 20 - 10).toFixed(1); // 약간의 뒤틀림
                const shiftX = (Math.random() * 20 - 10).toFixed(1); // 좌우 편차
                
                // 3D 효과: 일부는 정면, 일부는 옆면(납작하게) 보이도록 scaleY 조절
                const perspectiveScale = (0.3 + Math.random() * 0.7).toFixed(2);
                const brightness = (0.8 + Math.random() * 0.4).toFixed(2); // 조명 차이

                cookiesHtml += `<span style="display:inline-block; font-size:1.8rem; transform: rotateZ(${rotateZ}deg) scaleY(${perspectiveScale}) skew(${skew}deg) translateX(${shiftX}px); margin:-8px; filter: brightness(${brightness}) drop-shadow(2px 3px 2px rgba(0,0,0,0.4));">🍪</span>`;
            }
            pile.innerHTML = cookiesHtml;
            const goalKey = 'goal_celebrated_' + toLocalDateStr(new Date());
            if (pct >= 100 && !localStorage.getItem(goalKey)) {
                localStorage.setItem(goalKey, '1');
                showGoalCelebration(grandTotal);
                showMarqueeMessage('🏆 축하합니다! 우리 반 전체 쿠키 목표 ' + cookieGoal + '개를 달성했어요! 🏆', 120000);
            }
            renderBugGrid(); renderGarden();
        }

        function exportAllData() { 
            let exportObj = {};
            // 특정 키만 가져오는 대신 localStorage의 모든 데이터를 수집 (급식 투표 데이터 포함)
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                exportObj[key] = localStorage.getItem(key);
            }
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj)); 
            const dlAnchorElem = document.createElement('a'); dlAnchorElem.setAttribute("href", dataStr); dlAnchorElem.setAttribute("download", `3-5반_통합데이터_${new Date().toLocaleDateString()}.json`); document.body.appendChild(dlAnchorElem); dlAnchorElem.click(); dlAnchorElem.remove(); 
            alert("전체 데이터가 안전하게 저장되었습니다!"); 
        }
        function importAllData(event) { 
            const file = event.target.files[0]; if (!file) return; 
            const reader = new FileReader(); 
            reader.onload = function(e) { 
                try { 
                    const importedData = JSON.parse(e.target.result); 
                    for(let key in importedData) { if(importedData[key]) localStorage.setItem(key, importedData[key]); }
                    alert("데이터가 완벽히 복구되었습니다! 새로고침 합니다."); location.reload(); 
                } catch(err) { alert("파일 형식이 잘못되었습니다."); } 
            }; reader.readAsText(file); 
        }

    function checkDateTransition(now) {
        const currentDay = now.getDate();
        if (currentDay !== lastCheckedDay) {
            // 실제 날짜가 바뀌었을 때 (자정 경과)
            lastCheckedDay = currentDay;
            routineDismissed = { morning: false, break1: false };
            lunchAutoOpened = false;
            lunchResultShown = false;
            lastDismissedAlarmIdx = -1; // 알람 닫기 기록 초기화
            
            viewDate = new Date(now); // 화면의 기준 날짜를 새로운 '오늘'로 업데이트
            renderAll();
            fetchMeal();
            fetchWeather();
            restoreRouletteState(); // 룰렛 및 전광판 메시지 초기화
        }
    }

        function checkRoutines(now) {
            const curTimeNum = now.getHours() * 100 + now.getMinutes();
            const isMorning = (curTimeNum >= 830 && curTimeNum < 900);

            // [모든 쉬는 시간 감지] 수업 시작 10분 전 및 점심 시간(12:10~13:00)
            let isAnyBreak = isMorning;
            classTimes.forEach(timeStr => {
                const [h, m] = timeStr.split(':').map(Number);
                const targetTimeNum = h * 100 + m;
                let sh = h, sm = m - 10;
                if (sm < 0) { sh--; sm += 60; }
                const startTimeNum = sh * 100 + sm;
                
                if (timeStr === "13:00") { // 점심 시간 특별 연장
                    if (curTimeNum >= 1210 && curTimeNum < 1300) isAnyBreak = true;
                } else if (curTimeNum >= startTimeNum && curTimeNum < targetTimeNum) {
                    isAnyBreak = true;
                }
            });

            // 소음 측정기 자동 제어 (수동으로 켠 게 아닐 때만 자동 종료)
            if (isAnyBreak) {
                if (!isNoiseMonitoring) startNoiseMonitoring();
            } else {
                const manualBtn = document.getElementById('manualNoiseBtn');
                if (isNoiseMonitoring && (!manualBtn || !manualBtn.innerText.includes('중지'))) {
                    stopNoiseMonitoring();
                }
            }

            // 안내 배너 로직 (기존 아침 및 1교시 유지)
            if (isMorning) { 
                if (!routineDismissed.morning && !document.getElementById('routineBanner').classList.contains('show')) {
                    showRoutineBanner("🌅 아침 활동 안내", routineMsgs.morning, 'morning');
                } 
            } else if (curTimeNum === 900 && currentActiveRoutineType === 'morning') {
                closeRoutineBanner();
            }

            const isBreak1 = (curTimeNum >= 940 && curTimeNum < 950);
            if (isBreak1) { 
                if (!routineDismissed.break1 && !document.getElementById('routineBanner').classList.contains('show')) {
                    showRoutineBanner("🥛 1교시 쉬는시간", routineMsgs.break1, 'break1');
            } else if (curTimeNum === 950 && currentActiveRoutineType === 'break1') {
                closeRoutineBanner();
            }
        }

        function setupNoiseElements() {
            const bar = `<div id="noise-monitor-bar" class="noise-monitor-bar"><div id="noise-fill" class="noise-fill"></div></div>`;
            const warning = `<div id="noise-warning" class="noise-warning-indicator">⚠️ 너무 시끄러워요!</div>`;
            const strikes = `<div id="noise-strikes" class="noise-strike-dots"><div class="strike-dot"></div><div class="strike-dot"></div><div class="strike-dot"></div></div>`;
            document.body.insertAdjacentHTML('beforeend', bar + warning + strikes);
        }

        async function startNoiseMonitoring() {
            if (isNoiseMonitoring) return;
            try {
                if (audioCtx.state === 'suspended') await audioCtx.resume();
                noiseStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const source = audioCtx.createMediaStreamSource(noiseStream);
                noiseAnalyser = audioCtx.createAnalyser();
                noiseAnalyser.fftSize = 256;
                noiseAnalyser.smoothingTimeConstant = 0.9; // 소음 바의 움직임을 더 부드럽게 보정
                source.connect(noiseAnalyser);
                noiseDataArray = new Uint8Array(noiseAnalyser.frequencyBinCount);
                isNoiseMonitoring = true;
                noiseStrikes = 0;
                document.getElementById('noise-monitor-bar').style.display = 'block';
                document.getElementById('noise-strikes').style.display = 'flex';
                updateNoiseStrikesUI();
                updateNoiseMonitoring();
            } catch (err) { console.error("마이크 권한 필요:", err); }
        }

        function stopNoiseMonitoring() {
            isNoiseMonitoring = false;
            if (noiseStream) { noiseStream.getTracks().forEach(t => t.stop()); noiseStream = null; }
            document.getElementById('noise-monitor-bar').style.display = 'none';
            document.getElementById('noise-warning').style.display = 'none';
            document.getElementById('noise-strikes').style.display = 'none';
        }

        function toggleManualNoiseMonitoring() {
            const btn = document.getElementById('manualNoiseBtn');
            if (!isNoiseMonitoring) {
                startNoiseMonitoring();
                if (btn) {
                    btn.innerText = '🔊 소음 측정 중지';
                    btn.style.background = '#f44336';
                }
            } else {
                stopNoiseMonitoring();
                if (btn) {
                    btn.innerText = '🔇 소음 측정 시작';
                    btn.style.background = '#607d8b';
                }
            }
        }

        function updateNoiseMonitoring() {
            if (!isNoiseMonitoring) return;
            noiseAnalyser.getByteFrequencyData(noiseDataArray);
            let avg = noiseDataArray.reduce((a, b) => a + b) / noiseDataArray.length;
            let h = Math.min(100, avg * 1.5);
            
            const fill = document.getElementById('noise-fill');
            fill.style.width = h + '%';
            fill.style.background = h > 70 ? '#f44336' : (h > 40 ? '#ffeb3b' : '#4caf50');

            if (avg > noiseThreshold) {
                if (!noiseHighStartTime) noiseHighStartTime = Date.now();
                if (Date.now() - noiseHighStartTime > 3000) { // 3초 유지 시
                    noiseStrikes++;
                    noiseHighStartTime = 0;
                    updateNoiseStrikesUI();
                    triggerNoiseWarningEffect();
                    if (noiseStrikes >= 3) return forceEndBreakByNoise();
                }
            } else { noiseHighStartTime = 0; }
            requestAnimationFrame(updateNoiseMonitoring);
        }

        function updateNoiseStrikesUI() {
            const dots = document.querySelectorAll('.strike-dot');
            dots.forEach((dot, i) => {
                if (i < noiseStrikes) dot.classList.add('active');
                else dot.classList.remove('active');
            });
        }

        function triggerNoiseWarningEffect() {
            const warn = document.getElementById('noise-warning');
            warn.style.display = 'block';
            playAlarmSound('tick');
            setTimeout(() => { warn.style.display = 'none'; }, 2000);
        }

        function forceEndBreakByNoise() {
            stopNoiseMonitoring();
            closeRoutineBanner();
            fireAlertOverlay("🚫 소음 기준 초과! 즉시 정숙하세요. 쉬는 시간을 종료합니다.");
            // 정지 표지판 강제 표시 (toggleHomeLayer 로직 활용)
            const l = document.getElementById('homeLayer');
            const t = document.getElementById('homeTimer'), mission = document.getElementById('homeMission'), stopS = document.getElementById('stopSign');
            l.classList.add('show');
            t.style.display = 'none'; mission.style.display = 'none'; stopS.style.display = 'block';
            playAlarmSound('bell');
        }

        function showRoutineBanner(title, text, type) { document.getElementById('routineTitle').innerText = title; document.getElementById('routineText').innerHTML = text.replace(/\n/g, '<br>'); document.getElementById('routineBanner').classList.add('show'); currentActiveRoutineType = type; }
        function closeRoutineBanner() { document.getElementById('routineBanner').classList.remove('show'); if(currentActiveRoutineType) { routineDismissed[currentActiveRoutineType] = true; currentActiveRoutineType = ""; } }
        
        function openRoutineConfig() { 
            document.getElementById('morning-text').value = routineMsgs.morning; 
            document.getElementById('break1-text').value = routineMsgs.break1; 
            document.getElementById('home-mission-text').value = homeMissionText;
            loadSoundSettingsUI();
            document.getElementById('routineConfigModal').style.display = 'flex'; 
        }
        function saveRoutineConfig() { 
            routineMsgs.morning = document.getElementById('morning-text').value; 
            routineMsgs.break1 = document.getElementById('break1-text').value; 
            homeMissionText = document.getElementById('home-mission-text').value;
            saveSoundSettings();
            localStorage.setItem('routine_msgs_v1', JSON.stringify(routineMsgs)); 
            localStorage.setItem('home_mission_v1', homeMissionText);
            closeAllModals(); 
            if (document.getElementById('routineBanner').classList.contains('show')) { 
                if (currentActiveRoutineType === 'morning') document.getElementById('routineText').innerHTML = routineMsgs.morning.replace(/\n/g, '<br>'); 
                if (currentActiveRoutineType === 'break1') document.getElementById('routineText').innerHTML = routineMsgs.break1.replace(/\n/g, '<br>'); 
            } 
        }

        function renderAll() {
            const dk = viewDate.toLocaleDateString('sv-SE'), dNames = ["일","월","화","수","목","금","토"];
            const dayNum = viewDate.getDay(), dayName = (dayNum === 0 || dayNum === 6) ? "월" : dNames[dayNum];
            document.getElementById('today-date').innerText = viewDate.toLocaleDateString('ko-KR', {month:'long', day:'numeric', weekday:'short'});
            document.getElementById('tt-title').innerText = `${dayName}요일 시간표`;

            let list = temporaryTT[dk] || (weeklyTT[dayName] || Array(6).fill({s:"-", m:false}));
document.getElementById('display-tt').innerHTML = list.map((obj, i) => {
    const sName = typeof obj === 'string' ? obj : obj.s; 
    const isMove = typeof obj === 'object' && obj.m;
    const moveTag = isMove ? `<span style="font-size:1.1rem; background:#03a9f4; color:white; padding:2px 8px; border-radius:10px; margin-left:10px; white-space:nowrap;">이동</span>` : '';
    
    return sName === "-" ? "" : (() => {
        let memoHtml = '';
        if (sName === "창체") {
            const dateKey = viewDate.toLocaleDateString('sv-SE');
            const memo = creativeMemo[`${dateKey}-${i}`] || "활동 내용 입력";
            // 메모 글자 크기를 1.2rem으로 줄이고 스타일을 다듬었습니다.
            memoHtml = `
                <div class="creative-memo-chip" onclick="event.stopPropagation(); editCreativeMemo(${i})">
                    📝 ${memo}
                </div>`;
        }

        // justify-content: center로 전체 항목을 가운데 정렬
        return `
            <div class="subject-item" style="display: flex; align-items: center; justify-content: center; padding: 8px 15px;" onclick="openQuickSubModal(${i})">
                <div style="display: flex; align-items: center; flex-shrink: 0;">
                    <span style="width: 35px; font-size: 1.6rem; color: #888; text-align: right; margin-right: 15px;">${i+1}</span>
                    <span style="font-size: 2.5rem; min-width: 130px; text-align: left; letter-spacing: -1px;">${subIcons[sName]||'⭐'} ${sName}</span>
                    ${moveTag}
                </div>
                ${memoHtml}
            </div>`;
    })();
}).join('');

            // [순서] 계산 (기존 로직 유지)
            let workingDays = 0; let cur = new Date(orderRef.baseDate); cur.setHours(0,0,0,0); let target = new Date(viewDate.toDateString()); target.setHours(0,0,0,0);
            if (cur < target) { let temp = new Date(cur); while(temp < target) { if(temp.getDay() !== 0 && temp.getDay() !== 6) workingDays++; temp.setDate(temp.getDate() + 1); } } 
            else if (cur > target) { let temp = new Date(target); while(temp < cur) { if(temp.getDay() !== 0 && temp.getDay() !== 6) workingDays--; temp.setDate(temp.getDate() + 1); } }

            let todayStartIdx = 0;
            if (STUDENT_COUNT > 0) {
                todayStartIdx = (orderRef.startIdx + workingDays) % STUDENT_COUNT;
                if (todayStartIdx < 0) todayStartIdx += STUDENT_COUNT;
            }

            const orderList = studentData.length > 0 
                ? studentData.map((_, i) => `<div style="padding:6px; border-bottom:1px solid #eee;">${i+1}. ${studentData[(todayStartIdx + i) % STUDENT_COUNT].name}</div>`).join('')
                : `<div style="padding:20px; color:#888; font-size:1.2rem;">📢 설정에서 학생 데이터를<br>불러와 주세요. 📥</div>`;
            
            document.getElementById('dynamic-content').innerHTML = orderList;
            
            // [우유 당번] 계산 (별도 날짜 계산 분리 + 2명씩 건너뛰기)
            let milkWorkingDays = 0; 
            let milkCur = new Date(milkOrderRef.baseDate); milkCur.setHours(0,0,0,0); 
            if (milkCur < target) { 
                let temp = new Date(milkCur); 
                while(temp < target) { if(temp.getDay() !== 0 && temp.getDay() !== 6) milkWorkingDays++; temp.setDate(temp.getDate() + 1); } 
            } else if (milkCur > target) { 
                let temp = new Date(target); 
                while(temp < milkCur) { if(temp.getDay() !== 0 && temp.getDay() !== 6) milkWorkingDays--; temp.setDate(temp.getDate() + 1); } 
            }

            const drinkers = studentData.filter(s => milkDrinkers.includes(s.code));
            if (drinkers.length > 0) {
                let startIndexInDrinkers = drinkers.findIndex(s => s === studentData[milkOrderRef.startIdx]);
                if (startIndexInDrinkers === -1) startIndexInDrinkers = 0; 
                
                // 여기서 milkWorkingDays에 2를 곱해서 하루 지날때마다 2명씩 점프하도록 수정! (음수 처리 포함)
                let todayMilkIdx = (startIndexInDrinkers + (milkWorkingDays * 2)) % drinkers.length;
                if (todayMilkIdx < 0) todayMilkIdx = (todayMilkIdx % drinkers.length) + drinkers.length;
                
                let mIdx1 = todayMilkIdx; 
                let mIdx2 = (todayMilkIdx + 1) % drinkers.length;
                if (drinkers.length === 1) mIdx2 = mIdx1;
                
                document.getElementById('milk-display').innerText = `${drinkers[mIdx1].name}, ${drinkers[mIdx2].name}`;
            } else { document.getElementById('milk-display').innerText = "당번 없음"; }
        }

        function openMilkConfig() {
            let h = '<div style="margin-bottom:15px; background:#fff9c4; padding:15px; border-radius:10px; text-align:center;">';
            h += `<b style="font-size:1.3rem;">📌 오늘 우유 당번 시작:</b> <select id="milkStartSelect" style="font-size:1.3rem; padding:5px; font-family:'Jua'; margin-left:10px; border:2px solid #ccc; border-radius:5px;">`;
            studentData.forEach((s, i) => { h += `<option value="${i}" ${milkOrderRef.startIdx === i ? 'selected' : ''}>${s.name}</option>`; });
            h += `</select></div><div id="milk-chk-list" style="display:grid; grid-template-columns:repeat(4,1fr); gap:10px; text-align:left; font-size:1.3rem;">`;
            studentData.forEach(s => { h += `<label><input type="checkbox" id="milk-chk-${s.code}" ${milkDrinkers.includes(s.code)?'checked':''}> ${s.name}</label>`; });
            h += `</div>`; document.getElementById('milkConfigModalBody').innerHTML = h; document.getElementById('milkConfigModal').style.display = 'flex';
        }

        function saveMilkConfig() {
            milkDrinkers = studentData.filter(s => document.getElementById(`milk-chk-${s.code}`).checked).map(s => s.code);
            milkOrderRef = { baseDate: new Date().toLocaleDateString('sv-SE'), startIdx: parseInt(document.getElementById('milkStartSelect').value) };
            localStorage.setItem('milkDrinkers_v1', JSON.stringify(milkDrinkers)); localStorage.setItem('milkOrder_v1', JSON.stringify(milkOrderRef));
            renderAll(); closeAllModals();
        }

        function openOrderConfigModal() { document.getElementById('startStudentSelect').innerHTML = studentData.map((s,i) => `<option value="${i}">${s.name}</option>`).join(''); document.getElementById('orderConfigModal').style.display = 'flex'; }
        function saveOrderConfig() { orderRef = { baseDate: new Date().toLocaleDateString('sv-SE'), startIdx: parseInt(document.getElementById('startStudentSelect').value) }; localStorage.setItem('order_v5', JSON.stringify(orderRef)); renderAll(); closeAllModals(); }

        const getMealIcon = (n) => {
            if (n.includes("우유")) return "🥛"; if (n.includes("밥") || n.includes("죽")) return "🍚"; if (n.includes("볶음밥") || n.includes("덮밥")) return "🥘"; if (n.includes("국") || n.includes("찌개") || n.includes("탕")) return "🥣"; if (n.includes("돈가스") || n.includes("튀김") || n.includes("까스")) return "🍗"; if (n.includes("불고기") || n.includes("볶음") || n.includes("찜")) return "🍖"; if (n.includes("면") || n.includes("스파게티") || n.includes("파스타")) return "🍝"; if (n.includes("김치") || n.includes("깍두기") || n.includes("겉절이")) return "🌶️"; if (n.includes("샐러드") || n.includes("무침") || n.includes("나물")) return "🥗"; if (n.includes("떡볶이") || n.includes("떡")) return "🍢"; if (n.includes("빵") || n.includes("케이크") || n.includes("쿠키")) return "🧁"; if (n.includes("과일") || n.includes("사과") || n.includes("포도")) return "🍎"; if (n.includes("요구르트") || n.includes("쥬스") || n.includes("주스")) return "🧃"; return "🍴";
        };

        async function fetchMeal() {
            const mealList = document.getElementById('meal-list');
            const ymd = viewDate.getFullYear() + (viewDate.getMonth() + 1).toString().padStart(2, '0') + viewDate.getDate().toString().padStart(2, '0');
            try {
                const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${NEIS_API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${school.atpt}&SD_SCHUL_CODE=${school.code}&MLSV_YMD=${ymd}`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.mealServiceDietInfo) {
                    const rawMenu = data.mealServiceDietInfo[1].row[0].DDISH_NM;
                    const menu = rawMenu.replace(/[0-9. *()]/g, '').split('<br/>').filter(i => i.trim());
                    mealList.innerHTML = `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; text-align:left; padding:10px; font-size:1.6rem;">${menu.map(i => `<div>${getMealIcon(i)} ${i}</div>`).join('')}</div>`;
                } else { mealList.innerHTML = "<div style='padding-top:20px;'>🍱 오늘은 급식 정보가 없어요</div>"; }
            } catch(e) { 
                console.error("급식 데이터 로드 실패:", e);
                mealList.innerText = "급식 서버 연결 실패"; 
            }
        }

        async function fetchWeather() {
            const info = document.getElementById('weather-info'); 
            const now = new Date();
            let baseDateObj = new Date(now);
            let baseHour = now.getMinutes() < 45 ? now.getHours() - 1 : now.getHours();
            if (baseHour < 0) {
                baseHour = 23;
                baseDateObj.setDate(baseDateObj.getDate() - 1);
            }
            const baseDate = toLocalYmdCompact(baseDateObj);
            const baseTime = baseHour.toString().padStart(2, '0') + '00';
            try {
                const vRes = await fetch(`https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=${WEATHER_KEY}&pageNo=1&numOfRows=60&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${weatherGrid.nx}&ny=${weatherGrid.ny}`);
                const vData = await vRes.json(); 
                let temp = "--", skyIcon = "☀️", skyT = "맑음", pty = "0", sky = "1";
                if (vData.response?.body?.items?.item) { 
                    const items = vData.response.body.items.item; 
                    temp = items.find(i => i.category === "T1H")?.fcstValue || "--"; 
                    pty = items.find(i => i.category === "PTY")?.fcstValue || "0"; 
                    sky = items.find(i => i.category === "SKY")?.fcstValue || "1"; 
                    if (pty !== "0") { skyIcon = "☔"; skyT = "비/눈"; } 
                    else if (sky === "3") { skyIcon = "⛅"; skyT = "구름많음"; } 
                    else if (sky === "4") { skyIcon = "☁️"; skyT = "흐림"; } 
                }
                let dustHtml = "";
                try { const dRes = await fetch(`https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?serviceKey=${WEATHER_KEY}&returnType=json&numOfRows=100&pageNo=1&sidoName=${encodeURIComponent('강원')}&ver=1.0`); const dData = await dRes.json(); const chuncheonDust = dData.response?.body?.items?.find(i => i.stationName.includes("중앙로") || i.stationName.includes("석사동"));

                    const pmValue = chuncheonDust ? parseInt(chuncheonDust.pm10Value, 10) : NaN;
                    const tVal = parseFloat(temp);
                    let bgColor = "#fff9c4"; 
                    weatherWarningMsg = ""; 

                    // [종합 배경색 및 경보 메시지 결정 로직]
                    if (!isNaN(pmValue) && pmValue > 150) {
                        bgColor = "#ffebee"; weatherWarningMsg = "🚨 [미세먼지 매우나쁨] 실외 활동을 금지하고 마스크를 꼭 착용하세요! 😷";
                    } else if (!isNaN(pmValue) && pmValue > 80) {
                        bgColor = "#fff3e0"; weatherWarningMsg = "😷 [미세먼지 나쁨] 공기가 좋지 않습니다. 창문을 닫고 무리한 활동은 피하세요.";
                    } else if (pty !== "0") {
                        bgColor = "#e8eaf6";
                    } else if (!isNaN(tVal) && tVal >= 28) {
                        bgColor = "#fbe9e7";
                        if (tVal >= 33) weatherWarningMsg = "🚨 [폭염 경보] 기온이 매우 높습니다! 실외 활동은 금지하고 물을 자주 마셔요. 🥤";
                        else weatherWarningMsg = "☀️ [폭염 주의] 날씨가 많이 무덥습니다. 시원한 곳에서 충분히 휴식하세요. 🧊";
                    } else if (!isNaN(tVal) && tVal <= 5) {
                        bgColor = "#e0f7fa";
                        if (tVal <= -12) weatherWarningMsg = "🚨 [한파 경보] 영하의 강력한 추위입니다! 옷을 따뜻하게 입고 감기 조심하세요! 🧣";
                        else weatherWarningMsg = "❄️ [한파 주의] 날씨가 매우 춥습니다. 체온 유지에 신경 써주세요.";
                    } else if (sky === "1") {
                        bgColor = "#e3f2fd";
                    } else if (!isNaN(pmValue) && pmValue <= 30) {
                        bgColor = "#e8f5e9";
                    }

                    document.documentElement.style.setProperty('--main-bg', bgColor);
                    const marquee = document.getElementById('top-msg');
                    if (!marqueeRestoreTimer) marquee.innerText = getActiveMarqueeText();

                    if (chuncheonDust) {
                        let gradeText = "--", gradeColor = "#999";
                        if (isNaN(pmValue)) { gradeText = "측정중"; gradeColor = "#999"; }
                        else if (pmValue <= 30) { gradeText = "😆 좋음"; gradeColor = "#2196f3"; }
                        else if (pmValue <= 80) { gradeText = "🙂 보통"; gradeColor = "#4caf50"; }
                        else if (pmValue <= 150) { gradeText = "😷 나쁨"; gradeColor = "#ff9800"; }
                        else { gradeText = "🚨 매우나쁨"; gradeColor = "#f44336"; }

                        dustHtml = `
                            <div style="margin-top:10px; padding:6px 15px; border-radius:15px; background:white; border:2px solid ${gradeColor}; width:90%;">
                                <div style="font-size:1.6rem; font-weight:bold; color:${gradeColor};">${gradeText}</div>
                                <div style="font-size:1.2rem; color:#555;">수치: ${isNaN(pmValue) ? '측정중' : pmValue + '㎍/㎥'}</div>
                            </div>`;
                    }
                } catch(e) {}
                info.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%;"><div style="display:flex; align-items:center; gap:10px; line-height:1;"><span style="font-size:5rem;">${skyIcon}</span><b style="font-size:4.2rem; letter-spacing:-2px;">${temp}°C</b></div><div style="font-size:1.6rem; color:#555; font-weight:bold; margin-top:2px;">${skyT}</div>${dustHtml}</div>`;
            } catch(e) { info.innerHTML = "날씨 연결 실패"; }
        }

       function renderBugGrid() { 
    const grid = document.getElementById('cookie-grid'); 
    grid.innerHTML = ''; 

    studentData.forEach(s => { 
        const totalCount = currentAPI_Totals[s.code] || 0; 
        if (!gameData[s.code]) gameData[s.code] = { ackTotal: 0, garden: [], currentBug: null }; 
        
        const data = gameData[s.code]; 
        
        if (totalCount < data.ackTotal) {
            let remTotal = totalCount % 100;
            let currentMilestone = 0;
            if (remTotal >= 90) currentMilestone = 90;
            else if (remTotal >= 60) currentMilestone = 60;
            else if (remTotal >= 30) currentMilestone = 30;
            
            data.ackTotal = Math.floor(totalCount / 100) * 100 + currentMilestone;
            if (remTotal < 90) data.currentBug = null; 
            localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
        }

        let rem = data.ackTotal % 100; 
        let milestone = rem < 30 ? 30 : rem < 60 ? 60 : rem < 90 ? 90 : 100; 
        
        let targetAbsolute = data.ackTotal - rem + milestone;
        const canEvo = totalCount >= targetAbsolute; 
        let currentCookies = totalCount % 100;

        // ⭐ 학생 고유 번호를 활용한 랜덤값 생성
        let hash = 0; 
        for(let i=0; i<s.code.length; i++) hash = s.code.charCodeAt(i) + ((hash << 5) - hash); 

        // 1. 크기 랜덤 (35 ~ 55px 사이)
        let randomSize = 35 + (Math.abs(hash) % 21);
        
        // 2. 색상 랜덤 팔레트 (f:기본색상, s:기본테두리 / ef:80개돌파 눈부신색상, es:눈부신테두리)
        const palettes = [
            { f: "#aed581", s: "#558b2f", ef: "#ccff90", es: "#64dd17" }, // 초록 -> 네온초록
            { f: "#f48fb1", s: "#ad1457", ef: "#ff80ab", es: "#c51162" }, // 분홍 -> 핫핑크
            { f: "#81d4fa", s: "#0277bd", ef: "#84ffff", es: "#00b8d4" }, // 파랑 -> 빛나는하늘색
            { f: "#ce93d8", s: "#6a1b9a", ef: "#e040fb", es: "#aa00ff" }, // 보라 -> 네온보라
            { f: "#ffcc80", s: "#ef6c00", ef: "#ffd54f", es: "#ff9800" }, // 주황 -> 황금빛
            { f: "#fff59d", s: "#f57f17", ef: "#ffff00", es: "#ffea00" }  // 연노랑 -> 쨍한노랑
        ];
        let c = palettes[Math.abs(hash) % palettes.length];

        // ⭐ 학생만을 위한 맞춤형 크기+색상의 번데기 그림 동적 생성!
        let myPupa = `<svg viewBox="0 0 100 100" width="${randomSize}" height="${randomSize}"><path d="M50 10 C65 25, 75 55, 50 90 C25 55, 35 25, 50 10 Z" fill="${c.f}" stroke="${c.s}" stroke-width="4"/><path d="M35 35 Q50 45 65 35 M30 55 Q50 65 70 55 M35 75 Q50 85 65 75" fill="none" stroke="${c.s}" stroke-width="3" opacity="0.6"/></svg>`;
        
        let myEvoPupa = `<svg viewBox="0 0 100 100" width="${randomSize}" height="${randomSize}"><path d="M50 10 C65 25, 75 55, 50 90 C25 55, 35 25, 50 10 Z" fill="${c.ef}" stroke="${c.es}" stroke-width="4"/><path d="M35 35 Q50 45 65 35 M30 55 Q50 65 70 55 M35 75 Q50 85 65 75" fill="none" stroke="${c.es}" stroke-width="3" opacity="0.6"/></svg>`;

        let iconHtml = '';
        if (canEvo) {
            iconHtml = '✨';
        } else if (rem < 30) {
            if (currentCookies >= 20) iconHtml = `<span class="egg-shake">🥚</span>`;
            else iconHtml = '🥚';
        } else if (rem < 60) {
            if (currentCookies >= 50) iconHtml = `<span class="rainbow-bug">🐛</span>`;
            else { 
                iconHtml = `<span class="caterpillar-look" style="filter: hue-rotate(${Math.abs(hash % 360)}deg);">🐛</span>`; 
            }
        } else if (rem < 90) {
            if (currentCookies >= 80) {
                // 부화 직전: 맞춤 크기 + 빛나는 진화 색상 + 파르르 떨림
                iconHtml = `<span class="pupa-shiver" style="display:inline-block;">${myEvoPupa}</span>`;
            } else {
                // 일반 번데기: 맞춤 크기 + 기본 색상
                iconHtml = myPupa;
            }
       } else {
            if (data.currentBug) {
                // 쿠키 95개 이상이면 화면 전체를 날아다니는 'fly-all-over' 적용!
                const isReady = currentCookies >= 95 ? 'fly-all-over' : '';
                iconHtml = `<span class="${isReady}" style="display:inline-block; ${data.currentBug.css || ''}">${data.currentBug.icon}</span>`;
            } else {
                iconHtml = '🦋';
            }
        }

        // ✨ 배고픔 & 하트 검사 로직 (시간 기반)
        const nowMs = Date.now();
        const oneHour = 60 * 60 * 1000;       // 1시간
        const twoDays = 48 * 60 * 60 * 1000;  // 2일
        
        // 🚨 기존에 날짜(문자열)로 저장된 데이터가 있거나 아예 없다면 현재 시간(숫자)으로 덮어씌움 (먹통 방지)
        if (!cookieEarnDates[s.code] || typeof cookieEarnDates[s.code] === 'string') {
            cookieEarnDates[s.code] = nowMs;
            localStorage.setItem('cookieEarnDates_v1', JSON.stringify(cookieEarnDates));
        }
        
        // 1. 배고픔 판별 (2일 경과)
        let isHungry = (nowMs - cookieEarnDates[s.code] > twoDays);
        let hungryHtml = isHungry ? `<div class="hungry-bubble">🍪?</div>` : ''; 

        // 2. 하트 판별 (1시간 이내)
        let happyHtml = '';
        if (!isHungry && (nowMs - cookieEarnDates[s.code] < oneHour)) {
            happyHtml = `<div class="happy-heart">❤️</div>`;
        }

        // 최종 아이콘 출력
        let statusHtml = isHungry ? hungryHtml : happyHtml;
        const card = document.createElement('div'); 
        card.className = `cookie-individual ${canEvo ? 'can-evolve' : ''}`; 
card.innerHTML = `
    <div style="font-size:1.1rem; font-weight:bold;">${s.name}</div>
    <div class="evo-icon" style="position:relative;">
        ${statusHtml}  ${iconHtml}
    </div>
    <div style="font-size:1rem; color:#ef6c00;">🍪 ${currentCookies}</div>
`;

        if(canEvo) {
            card.onclick = () => { 
                handleEvo(s.code, targetAbsolute);
            }; 
        }
        grid.appendChild(card); 
    }); 
}

        function handleEvo(code, nextMilestone) {
            const data = gameData[code]; const student = studentData.find(s=>s.code===code); const rem = nextMilestone % 100;
            data.ackTotal = nextMilestone;
            setTimeout(function() {
                if (rem === 30) showMarqueeMessage('🐛 축하합니다! ' + student.name + ' 학생의 애벌레가 깨어났어요!', 45000);
                else if (rem === 60) showMarqueeMessage('🛖 ' + student.name + ' 학생, 번데기가 되었어요!', 45000);
                else if (rem === 90) { const newBug = bugPool[Math.floor(Math.random() * bugPool.length)]; data.currentBug = newBug; showMarqueeMessage('🦋 우화 성공! ' + student.name + ' 학생이 [' + newBug.name + '] ' + newBug.icon + ' 을(를) 획득했습니다!', 60000); }
                else if (rem === 0) { const bugToGarden = data.currentBug || {icon:'🦋', name:'나비'}; data.garden.push(bugToGarden); data.currentBug = null; showMarqueeMessage('🌸 ' + student.name + ' 학생의 [' + bugToGarden.name + '] 이(가) 정원으로 날아갔어요! 새로운 알을 발견했어요! 🥚', 60000); renderGarden(); }
                playAlarmSound('celebration');
                localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData)); renderBugGrid();
            }, 100);
        }

        function applySuperChance() {
            const increments = {}; // 각 학생별 증가량을 저장
            studentData.forEach(s => {
                const data = gameData[s.code];
                if (!data) return;

                const oldTotal = data.ackTotal;
                // 1의 자리를 0으로 만들고 십의 자리를 하나 올림 (예: 23 -> 30, 20 -> 30)
                let nextMilestone = (Math.floor(data.ackTotal / 10) + 1) * 10;
                
                increments[s.code] = nextMilestone - oldTotal; // 증가량 계산

                data.ackTotal = nextMilestone;
                const finalRem = nextMilestone % 100;

                // 진화 로직 적용 (번데기->나비 획득, 나비->정원 이동)
                if (finalRem === 90 && !data.currentBug) {
                    data.currentBug = bugPool[Math.floor(Math.random() * bugPool.length)];
                } else if (finalRem === 0) {
                    const bugToGarden = data.currentBug || {icon:'🦋', name:'나비'};
                    data.garden.push(bugToGarden);
                    data.currentBug = null;
                }
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
            renderBugGrid(); renderGarden();

            spawnSuperConfetti(); // 슈퍼 찬스 전용 황금 폭죽 실행

            // 시각 효과: 렌더링된 카드들을 찾아 숫자 애니메이션 추가
            const cards = document.querySelectorAll('.cookie-individual');
            studentData.forEach((s, idx) => {
                const card = cards[idx];
                const inc = increments[s.code];
                if (card && inc > 0) {
                    const upText = document.createElement('div');
                    upText.className = 'floating-up-text';
                    upText.innerText = `+${inc} ✨`;
                    card.appendChild(upText);
                    setTimeout(() => upText.remove(), 2000);
                }
            });

            showMarqueeMessage('🌈 [슈퍼 찬스 당첨!] 모든 학생의 쿠키가 다음 십의 자리로 올림되었습니다! 🌈', 15000);
            playAlarmSound('celebration');
        }

        function renderGarden() {
            const garden = document.getElementById('shared-garden'); garden.innerHTML = '';
            studentData.forEach(s => {
                if(gameData[s.code] && gameData[s.code].garden) {
                    gameData[s.code].garden.forEach(bug => {
                        const bugEl = document.createElement('div'); bugEl.className = 'garden-bug'; 
                        
                        bugEl.innerHTML = `<span style="display:inline-block; ${bug.css || ''}">${bug.icon}</span>`; 
                        
                        bugEl.setAttribute('data-name', `${s.name}의 ${bug.name}`);
                        bugEl.style.left = Math.floor(Math.random() * 90) + '%'; bugEl.style.top = Math.floor(Math.random() * 70) + 10 + '%'; bugEl.style.animation = `floatAround ${10 + Math.random() * 10}s infinite alternate ease-in-out`; bugEl.style.animationDelay = `-${Math.random() * 5}s`;
                        bugEl.onclick = () => alert(`${s.name} 학생이 정성껏 키운 [ ${bug.name} ] 입니다!`);
                        garden.appendChild(bugEl);
                    });
                }
            });
        }

        function drawGardenBackground() {
            const bg = document.getElementById('garden-bg'); const decos = ['🌸', '🌻', '🌿', '🍀', '🌼'];
            for(let i=0; i<20; i++) { const span = document.createElement('span'); span.className = 'bg-flower'; span.innerHTML = decos[Math.floor(Math.random() * decos.length)]; span.style.left = Math.floor(Math.random() * 95) + '%'; span.style.top = Math.floor(Math.random() * 80) + 10 + '%'; bg.appendChild(span); }
        }

        function checkAlarms(now) { 
            if (!isViewDateToday(viewDate)) return;

            const curSec = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds(); 
            const dName = ["일","월","화","수","목","금","토"][viewDate.getDay()]; 
            const tt = temporaryTT[viewDate.toLocaleDateString('sv-SE')] || weeklyTT[dName]; 
            if(!tt) return; 

            const miniTimer = document.getElementById('mini-timer');
            const fullAlert = document.getElementById('full-screen-alert');
            const alertMsg = document.getElementById('alert-message');
            const alertTimer = document.getElementById('alert-timer');
            const mainAlarmMsg = document.getElementById('alarm-msg');

            let nearestIdx = -1;
            let nearestDiff = Infinity;
            classTimes.forEach((st, i) => {
                if (alarmOffFlags[i]) return;
                const [h, m] = st.split(':').map(Number);
                const diff = (h*3600 + m*60) - curSec;
                if (diff >= 0 && diff < nearestDiff) {
                    nearestDiff = diff;
                    nearestIdx = i;
                }
            });

            // 현재 계산된 가장 가까운 알람 인덱스를 전역 변수에 저장 (닫기 버튼 클릭 시 참조용)
            currentAlarmIdx = nearestIdx;

            if (nearestIdx === -1) {
                fullAlert.style.display = 'none';
                miniTimer.style.display = 'none';
                mainAlarmMsg.innerText = '';
                return;
            }

            const diff = nearestDiff;
            const isSpecial = tt[nearestIdx] && tt[nearestIdx].m;
            const subj = tt[nearestIdx] && tt[nearestIdx].s !== "-" ? tt[nearestIdx].s : (nearestIdx+1)+"교시";

            if (isSpecial && diff <= 300 && diff > 60) {
                // 사용자가 해당 교시 알람을 끄지 않았을 때만 화면에 표시
                if (lastDismissedAlarmIdx !== nearestIdx) fullAlert.style.display = 'flex';
                fullAlert.style.background = 'rgba(52, 152, 219, 0.95)';
                alertMsg.innerText = `🏃 곧 ${subj} (이동 수업) 입니다!`;
                alertTimer.innerText = `${Math.floor(diff / 60)}분 ${diff % 60}초 전`;
                miniTimer.style.display = 'none';
                mainAlarmMsg.innerText = '';
            }
            else if (diff <= 600 && diff > 60) {
                fullAlert.style.display = 'none';
                miniTimer.style.display = 'block';
                miniTimer.innerText = `다음 수업 시작 ${Math.floor(diff / 60)}분 ${diff % 60}초 전`;
                mainAlarmMsg.innerText = '';
            }
            else if (diff <= 60 && diff > 0) {
                miniTimer.style.display = 'none';
                // 사용자가 해당 교시 알람을 끄지 않았을 때만 화면에 표시
                if (lastDismissedAlarmIdx !== nearestIdx) fullAlert.style.display = 'flex';
                fullAlert.style.background = 'rgba(255, 138, 128, 0.95)'; 
                alertMsg.innerText = isSpecial ? `🚀 ${subj} 특별실 이동 1분 전!` : `📝 ${subj} 수업 준비 1분 전!`;
                alertTimer.innerText = diff;
                mainAlarmMsg.innerText = `🔔 ${subj} 시작 ${diff}초 전!`; 

                if (diff <= 30 && lastTickSecond !== now.getSeconds()) {
                    playTickSound();
                    lastTickSecond = now.getSeconds();
                }
            }
            else if (diff === 0) {
                fullAlert.style.display = 'none';
                miniTimer.style.display = 'none';
                mainAlarmMsg.innerText = '';
                document.getElementById('bigAlert').style.display = 'flex'; 
                document.getElementById('bigAlertText').innerText = "수업 준비합시다!"; 
                playAlarmSound('bell'); 
            }
        }

        function dismissAlarm() { document.getElementById('bigAlert').style.display = 'none'; document.getElementById('alarmSound').pause(); }
        function dismissFullScreenAlert() { 
            document.getElementById('full-screen-alert').style.display = 'none'; 
            // 현재 알람 중인 교시를 '닫음' 상태로 기록하여 다시 뜨지 않게 함
            if (currentAlarmIdx !== -1) lastDismissedAlarmIdx = currentAlarmIdx;
        }
        function toggleDahand(show) { const l = document.getElementById('dahandLayer'); if(show){ l.classList.add('show'); document.getElementById('dahandFrame').src="https://dahandin.com/"; } else l.classList.remove('show'); }
        function toggleGarden(show) { const l = document.getElementById('gardenLayer'); if(show) l.classList.add('show'); else l.classList.remove('show'); }

        function openTTConfigModal() {
            let h = '<tr><th>교시</th>' + ["월","화","수","목","금"].map(d=>`<th>${d}</th>`).join('') + '</tr>';
            for(let i=0; i<6; i++) { h += `<tr><td>${i+1}</td>` + ["월","화","수","목","금"].map(d => { const obj = weeklyTT[d][i]; return `<td style="padding:5px; border:1px solid #ccc;"><select id="set-s-${d}-${i}" style="font-family:'Jua'; padding:3px;">${subjects.map(s=>`<option value="${s}" ${obj.s===s?'selected':''}>${s}</option>`).join('')}</select><br><label style="font-size:1.1rem;"><input type="checkbox" id="set-m-${d}-${i}" ${obj.m?'checked':''}> 이동</label></td>`; }).join('') + '</tr>'; }
            document.getElementById('ttSettingTable').innerHTML = h; 
            
            let tHtml = ''; 
            classTimes.forEach((t, i) => { 
                tHtml += `<div style="margin-bottom:12px; font-size:1.4rem;">${i+1}교시: <input type="time" id="set-time-${i}" value="${t}" style="font-family:'Jua'; padding:5px;"> 
                          <label style="font-size:1.2rem; color:#d32f2f; margin-left:10px; cursor:pointer;"><input type="checkbox" id="set-alarmOff-${i}" ${alarmOffFlags[i] ? 'checked' : ''}> 알람 끄기</label></div>`; 
            }); 
            document.getElementById('timeSettingArea').innerHTML = tHtml; 
            document.getElementById('ttConfigModal').style.display = 'flex';
        }

        function saveTTConfig() { 
            ["월","화","수","목","금"].forEach(d=>{ for(let i=0; i<6; i++){ weeklyTT[d][i] = { s: document.getElementById(`set-s-${d}-${i}`).value, m: document.getElementById(`set-m-${d}-${i}`).checked }; } }); 
            for(let i=0; i<6; i++) { 
                classTimes[i] = document.getElementById(`set-time-${i}`).value; 
                alarmOffFlags[i] = document.getElementById(`set-alarmOff-${i}`).checked;
            } 
            localStorage.setItem('weeklyTT_v7', JSON.stringify(weeklyTT)); localStorage.setItem('classTimes_v7', JSON.stringify(classTimes)); localStorage.setItem('alarmOffFlags_v1', JSON.stringify(alarmOffFlags));
            renderAll(); closeAllModals(); 
        }

        function openQuickSubModal(i) { document.getElementById('quick-sub-list').innerHTML=subjects.map(s=>`<button class="side-btn" onclick="changeSubTemp(${i},'${s}')">${s}</button>`).join(''); document.getElementById('quickSubModal').style.display='flex'; }
        function changeSubTemp(i, s) {
            const dk = viewDate.toLocaleDateString('sv-SE'); 
            const dNames = ["일", "월", "화", "수", "목", "금", "토"];
            const dayName = dNames[viewDate.getDay()]; 
            const baseDayName = (dayName === "일" || dayName === "토") ? "월" : dayName;

            if (!temporaryTT[dk]) { 
                const baseTT = weeklyTT[baseDayName] || Array(6).fill().map(() => ({ s: "-", m: false })); 
                temporaryTT[dk] = JSON.parse(JSON.stringify(baseTT)); 
            }

            temporaryTT[dk][i] = { s: s, m: temporaryTT[dk][i].m || false }; 
            
            localStorage.setItem('temporaryTT_v1', JSON.stringify(temporaryTT)); 
            
            renderAll(); 
            closeAllModals(); 
        }
        function applyDate() { const v = document.getElementById('date-picker-input').value; if(v){ viewDate=new Date(v); renderAll(); fetchMeal(); fetchWeather(); closeAllModals(); } }
        function goToPrevDay() { viewDate.setDate(viewDate.getDate() - 1); renderAll(); fetchMeal(); fetchWeather(); closeAllModals(); }
        function goToNextDay() { viewDate.setDate(viewDate.getDate() + 1); renderAll(); fetchMeal(); fetchWeather(); closeAllModals(); }
        function goToToday() { viewDate=new Date(); renderAll(); fetchMeal(); fetchWeather(); closeAllModals(); }
        function closeAllModals() { document.querySelectorAll('.modal').forEach(m=>m.style.display='none'); document.getElementById('goal-input').value = cookieGoal; }
        function saveCookieGoal() { cookieGoal=parseInt(document.getElementById('goal-input').value); localStorage.setItem('cookieGoal_v5', cookieGoal); syncCookies(); closeAllModals(); }

        function toggleLunchLayer(show) {
            const l = document.getElementById('lunchLayer'); const f = document.getElementById('lunchFrame');
            if(show) { l.classList.add('show'); f.src = `lunch.html?date=${toLocalDateStr(viewDate)}`; } 
            else { l.classList.remove('show'); }
        }

        function checkLunchEvent(now) {
            const curTimeNum = now.getHours() * 100 + now.getMinutes(); 
            if (curTimeNum === 1250 && !lunchAutoOpened) { toggleLunchLayer(true); lunchAutoOpened = true; }
            if (curTimeNum >= 1258 && curTimeNum < 1300 && !lunchResultShown) {
                const frame = document.getElementById('lunchFrame');
                if (frame.contentWindow && typeof frame.contentWindow.toggleStats === 'function') {
                    frame.contentWindow.toggleStats(); lunchResultShown = true; playAlarmSound('celebration'); 
                }
            }
            if (curTimeNum === 0) { lunchAutoOpened = false; lunchResultShown = false; }
        }

        function editCreativeMemo(idx) {
            creativeMemoEditIdx = idx;
            const dateKey = viewDate.toLocaleDateString('sv-SE');
            document.getElementById('creative-memo-input').value = creativeMemo[dateKey + '-' + idx] || '';
            document.getElementById('creativeMemoModal').style.display = 'flex';
        }
        function saveCreativeMemo() {
            if (creativeMemoEditIdx === null) return;
            const dateKey = viewDate.toLocaleDateString('sv-SE');
            creativeMemo[dateKey + '-' + creativeMemoEditIdx] = document.getElementById('creative-memo-input').value.trim();
            localStorage.setItem('creativeMemo_v1', JSON.stringify(creativeMemo));
            creativeMemoEditIdx = null;
            closeAllModals();
            renderAll();
        }

// ✨ 학생 데이터 불러오기 기능 추가
function importStudentData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedStudents = JSON.parse(e.target.result);
            // 데이터 유효성 검사 (name과 code 필드 확인)
            if (!Array.isArray(importedStudents) || !importedStudents.every(s => s.name && s.code)) {
                alert("학생 데이터 파일 형식이 올바르지 않습니다. 각 항목은 'name'과 'code'를 포함해야 합니다.");
                return;
            }
            localStorage.setItem('studentData_v1', JSON.stringify(importedStudents));
            alert("학생 데이터가 성공적으로 불러와졌습니다! 페이지를 새로고침합니다.");
            location.reload();
        } catch(err) {
            alert("파일을 읽는 중 오류가 발생했습니다. JSON 형식이 올바른지 확인하세요.");
            console.error("학생 데이터 불러오기 오류:", err);
        }
    };
    reader.readAsText(file);
}

// ✨ 진정한 무작위 비행 (AI 알고리즘)
        setInterval(() => {
            const flyingBugs = document.querySelectorAll('.fly-all-over');
            flyingBugs.forEach(bug => {
                // 70% 확률로 움직이고, 30% 확률로 그 자리에 더 머뭅니다 (휴식)
                if (Math.random() > 0.3) {
                    // 화면의 어디로 갈지 매번 완전히 새롭게 무작위 계산
                    const randomX = (Math.random() * 80 - 40).toFixed(1); // 가로 랜덤 좌표
                    const randomY = (Math.random() * 90 - 45).toFixed(1); // 세로 랜덤 좌표
                    const randomAngle = (Math.random() * 40 - 20).toFixed(1); // 기우는 각도도 랜덤
                    
                    // 새로운 목적지로 출발!
                    bug.style.transform = `translate(${randomX}vw, ${randomY}vh) rotate(${randomAngle}deg) scale(1.6)`;
                }
            });
        }, 8000); // 8초마다 행동 결정 (5초 비행 + 3초 기본 휴식)

// =================================================================
        // 🎰 룰렛 시스템
        // =================================================================
        let isWheelSpinning = false;

        function setupRouletteUI() {
            if (document.getElementById('eventRouletteBtn')) return;
            const sideButtons = document.querySelectorAll('.side-btn');
            sideButtons.forEach(function(btn) {
                if (btn.innerText.includes('기본 설정')) {
                    const rouletteBtn = document.createElement('button');
                    rouletteBtn.className = 'side-btn';
                    rouletteBtn.id = 'eventRouletteBtn';
                    rouletteBtn.style.background = '#e91e63';
                    rouletteBtn.style.color = 'white';
                    rouletteBtn.style.boxShadow = '0 4px 0 #ad1457';
                    rouletteBtn.innerText = '🎰 오늘의 이벤트 뽑기';
                    rouletteBtn.onclick = openRouletteModal;
                    btn.after(rouletteBtn);
                }
                if (btn.innerText.includes('이벤트 뽑기') || btn.id === 'eventRouletteBtn') {
                    if (!document.getElementById('manualNoiseBtn')) {
                        const noiseBtn = document.createElement('button');
                        noiseBtn.className = 'side-btn';
                        noiseBtn.id = 'manualNoiseBtn';
                        noiseBtn.style.background = '#607d8b';
                        noiseBtn.style.color = 'white';
                        noiseBtn.style.marginTop = '5px';
                        noiseBtn.innerText = '🔇 소음 측정 시작';
                        noiseBtn.onclick = toggleManualNoiseMonitoring;
                        btn.after(noiseBtn);
                    }
                }
            });
            if (!document.getElementById('rouletteOverlay')) {
                document.body.insertAdjacentHTML('beforeend', `
                <div class="roulette-overlay" id="rouletteOverlay">
                    <div class="roulette-container">
                        <div class="roulette-close" onclick="closeRouletteModal()">❌</div>
                        <h2 style="margin:0 0 15px 0; color:#4e342e; font-size:1.5rem;">🔮 3-5 쿠키 운세 뽑기 🔮</h2>
                        <div class="roulette-pointer"></div>
                        <div class="roulette-center-cap"></div>
                        <canvas id="rouletteCanvas" width="320" height="320"></canvas>
                        <br>
                        <button class="roulette-spin-btn" id="spinActionBtn" onclick="spinRouletteWheel()">✨ 돌리기 ✨</button>
                    </div>
                </div>`);
            }
            drawRouletteWheel();
        }

        // 슈퍼 찬스 도전 UI 생성 및 실행
        function openSuperChanceChallenge() {
            if (document.getElementById('superChallengeOverlay')) {
                document.getElementById('superChallengeOverlay').style.display = 'flex';
            } else {
                const html = `
                <div class="super-challenge-overlay" id="superChallengeOverlay">
                    <div class="challenge-box">
                        <h1 style="font-size:3rem; color:#ef6c00;">🌈 보너스 슈퍼 찬스 도전!</h1>
                        <p style="font-size:1.5rem;">10개의 상자 중 단 하나에 황금 쿠키가 들어있습니다!</p>
                        <div class="chance-visualizer" id="chanceVisualizer"></div>
                        <button class="roulette-spin-btn" id="startChallengeBtn" onclick="runSuperChanceAttempt()" style="font-size:2rem; padding:20px 60px;">상자 열기!</button>
                    </div>
                </div>`;
                document.body.insertAdjacentHTML('beforeend', html);
                document.getElementById('superChallengeOverlay').style.display = 'flex';
            }
            
            // 10개 슬롯 생성
            const container = document.getElementById('chanceVisualizer');
            container.innerHTML = '';
            for (let i = 0; i < 10; i++) {
                container.innerHTML += `<div class="chance-slot" id="slot-${i}">🎁</div>`;
            }
            document.getElementById('startChallengeBtn').disabled = false;
            document.getElementById('startChallengeBtn').innerText = '상자 열기!';
        }

        function runSuperChanceAttempt() {
            const btn = document.getElementById('startChallengeBtn');
            btn.disabled = true;
            btn.innerText = '두근두근...';
            
            const winIdx = Math.floor(Math.random() * 10); // 실제 당첨 인덱스
            const isWin = (winIdx === 0); // 10% 확률 (0번일 때만 당첨)
            
            let current = 0;
            let loops = 0;
            const interval = setInterval(() => {
                document.querySelectorAll('.chance-slot').forEach(s => s.classList.remove('active'));
                document.getElementById(`slot-${current}`).classList.add('active');
                
                current = (current + 1) % 10;
                if (current === 0) loops++;
                
                // 3바퀴 돌고 멈춤
                if (loops >= 3 && current === (isWin ? 0 : (winIdx === 0 ? 1 : winIdx))) {
                    clearInterval(interval);
                    finishChallenge(isWin);
                }
            }, 100);
        }

        function finishChallenge(isWin) {
            const slots = document.querySelectorAll('.chance-slot');
            slots.forEach(s => s.classList.remove('active'));
            const resultSlot = document.getElementById('slot-' + (isWin ? 0 : 1)); // 시각적 결과 고정
            
            if (isWin) {
                resultSlot.innerHTML = '<span class="slot-gold">✨</span>';
                resultSlot.classList.add('winner');
                setTimeout(() => {
                    applySuperChance();
                    document.getElementById('superChallengeOverlay').style.display = 'none';
                }, 1500);
            } else {
                resultSlot.innerHTML = '❌';
                setTimeout(() => {
                    alert("아쉽습니다! 다음 기회에...");
                    document.getElementById('superChallengeOverlay').style.display = 'none';
                }, 1000);
            }
        }

        function drawRouletteWheel() {
            const canvas = document.getElementById('rouletteCanvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const numSegments = wheelItems.length;
            const radius = canvas.width / 2;
            const anglePerSegment = (2 * Math.PI) / numSegments;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < numSegments; i++) {
                const startAngle = i * anglePerSegment - Math.PI / 2;
                const endAngle = startAngle + anglePerSegment;
                ctx.beginPath();
                ctx.moveTo(radius, radius);
                ctx.arc(radius, radius, radius - 10, startAngle, endAngle);
                ctx.fillStyle = wheelItems[i].color;
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();
                ctx.save();
                ctx.translate(radius, radius);
                ctx.rotate(startAngle + anglePerSegment / 2);
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText(wheelItems[i].label, radius - 25, 0);
                ctx.restore();
            }
        }

        function openRouletteModal() {
            if (isWheelSpinning) return;
            if (getTodayRoulette()) {
                showMarqueeMessage(getTodayRoulette().alert, 0);
                return;
            }
            document.getElementById('rouletteOverlay').classList.add('active');
        }

        function closeRouletteModal() {
            if (isWheelSpinning) return;
            document.getElementById('rouletteOverlay').classList.remove('active');
        }

        function spinRouletteWheel() {
            if (isWheelSpinning || getTodayRoulette()) return;
            isWheelSpinning = true;
            const canvas = document.getElementById('rouletteCanvas');
            const spinBtn = document.getElementById('spinActionBtn');
            const sideBtn = document.getElementById('eventRouletteBtn');
            spinBtn.disabled = true;
            spinBtn.innerText = '👀 도는 중...';
            const numSegments = wheelItems.length;
            const targetIndex = Math.floor(Math.random() * numSegments);
            const anglePerSegment = 360 / numSegments;
            const stopAngle = (360 - (targetIndex * anglePerSegment)) - (anglePerSegment / 2);
            canvas.style.transform = 'rotate(' + ((360 * 6) + stopAngle) + 'deg)';
            setTimeout(function() {
                const finalEvent = wheelItems[targetIndex];
                document.getElementById('top-msg').innerHTML = finalEvent.title;
                playAlarmSound('celebration');
                clearLucky369Effect();
                if (finalEvent.isLucky369) applyLucky369Effect();
                saveTodayRoulette({ index: targetIndex, title: finalEvent.title, alert: finalEvent.alert, isLucky369: !!finalEvent.isLucky369 });
                
                // 초록색 칸(#4caf50)이면 도전 버튼 표시
                if (finalEvent.color === "#4caf50") {
                    spinBtn.innerText = '🌈 슈퍼 찬스 도전하기!';
                    spinBtn.style.background = '#ff9800';
                    spinBtn.onclick = () => { openSuperChanceChallenge(); closeRouletteModal(); };
                    spinBtn.disabled = false;
                    return; // 바로 닫지 않고 대기
                }

                markRouletteComplete(finalEvent);
                isWheelSpinning = false;
                spinBtn.disabled = false;
                spinBtn.innerText = '✨ 돌리기 ✨';
                closeRouletteModal();
            }, 4100);
        }

        init();