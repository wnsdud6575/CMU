# 대여 시작/승낙 시 물품 수령 장소 지정 및 사용자 고지 Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** 관리자가 대여 승낙 또는 대여 시작 시 물품 수령 장소를 필수로 입력하도록 강제하고, 대여일이 되었을 때 장소가 지정되어 있는 경우에만 자동으로 대여중 상태로 넘어가며, 일반 사용자의 대여 현황 화면에서 수령 장소를 시인성 높게 볼 수 있도록 구현합니다.

**Architecture:** 
- `AppContext.js`에서 Supabase DB의 `pickup_location` 컬럼 매핑을 읽기/쓰기 및 대여 신청 시에 동기화하고, 자동 대여 상태 전환 조건에 장소 기입 유무를 추가합니다.
- `rentals/page.js` (관리자 칸반/모달)에서 승낙/대여시작 시 빈칸 텍스트 인풋을 제공하여 입력을 필수 검증합니다.
- `rentals/page.js` 드래그앤드롭 핸들러에 브라우저 `prompt` 검증을 도입하여 장소 입력 없이는 드래그 전환을 불허합니다.
- `rentals/my/page.js` (사용자 대여 내역)에 대여 수령 장소를 나타내는 아이콘 및 텍스트 컴포넌트를 추가합니다.

**Tech Stack:** Next.js, React Context API, Tailwind CSS/Vanilla CSS, Supabase Client

---

### Task 1: `AppContext.js` 데이터 동기화 및 자동 전환 로직 보강

**Files:**
- Modify: `src/app/context/AppContext.js`

**Step 1: Code 구현**
- `updateRental` 함수 내부에서 `updates.pickupLocation`이 주어졌을 때 `dbUpdates.pickup_location = updates.pickupLocation;` 매핑 추가.
- `addRental` 함수 내부에서 `pickup_location: rental.pickupLocation || ''` 추가 및 반환 데이터 바인딩 시 `pickupLocation: data[0].pickup_location` 매핑 추가.
- `fetchSupabaseData` 내 자동 `renting` 전환 조건에 `r.pickup_location` 존재 유무 확인 추가:
  ```javascript
  if (status === 'approved' && r.pickup_date && r.pickup_date <= todayStr && r.pickup_location) { ... }
  ```

**Step 2: 빌드 확인 및 코드 검증**
- `npm run build` 혹은 린터 실행을 통해 syntax 에러가 없는지 확인.

**Step 3: Commit**
```bash
git add src/app/context/AppContext.js
git commit -m "feat: sync pickupLocation in AppContext and update auto renting transition condition"
```

---

### Task 2: 관리자 모달 내 수령 장소 입력 필드 추가 및 승낙/대여시작 검증

**Files:**
- Modify: `src/app/rentals/page.js`

**Step 1: Code 구현**
- `RentalsKanban` 컴포넌트 내부에 모달에서 활용할 로컬 장소 상태 `const [pickupLocationInput, setPickupLocationInput] = useState('');` 선언.
- `openRental` 호출 시 `setPickupLocationInput(rental.pickupLocation || '');` 설정하도록 추가.
- 모달 바디(`modal-body`) 내부 비고/메모 단락 위에 `requested` 또는 `approved` 상태일 때 수령 장소를 입력할 수 있는 필드 배치:
  ```jsx
  {(selectedRental.status === 'requested' || selectedRental.status === 'approved') && (
    <div className="form-group" style={{ marginBottom: '16px' }}>
      <label className="form-label" style={{ fontWeight: 700 }}>물품 수령/보관 장소 (필수)</label>
      <input 
        type="text" 
        className="form-input" 
        value={pickupLocationInput} 
        onChange={(e) => setPickupLocationInput(e.target.value)} 
        placeholder="예: 지하 1층 의상창고, 7층 로비 사물함"
      />
    </div>
  )}
  ```
- 이미 대여중(`renting`), 반납신청(`return-req`), 반납완료(`returned`) 상태일 때는 읽기 전용 텍스트로 노출:
  ```jsx
  {!['requested', 'approved'].includes(selectedRental.status) && selectedRental.pickupLocation && (
    <div className="detail-section" style={{ marginBottom: '16px' }}>
      <div className="detail-section-title">물품 수령/보관 장소</div>
      <div className="memo-box" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 'bold' }}>
        📍 {selectedRental.pickupLocation}
      </div>
    </div>
  )}
  ```
