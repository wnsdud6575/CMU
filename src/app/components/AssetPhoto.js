import Image from 'next/image';

export default function AssetPhoto({ item, label, size = 'md' }) {
  const name = item?.name || label || '자산';
  const initials = name.replace(/\s/g, '').slice(0, 2);
  const style = item?.photo ? undefined : { background: item?.photoTone || 'linear-gradient(135deg, #e0f2fe, #ccfbf1)' };

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
