#!/bin/bash
# 로컬 배포 전 API 키 주입 스크립트

# 0. 환경 확인: Wrangler CLI 설치 여부 체크
if ! command -v wrangler &> /dev/null; then
    if ! npx wrangler --version &> /dev/null; then
        echo "❌ Wrangler CLI를 찾을 수 없습니다."
        echo "💡 해결을 위해 다음 명령어를 실행하여 전역 설치를 진행해 주세요:"
        echo "   npm install -g wrangler"
    fi
fi

echo "🚀 배포를 위해 js/config.js의 API 키를 치환합니다..."
echo "🚀 [Step 1] API 키 확인 및 주입 시작"

# 0.5. .env 파일이 있으면 키를 자동으로 불러옵니다 (분실 방지 및 자동 입력)
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo "📝 .env 파일에서 API 키 설정을 확인했습니다."
fi

# 1. 환경 변수 체크 및 부족한 경우 사용자로부터 직접 입력 받음
[ -z "$NEIS_API_KEY" ] && read -p "⚠️ NEIS_API_KEY 입력: " NEIS_API_KEY
[ -z "$DAHANDIN_API_KEY" ] && read -p "⚠️ DAHANDIN_API_KEY 입력: " DAHANDIN_API_KEY
[ -z "$WEATHER_KEY" ] && read -p "⚠️ WEATHER_KEY 입력: " WEATHER_KEY

# 2. js/config.js 파일의 키를 실제 값으로 치환 (원본 보호를 위해 백업 후 작업)
cp js/config.js js/config.js.bak
cp lunch.html lunch.html.bak

# js/config.js에 있는 한글 텍스트를 실제 입력받은 키로 치환합니다.
sed -i "s|선생님의_나이스_API_키|${NEIS_API_KEY}|g" js/config.js
sed -i "s|선생님의_다했니_API_키|${DAHANDIN_API_KEY}|g" js/config.js
sed -i "s|선생님의_기상청_API_키|${WEATHER_KEY}|g" js/config.js
sed -i "s|선생님의_나이스_API_키|${NEIS_API_KEY}|g" lunch.html

echo "✅ [Step 2] API 키 치환 완료! 배포를 시작합니다."

# 3. 배포 실행 (학교망 보안 정책 우회를 위해 TLS 검사 무시 설정 추가)
export NODE_TLS_REJECT_UNAUTHORIZED=0

if ! npx wrangler pages deploy . --project-name=science-garden; then
    echo "❌ 배포 중 오류가 발생했습니다. Wrangler CLI가 설치되어 있는지, 혹은 네트워크 상태를 확인하세요."
    echo "💡 수동 설치 제안: npm install -g wrangler"
    exit 1
fi

# 4. 설정 복구 (배포가 끝난 후 원본 파일로 되돌립니다)
mv js/config.js.bak js/config.js
mv lunch.html.bak lunch.html

# 보안 설정 원복
unset NODE_TLS_REJECT_UNAUTHORIZED