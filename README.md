# FitPath

개인 신체 정보와 목표 기간을 바탕으로 맞춤형 다이어트 플랜과 웰니스 상품을 보여주는 정적 데모입니다.

## 포함 기능

- 이름·연령대·계산 기준·키·현재 체중·목표 체중·기간 입력
- 입력값 변경에 따른 BMI 참고값, 속도 안내, 현재/목표 모형 실시간 업데이트
- 적응기·진행기·유지기의 운동·식단·건강기능식품 가이드
- 상품 장바구니와 데모 주문
- 기록 저장, 체크인, 목표 진행률, 구매 이력, 성공 기프트 조건 확인
- 브라우저 `localStorage` 기반 데모 데이터 보존

## D1 회원·기록 저장

`migrations/0001_fitpath.sql`에 회원(users), 세션(sessions), 목표 스냅샷(snapshots), 체크인(checkins) 테이블이 정의되어 있습니다. Cloudflare 계정에서 D1 데이터베이스를 만든 뒤 `wrangler.jsonc`의 `d1_databases` 주석 블록에 database_id를 넣고 마이그레이션을 적용하면 회원가입·로그인과 저장 버튼이 D1에 연결됩니다. 비밀번호는 Worker Web Crypto의 PBKDF2로 해시하고 세션은 HttpOnly 쿠키로 관리합니다.

## 실행

별도 빌드가 필요 없는 정적 파일입니다. `index.html`을 브라우저로 열거나 정적 서버로 제공하면 됩니다.

Cloudflare Pages 배포 예시:

```bash
npx wrangler pages deploy . --project-name fitpath
```

이 데모의 주문·기록은 실제 결제나 의료 서비스가 아니며 브라우저에만 저장됩니다. 실제 서비스로 확장할 때는 DESIGN.md의 개인정보, 건강기능식품, 결제, 배송, 전문가 검수 항목을 구현해야 합니다.
