'use client';
import { useState } from 'react';

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'year', label: '연도별' },
  { id: 'event', label: '행사별' },
  { id: 'manual', label: '매뉴얼' },
  { id: 'template', label: '서식' },
  { id: 'admin', label: '행정/지원' },
];

const ARCHIVES = [
  { type: 'folder', category: 'year', name: '2026년 업무 히스토리', path: '연도별 / 2026', date: '2026.04.29', items: 18, owner: '관리자' },
  { type: 'folder', category: 'event', name: '승리컵 축구복 프로젝트', path: '행사별 / 승리컵', date: '2026.04.28', items: 9, owner: '의상관리' },
  { type: 'folder', category: 'manual', name: '행사 운영 매뉴얼', path: '매뉴얼 / 운영', date: '2026.04.20', items: 7, owner: '파트장' },
  { type: 'doc', category: 'manual', name: '표준 업무 분장표.pdf', path: '매뉴얼 / 기본 가이드', date: '2026.04.18', size: '480KB', owner: '파트장' },
  { type: 'doc', category: 'template', name: '신규 의상 구입 품의서 양식.docx', path: '서식 / 행정', date: '2026.04.15', size: '15KB', owner: '행정' },
  { type: 'doc', category: 'admin', name: '2026년 4월 대여 결산 보고서.pdf', path: '행정/지원 / 실적', date: '2026.04.29', size: '2.4MB', owner: '관리자' },
  { type: 'image', category: 'event', name: '북의상_정면_좌측_우측.zip', path: '행사별 / 북 의상', date: '2026.04.25', size: '38MB', owner: '아카이브' },
];

export default function ArchivePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filteredArchives = ARCHIVES.filter(item => {
    const matchCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchSearch = !search.trim() || [item.name, item.path, item.owner].join(' ').toLowerCase().includes(search.trim().toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">아카이빙 / 자료실</h2>
          <div className="card-subtitle">완료된 업무, 매뉴얼, 서식, 행사 자료를 폴더 구조로 보관합니다.</div>
        </div>
        <div>
          <button className="btn btn-secondary" style={{ marginRight: '8px' }}>새 폴더</button>
          <button className="btn btn-primary">업로드</button>
        </div>
      </div>

      <div className="card-body">
        <div className="archive-layout">
          <aside className="archive-sidebar">
            {CATEGORIES.map(category => (
              <button
                key={category.id}
                type="button"
                className={activeCategory === category.id ? 'active' : ''}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.label}
                <span>{category.id === 'all' ? ARCHIVES.length : ARCHIVES.filter(item => item.category === category.id).length}</span>
              </button>
            ))}
          </aside>

          <section className="archive-main">
            <div className="filter-bar">
              <div className="search-input-wrapper">
                <span className="search-icon">검색</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="파일, 폴더, 담당자 검색"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select className="form-select" style={{ width: '150px' }}>
                <option>최신순</option>
                <option>이름순</option>
                <option>담당자순</option>
              </select>
            </div>

            <div className="archive-grid">
              {filteredArchives.map((item, idx) => (
                <div key={idx} className="archive-card">
                  <div className="archive-card-top">
                    <div className={`archive-icon ${item.type}`}>{item.type === 'folder' ? 'F' : item.type === 'doc' ? 'D' : 'I'}</div>
                    <button type="button">...</button>
                  </div>
                  <div>
                    <div className="archive-name">{item.name}</div>
                    <div className="muted-line">{item.path}</div>
                  </div>
                  <div className="archive-meta">
                    <span>{item.date}</span>
                    <span>{item.type === 'folder' ? `${item.items}개 항목` : item.size}</span>
                  </div>
                  <div className="archive-owner">담당 {item.owner}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
