const CLASS_DATA = {
    bugPool: [
    // 🦋 나비류
    { icon: "🦋", css: "filter: hue-rotate(0deg);", name: "하늘빛 제비나비" },
    { icon: "🦋", css: "filter: hue-rotate(250deg);", name: "노란 꼬마호랑나비" },
    { icon: "🦋", css: "filter: hue-rotate(80deg);", name: "분홍 벚꽃나비" },
    { icon: "🦋", css: "filter: hue-rotate(45deg);", name: "보라빛 신비나비" },
    { icon: "🦋", css: "filter: hue-rotate(180deg) brightness(1.2);", name: "에메랄드 산나비" },

    // 🐞 무당벌레류
    { icon: "🐞", css: "filter: hue-rotate(0deg);", name: "빨간 칠성무당벌레" },
    { icon: "🐞", css: "filter: hue-rotate(60deg);", name: "노란 달무늬무당벌레" },
    { icon: "🐞", css: "filter: hue-rotate(30deg);", name: "주황빛 남생이무당벌레" },

    // 🪲 딱정벌레/풍뎅이류
    { icon: "🪲", css: "filter: hue-rotate(0deg);", name: "초록빛 비단벌레" },
    { icon: "🪲", css: "filter: hue-rotate(90deg);", name: "푸른 광택 딱정벌레" },
    { icon: "🪲", css: "filter: hue-rotate(200deg);", name: "갈색 멋쟁이 장수풍뎅이" },

    // 🐝 벌류
    { icon: "🐝", css: "filter: hue-rotate(0deg);", name: "노란 털북숭이 호박벌" },
    { icon: "🐝", css: "filter: hue-rotate(-30deg);", name: "주황 줄무늬 꿀벌" },

    // 🐛 애벌레류
    { icon: "🐛", css: "filter: hue-rotate(0deg);", name: "연두색 통통 애벌레" },
    { icon: "🐛", css: "filter: hue-rotate(-40deg);", name: "노란 얼룩무늬 애벌레" },

    // 🐌 달팽이류
    { icon: "🐌", css: "filter: hue-rotate(0deg);", name: "갈색 껍질 달팽이" },
    { icon: "🐌", css: "filter: hue-rotate(180deg) brightness(1.5);", name: "하얀 백달팽이" },

    // 🐜 개미류
    { icon: "🐜", css: "filter: grayscale(100%) brightness(0.5);", name: "검은색 부지런한 일개미" },
    { icon: "🐜", css: "filter: hue-rotate(0deg) saturate(2);", name: "붉은 용감한 불개미" },

    // 🦗 귀뚜라미/여치류
    { icon: "🦗", css: "filter: hue-rotate(0deg);", name: "초록색 맑은소리 귀뚜라미" },
    { icon: "🦗", css: "filter: hue-rotate(150deg);", name: "갈색 가을 여치" },

    // 🪱 지렁이
    { icon: "🪱", css: "filter: hue-rotate(0deg);", name: "분홍빛 꼬물 지렁이" },

   // 🦂 전갈/거미류 (새로운 분류군)
    { icon: "🦂", css: "filter: hue-rotate(0deg);", name: "사막의 황제 전갈" },
    { icon: "🦂", css: "filter: hue-rotate(120deg) brightness(1.3);", name: "신비로운 루비빛 전갈" },
    { icon: "🕷️", css: "filter: grayscale(100%) brightness(0.3);", name: "어둠 속의 타란툴라 독거미" },
    { icon: "🕸️", css: "filter: drop-shadow(0 0 5px white);", name: "반짝이는 이슬 거미줄" },

    // 🦟 잠자리/사마귀류 (교실 주변 인기 곤충)
    { icon: "🦟", css: "filter: hue-rotate(90deg) brightness(1.5);", name: "물가에 사는 청잠자리" },
    { icon: "🦟", css: "filter: hue-rotate(0deg);", name: "가을 하늘 고추잠자리" },

    // 🦗 메뚜기 계열 확장
    { icon: "🦗", css: "filter: hue-rotate(60deg) saturate(2);", name: "풀숲의 무법자 왕사마귀" },

    // 🐌 달팽이 계열 확장
    { icon: "🐌", css: "filter: hue-rotate(280deg) brightness(1.2);", name: "마법의 보랏빛 유니콘 달팽이" },

    // ✨ 전설/히든 희귀종 추가 (황금빛/네온 후광 효과)
    { icon: "🐝", css: "filter: drop-shadow(0 0 12px #ffeb3b) brightness(1.5);", name: "로열젤리를 먹은 황금 여왕벌" },
    { icon: "🦂", css: "filter: drop-shadow(0 0 15px #00ffff) hue-rotate(190deg);", name: "심해에서 온 메카닉 크리스탈 전갈" },

    // ✨ 전설/희귀종 (무지개 효과 및 황금빛 후광 추가)
    { icon: "🦋", css: "animation: rainbowHue 2s linear infinite;", name: "무지개빛 환상 나비" },
    { icon: "🪲", css: "filter: drop-shadow(0 0 10px gold) hue-rotate(220deg) brightness(1.5);", name: "황금빛 전설의 장수풍뎅이" },
    { icon: "💫", css: "filter: drop-shadow(0 0 10px cyan); animation: flutter 2s infinite;", name: "은하수 빛깔 반딧불이" }
],
    wheelItems: [
            { label: "대박 2배", color: "#ff5722", title: "🔥 [오늘의 이벤트] 오늘은 대박 쿠키 데이! 모든 미션 성공 시 쿠키가 무조건 2배! 선생님이 다했니에서 2배로 쏩니다! 🔥", alert: "🎉 대박! 오늘은 하루 종일 [쿠키 2배 이벤트]가 진행됩니다!" },
            { label: "🍀즐거운 날", color: "#4caf50", title: "✨ 오늘도 빛나는 3학년 5반! 서로를 배려하며 즐겁게 공부합시다 ✨", alert: "🍀 오늘은 차분하고 싱그러운 [새싹 데이]입니다. 우리 반 생태 정원을 성실하게 가꾸어 봅시다!" },
            { label: "보너스 +1", color: "#ff9800", title: "✨ [오늘의 이벤트] 오늘은 보너스 쿠키 데이! 쿠키를 받을 때마다 선생님이 +1개 더 보너스로 쏩니다! ✨", alert: "🎁 오늘은 하루 종일 [쿠키 +1개 더 이벤트]가 진행됩니다!" },
            { label: "🍀행복한 날", color: "#4caf50", title: "✨ 오늘도 빛나는 3학년 5반! 서로를 배려하며 즐겁게 공부합시다 ✨", alert: "🌱 오늘은 나만의 보석을 모으는 [꾸준함 데이]입니다. 평소처럼 성실하게 내 가치를 높여볼까요?" },
            { label: "럭키 마니또", color: "#e91e63", title: "🤝 [오늘의 이벤트] 오늘은 럭키 마니또 데이! 내가 쿠키를 받으면, 우리 모둠 친구에게도 쿠키 1개 선물! 🤝", alert: "🤝 오늘은 하루 종일 [럭키 마니또 데이]입니다! 서로 응원하도록 독려해 주세요." },
            { label: "🍀좋은 날", color: "#4caf50", title: "✨ 오늘도 빛나는 3학년 5반! 서로를 배려하며 즐겁게 공부합시다 ✨", alert: "🌈 오늘은 평화롭고 다정한 [기본 모드]입니다. 친구와 함께 웃으며 오늘도 파이팅!" },
            { label: "전원 통과", color: "#9c27b0", title: "💪 [오늘의 이벤트] 전원 통과 도전 데이! 우리 반 전원이 오늘 쿠키를 받으면 모두에게 +1개씩 추가 보너스! 💪", alert: "💪 오늘은 [전원 통과 도전 데이]입니다! 친구들이 서로 돕도록 이끌어주세요." },
            { label: "🍀기쁜 날", color: "#4caf50", title: "✨ 오늘도 빛나는 3학년 5반! 서로를 배려하며 즐겁게 공부합시다 ✨", alert: "🍀 오늘은 차분하고 싱그러운 [새싹 데이]입니다. 우리 반 생태 정원을 성실하게 가꾸어 봅시다!" },
            { label: "얼리버드", color: "#2196f3", title: "⏰ [오늘의 이벤트] 오늘은 얼리버드 데이! 오전 10시 전까지 미션을 완료해 제출하면 쿠키 +1개 보너스! ⏰", alert: "⏰ 오늘은 [얼리버드 데이]입니다! 10시 전 제출자에게 보너스를 챙겨주세요." },
            { label: "행운의 369", color: "#00bcd4", title: "🎰 [오늘의 이벤트] 오늘은 행운의 369 데이! 오늘 '순서' 카드에서 3, 6, 9, 13, 16, 19번인 친구는 쿠키가 2배! 🎰", alert: "🎰 오늘은 [행운의 369 데이]입니다! 해당 번호 친구들의 이름표가 황금빛으로 반짝입니다✨", isLucky369: true },
        ]
};