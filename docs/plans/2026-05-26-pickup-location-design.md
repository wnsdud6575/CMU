# 대여 시작/승낙 시 물품 수령 장소 기록 및 사용자 고지 설계 문서 (2026-05-26)

## 1. 개요
대여 신청된 물품의 보관/수령 장소를 관리자가 대여 승낙 또는 대여 시작 시점에 정확히 지정할 수 있도록 하고, 일반 사용자가 대여 신청 현황에서 수령 장소를 파악하여 물건을 원활하게 수령할 수 있도록 설계합니다.

## 2. 요구사항 및 요구 배경
- 대여를 시작하거나 승낙하는 시점에 물건을 모아둔 수령 장소(`pickupLocation`)를 필수적으로 지정해야 함.
- 보관 장소의 기본값을 자산의 원래 위치로 자동 설정하지 않고, 관리자가 매번 빈칸에서 직접 입력하도록 유도함.
- 수령 장소가 입력되어 있고 수령 예정일(`pickupDate`)이 오늘이 되었을 때만 `approved` -> `renting` 상태로 자동 전환되어야 함.
- 사용자는 `나의 대여 신청 현황`에서 수령 장소를 시각적으로 쉽게 인지할 수 있어야 함.

## 3. 세부 설계 및 아키텍처

### 3.1. DB 스키마 및 API 연동 (`AppContext.js`)
- `rentals` 테이블의 `pickup_location` 컬럼을 활용.
- `updateRental(id, updates)` API 매핑에 `pickupLocation` 속성을 `pickup_location` DB 필드로 동기화하는 로직 추가.
- `addRental` API에도 `pickupLocation` 저장 및 초기화 매핑 추가.
- **자동 대여 전환 로직 보강**:
  - `fetchSupabaseData` 내 자동 `renting` 전환 필터 조건에 `r.pickup_location` 검증 추가:
    ```javascript
    if (status === 'approved' && r.pickup_date && r.pickup_date <= todayStr && r.pickup_location) {
      status = 'renting';
      // Supabase Update
    }
    ```

### 3.2. 관리자 화면 상세 모달 및 칸반 보드 (`rentals/page.js`)
- **상세 모달 (상태 전환 버튼 검증)**:
  - `status === 'requested'`(대여신청) 혹은 `status === 'approved'`(대여승낙)일 때 수령 장소를 입력받을 수 있는 입력창(`input type="text"`) 노출.
  - 관리자가 승낙 처리 또는 대여 시작 버튼을 누를 때 장소 입력이 비어있으면 `alert("물품 수령/보관 장소를 입력해주세요.")`를 띄우고 상태 전환을 제한.
  - 올바르게 입력된 경우 `updateRental`을 호출하여 상태 변경과 `pickupLocation` 입력을 저장.
- **칸반 보드 (드래그앤드롭 검증)**:
  - 카드를 `approved` 또는 `renting` 열로 드래그하여 드롭할 때 브라우저 `prompt` 대화상자를 띄워 수령 장소를 수집.
  - 취소하거나 빈 칸을 제출하면 드롭 처리를 취소하고 원상복귀.

### 3.3. 일반 사용자 대여 신청 현황 (`rentals/my/page.js`)
- 카드 내부의 대여 품목 정보 혹은 일정 요약 영역 근처에 `pickupLocation` 정보 렌더링.
- 디자인 시안:
  ```markdown
  📍 물건 수령 장소: [장소 명칭]
  ```
- 승인 완료(`approved`) 혹은 대여중(`renting`)인 카드에서 시인성이 높도록 배지와 컬러 가이드를 사용하여 강조 처리.

## 4. 검증 계획
1. **모달 검증**: 빈 값인 상태에서 승낙/대여시작 누를 때 경고창 발생 및 상태 업데이트 실패 확인. 장소 기입 후 성공 처리 확인.
2. **드래그 검증**: 칸반 드롭 시 prompt 창 출력 및 취소 시 상태 변경 롤백 확인. 장소 기입 후 성공 처리 및 DB 반영 확인.
3. **자동 대여 전환 검증**: `pickup_date`가 오늘 이전이고 `pickup_location`이 있는 대여만 `renting`으로 전환되는지 코드 및 동작 점검.
4. **빌드 검증**: `npm run build`를 수행하여 정적 타입 및 린트 검증 수행.
