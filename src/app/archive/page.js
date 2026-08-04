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

const ARCHIVES = [];

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
