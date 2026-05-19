import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn("Supabase 환경변수가 설정되지 않았습니다. Vercel 빌드 통과를 위해 임시 값으로 초기화합니다. 실제 서비스 시 환경변수를 설정해주세요.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 💡 클라이언트 측 초경량 이미지 압축 헬퍼 함수 (Canvas 기반)
const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    // 이미지가 아니면 압축을 건너뜀
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = typeof window !== 'undefined' ? new window.Image() : null;
      if (!img) return resolve(file);
      
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 원본 비율을 유지하며 최대 해상도 내로 축소
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG 80% 화질로 압축하여 Blob 생성
        canvas.toBlob((blob) => {
          if (!blob) {
            return resolve(file);
          }
          // 원본 파일명을 안전하게 .jpg로 치환
          const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
          const compressedFile = new File([blob], cleanName, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Storage에 이미지를 업로드하고 Public URL을 반환하는 함수 (압축 연동)
export const uploadItemPhoto = async (file) => {
  if (!file) return null;
  
  // 1. 클라이언트 측에서 먼저 스마트 압축 실행
  let fileToUpload = file;
  try {
    fileToUpload = await compressImage(file, 800, 800, 0.8);
    console.log(`[Image Compress] Original: ${(file.size / 1024).toFixed(1)}KB -> Compressed: ${(fileToUpload.size / 1024).toFixed(1)}KB`);
  } catch (compressErr) {
    console.warn("클라이언트 압축 실패, 원본 파일로 업로드를 시도합니다.", compressErr);
  }
  
  // 파일명을 유니크하게 만들기 위해 시간값 추가 (예: 162384712_table.jpg)
  const fileExt = fileToUpload.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `items/${fileName}`;

  // 'item-photo'라는 이름의 버킷에 업로드
  const { data, error } = await supabase.storage
    .from('item-photo')
    .upload(filePath, fileToUpload);

  if (error) {
    console.error('Storage 업로드 에러:', error.message);
    throw error;
  }

  // 업로드 성공 시 Public URL 추출
  const { data: publicUrlData } = supabase.storage
    .from('item-photo')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};