- 모달 푸터 버튼 액션 시 검증 추가:
  - 승낙 처리 클릭 시: 장소가 비어있으면 `alert('물품 수령/보관 장소를 입력해주세요.')` 표시 후 중단. 통과 시 `updateRental(selectedRental.id, { status: 'approved', pickupLocation: pickupLocationInput.trim() }); setSelectedRental(null);`
  - 대여 시작 클릭 시: 장소가 비어있으면 `alert('물품 수령/보관 장소를 입력해주세요.')` 표시 후 중단. 통과 시 `updateRental(selectedRental.id, { status: 'renting', pickupLocation: pickupLocationInput.trim() }); setSelectedRental(null);`

**Step 2: 수동 확인**
- 관리자 화면에서 카드를 열고 장소를 비워둔 채 "승낙 처리" 혹은 "대여 시작" 버튼을 클릭하여 경고가 나타나는지 확인.
- 장소를 기입하고 클릭했을 때 성공적으로 업데이트되는지 확인.

**Step 3: Commit**
```bash
git add src/app/rentals/page.js
git commit -m "feat: add pickupLocation input field in admin modal with required validation"
```

---

### Task 3: 관리자 칸반 보드 드래그 앤 드롭 시 수령 장소 prompt 검증

**Files:**
- Modify: `src/app/rentals/page.js`

**Step 1: Code 구현**
- `handleDrop` 함수 내부에서 `targetStatus === 'approved'` 또는 `targetStatus === 'renting'` 일 때의 분기 처리 추가:
  ```javascript
  if (targetStatus === 'approved' || targetStatus === 'renting') {
    const loc = prompt("물품 수령/보관 장소를 입력해주세요 (필수):");
    if (!loc || !loc.trim()) {
      alert("수령 장소를 입력해야 승낙/대여 시작 처리가 가능합니다.");
      setDraggedItem(null);
      return;
    }
    updateRental(draggedItem, { status: targetStatus, pickupLocation: loc.trim() });
    setDraggedItem(null);
    return;
  }
  ```

**Step 2: 수동 확인**
- 칸반 보드에서 신청 대기 중인 카드를 `대여승낙` 혹은 `대여중`으로 드래그할 때 prompt 창이 나타나는지 테스트.
- 빈 값 또는 취소를 입력하면 카드 상태가 변경되지 않고 제자리에 머무는지 확인.
- 장소를 입력하면 상태 변경 및 장소 저장이 올바르게 되는지 확인.

**Step 3: Commit**
```bash
git add src/app/rentals/page.js
git commit -m "feat: prompt for pickupLocation on admin kanban drag and drop"
```

---

### Task 4: 일반 사용자 대여 신청 현황 화면 내 수령 장소 정보 노출

**Files:**
- Modify: `src/app/rentals/my/page.js`

**Step 1: Code 구현**
- 신청 정보 카드 렌더링 영역 내에 `pickupLocation` 노출 컴포넌트 추가.
- 카드의 '대여 품목 정보' 하단 혹은 '신청 목적' 하단에 다음과 같이 추가:
  ```jsx
  {rental.pickupLocation && (
    <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '12.5px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontWeight: 800 }}>📍 물건 수령 장소:</span>
      <strong style={{ textDecoration: 'underline' }}>{rental.pickupLocation}</strong>
    </div>
  )}
  ```

**Step 2: 수동 확인**
- 사용자 화면 (`/rentals/my`)에서 수령 장소가 지정된 대여 건 카드를 보고 📍 물건 수령 장소 안내가 깔끔하고 직관적으로 렌더링되는지 확인.

**Step 3: Commit**
```bash
git add src/app/rentals/my/page.js
git commit -m "feat: display pickupLocation in user rentals page"
```

---

### Task 5: 전체 빌드 테스트 및 최종 연동 확인

**Step 1: Build Test**
- `npm run build` 명령을 실행하여 모든 Next.js 빌드가 오류 없이 통과하는지 검증.

**Step 2: DDL 안내 문서 작성 및 최종 완료**
- 변경 내용을 점검하고 사용자에게 안내.
