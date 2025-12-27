// utils/compressImage.jsx
export const compressImage = (file, maxWidth, quality) => {
    return new Promise((resolve, reject) => {
        // ВАЖНО: Проверяем что file существует
        if (!file) {
            reject(new Error('File is null or undefined'));
            return;
        }

        // Проверяем что это File или Blob
        if (!(file instanceof Blob) && !(file instanceof File)) {
            reject(new Error('Invalid file type. Expected File or Blob'));
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Рассчитываем новые размеры
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    const ratio = maxWidth / width;
                    width = maxWidth;
                    height = height * ratio;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Конвертируем в Blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas toBlob returned null'));
                        }
                    },
                    'image/jpeg', // Всегда конвертируем в JPEG
                    quality
                );
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
};