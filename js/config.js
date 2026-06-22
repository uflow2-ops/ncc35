﻿﻿﻿﻿const CLASS_CONFIG = {
    neisApiKey: '선생님의_나이스_API_키',
    dahandinApiKey: '선생님의_다했니_API_키',
    weatherKey: '선생님의_기상청_API_키',
    
    school: {
        atpt: 'K10',
        code: '7812058'
    },
    locations: [
        { name: "춘천", nx: 73, ny: 133 },
        { name: "서울", nx: 60, ny: 127 },
        { name: "부산", nx: 98, ny: 76 },
        { name: "대구", nx: 89, ny: 90 },
        { name: "인천", nx: 54, ny: 125 },
        { name: "광주", nx: 58, ny: 74 },
        { name: "대전", nx: 67, ny: 100 },
        { name: "울산", nx: 102, ny: 84 },
        { name: "세종", nx: 66, ny: 103 },
        { name: "수원", nx: 60, ny: 121 },
        { name: "고양", nx: 57, ny: 128 },
        { name: "용인", nx: 64, ny: 119 },
        { name: "성남", nx: 63, ny: 123 },
        { name: "청주", nx: 69, ny: 107 },
        { name: "전주", nx: 63, ny: 89 },
        { name: "제주", nx: 52, ny: 38 }
    ],
    defaultLocationIndex: 0,
    weatherGrid: { nx: 73, ny: 133 },
    studentData: [], // 개인 정보 보호를 위해 GitHub 저장소에는 빈 배열로 유지합니다.
    subjects: ["국어", "사회", "수학", "과학", "도덕", "체육", "음악", "미술", "실과", "영어", "창체", "-"],
    subIcons: { "국어":"📖", "사회":"🌍", "수학":"🔢", "과학":"🧪", "도덕":"🤝", "체육":"🏃", "음악":"🎵", "미술":"🎨", "실과":"🛠️", "영어":"🔤", "창체":"🌟", "-":"⚪" },
    defaultMarqueeMsg: "✨ 오늘도 빛나는 3학년 5반! 서로를 배려하며 즐겁게 공부합시다 ✨",
    alarmSoundUrl: "https://t1.daumcdn.net/cfile/tistory/99412B355A70265C2D?original" 
};
