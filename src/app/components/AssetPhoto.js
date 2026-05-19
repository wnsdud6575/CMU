import Image from 'next/image';

function getAutoGradient(item) {
  if (!item) return 'linear-gradient(135deg, #e2e8f0, #cbd5e1)';
  const cat = item.category || 'H';
  const categoryGradients = {
    A: 'linear-gradient(135deg, #fee2e2, #fecaca)', // 무용복: 분홍
    B: 'linear-gradient(135deg, #fef3c7, #fde68a)', // 국악: 금색/노랑
    C: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', // 의전도열: 하늘색
    D: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', // 단복: 보라/남색
    E: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)', // 연극의상: 연보라
    G: 'linear-gradient(135deg, #fae8ff, #f5d0fe)', // 특수의상: 마젠타
    Z: 'linear-gradient(135deg, #e2fbf4, #ccfbf1)', // 소품: 청록/민트
    H: 'linear-gradient(135deg, #cbd5e1, #94a3b8)', // 기타: 회색
  };
  return categoryGradients[cat] || 'linear-gradient(135deg, #e2e8f0, #cbd5e1)';
}

export default function AssetPhoto({ item, label, size = 'md' }) {
  const name = item?.name || label || '자산';
  const initials = name.replace(/\s/g, '').slice(0, 2);
  const style = item?.photo ? undefined : { background: getAutoGradient(item) };

  return (
    <div className={`asset-photo asset-photo-${size}`} style={style}>
      {item?.photo ? (
        <Image src={item.photo} alt={`${name} 사진`} fill sizes="160px" unoptimized />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
